CREATE OR REPLACE FUNCTION public.mi_usuario_id() RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id_usuario FROM public.usuarios WHERE auth_user_id=auth.uid() LIMIT 1 $$;
CREATE OR REPLACE FUNCTION public.mi_rol() RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT id_rol FROM public.usuarios WHERE auth_user_id=auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.ajustar_stock(p_id_inventario bigint,p_tipo text,p_cantidad integer,p_motivo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actual integer; nueva integer; uid bigint;
BEGIN
 IF public.mi_rol() NOT IN (1,2,4) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
 IF p_cantidad<=0 OR p_tipo NOT IN ('Entrada','Salida') THEN RAISE EXCEPTION 'Movimiento inválido'; END IF;
 uid:=public.mi_usuario_id();
 SELECT cantidad INTO actual FROM inventario WHERE id_inventario=p_id_inventario FOR UPDATE;
 IF actual IS NULL THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;
 nueva:=CASE WHEN p_tipo='Entrada' THEN actual+p_cantidad ELSE actual-p_cantidad END;
 IF nueva<0 THEN RAISE EXCEPTION 'Stock insuficiente'; END IF;
 UPDATE inventario SET cantidad=nueva,estado=CASE WHEN nueva=0 THEN 'Agotado' ELSE 'Disponible' END WHERE id_inventario=p_id_inventario;
 INSERT INTO movimiento_inventario(id_inventario,tipo,cantidad,motivo,usuario_id) VALUES(p_id_inventario,p_tipo,p_cantidad,COALESCE(p_motivo,'Ajuste manual'),uid);
END $$;

CREATE OR REPLACE FUNCTION public.inscribirse_actividad(p_actividad bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid bigint; cupos integer;
BEGIN
 uid:=public.mi_usuario_id(); IF uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
 SELECT cupos_disponibles INTO cupos FROM actividades_bienestar WHERE id_actividad=p_actividad AND estado='Activa' FOR UPDATE;
 IF cupos IS NULL OR cupos<=0 THEN RAISE EXCEPTION 'No hay cupos disponibles'; END IF;
 INSERT INTO inscripciones_bienestar(id_actividad,id_usuario) VALUES(p_actividad,uid);
 UPDATE actividades_bienestar SET cupos_disponibles=cupos_disponibles-1 WHERE id_actividad=p_actividad;
END $$;

CREATE OR REPLACE FUNCTION public.cancelar_inscripcion_actividad(p_actividad bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid bigint; borradas integer;
BEGIN
 uid:=public.mi_usuario_id();
 DELETE FROM inscripciones_bienestar WHERE id_actividad=p_actividad AND id_usuario=uid;
 GET DIAGNOSTICS borradas=ROW_COUNT;
 IF borradas>0 THEN UPDATE actividades_bienestar SET cupos_disponibles=LEAST(cupo_maximo,COALESCE(cupos_disponibles,0)+1) WHERE id_actividad=p_actividad; END IF;
END $$;


CREATE OR REPLACE FUNCTION public.registrar_prestamo_implemento(
 p_id_implemento bigint,
 p_id_estudiante bigint,
 p_cantidad integer DEFAULT 1,
 p_observaciones text DEFAULT NULL
) RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 uid bigint;
 rol bigint;
 disponible integer;
 estado_item text;
 rol_estudiante bigint;
 prestamo_id bigint;
BEGIN
 uid:=public.mi_usuario_id();
 rol:=public.mi_rol();
 IF uid IS NULL OR rol NOT IN (1,7) THEN RAISE EXCEPTION 'Sin permiso para registrar préstamos'; END IF;
 IF p_cantidad IS NULL OR p_cantidad<=0 THEN RAISE EXCEPTION 'Cantidad inválida'; END IF;

 SELECT cantidad_disponible,estado INTO disponible,estado_item
 FROM public.implementos_deportivos
 WHERE id_implemento=p_id_implemento
 FOR UPDATE;

 IF disponible IS NULL THEN RAISE EXCEPTION 'Implemento no encontrado'; END IF;
 IF estado_item<>'Activo' THEN RAISE EXCEPTION 'El implemento no está habilitado para préstamo'; END IF;
 IF disponible<p_cantidad THEN RAISE EXCEPTION 'No hay suficientes unidades disponibles'; END IF;

 SELECT id_rol INTO rol_estudiante
 FROM public.usuarios
 WHERE id_usuario=p_id_estudiante AND estado='Activo';

 IF rol_estudiante IS DISTINCT FROM 3 THEN RAISE EXCEPTION 'El usuario seleccionado no es un estudiante activo'; END IF;

 UPDATE public.implementos_deportivos
 SET cantidad_disponible=cantidad_disponible-p_cantidad
 WHERE id_implemento=p_id_implemento;

 INSERT INTO public.prestamos_implementos(
  id_implemento,id_estudiante,cantidad,prestado_por,observaciones_salida,estado
 ) VALUES(
  p_id_implemento,p_id_estudiante,p_cantidad,uid,NULLIF(TRIM(p_observaciones),''),'Prestado'
 ) RETURNING id_prestamo INTO prestamo_id;

 RETURN prestamo_id;
END $$;

CREATE OR REPLACE FUNCTION public.registrar_devolucion_implemento(
 p_id_prestamo bigint,
 p_observaciones text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 uid bigint;
 rol bigint;
 item_id bigint;
 qty integer;
BEGIN
 uid:=public.mi_usuario_id();
 rol:=public.mi_rol();
 IF uid IS NULL OR rol NOT IN (1,7) THEN RAISE EXCEPTION 'Sin permiso para registrar devoluciones'; END IF;

 SELECT id_implemento,cantidad INTO item_id,qty
 FROM public.prestamos_implementos
 WHERE id_prestamo=p_id_prestamo AND estado='Prestado'
 FOR UPDATE;

 IF item_id IS NULL THEN RAISE EXCEPTION 'Préstamo activo no encontrado'; END IF;

 UPDATE public.prestamos_implementos
 SET estado='Devuelto',
     fecha_devolucion=NOW(),
     recibido_por=uid,
     observaciones_entrega=NULLIF(TRIM(p_observaciones),'')
 WHERE id_prestamo=p_id_prestamo;

 UPDATE public.implementos_deportivos
 SET cantidad_disponible=LEAST(cantidad_total,cantidad_disponible+qty)
 WHERE id_implemento=item_id;
END $$;

REVOKE ALL ON FUNCTION public.registrar_prestamo_implemento(bigint,bigint,integer,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_devolucion_implemento(bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_prestamo_implemento(bigint,bigint,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_devolucion_implemento(bigint,text) TO authenticated;


-- =========================
-- FLUJO DE INCAPACIDADES
-- =========================
CREATE OR REPLACE FUNCTION public.listar_estudiantes_incapacidades()
RETURNS TABLE(id_paciente bigint,id_usuario bigint,nombre varchar,codigo_estudiantil varchar,programa_academico varchar)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF public.mi_rol()<>5 THEN RAISE EXCEPTION 'Sin permiso para consultar estudiantes'; END IF;
 RETURN QUERY SELECT p.id_paciente,u.id_usuario,u.nombre,p.codigo_estudiantil,p.programa_academico
 FROM public.pacientes p JOIN public.usuarios u ON u.id_usuario=p.id_usuario
 WHERE u.id_rol=3 AND u.estado='Activo' ORDER BY u.nombre;
END $$;

CREATE OR REPLACE FUNCTION public.revisar_incapacidad_enfermeria(p_id_incapacidad bigint,p_aprobar boolean,p_observacion text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid bigint; estado_actual text;
BEGIN
 uid:=public.mi_usuario_id();
 IF uid IS NULL OR public.mi_rol()<>4 THEN RAISE EXCEPTION 'Solo Enfermería puede realizar esta revisión'; END IF;
 SELECT estado INTO estado_actual FROM public.incapacidades WHERE id_incapacidad=p_id_incapacidad FOR UPDATE;
 IF estado_actual IS NULL THEN RAISE EXCEPTION 'Incapacidad no encontrada'; END IF;
 IF estado_actual<>'Radicada' THEN RAISE EXCEPTION 'La incapacidad ya fue revisada por Enfermería'; END IF;
 IF NOT p_aprobar AND NULLIF(TRIM(COALESCE(p_observacion,'')),'') IS NULL THEN RAISE EXCEPTION 'Debes indicar el motivo del rechazo'; END IF;
 UPDATE public.incapacidades SET
  estado=CASE WHEN p_aprobar THEN 'Pendiente coordinación' ELSE 'Rechazada por Enfermería' END,
  revisada_enfermeria_por=uid,fecha_revision_enfermeria=NOW(),
  observacion_enfermeria=NULLIF(TRIM(COALESCE(p_observacion,'')),'')
 WHERE id_incapacidad=p_id_incapacidad;
END $$;

CREATE OR REPLACE FUNCTION public.resolver_incapacidad_coordinacion(p_id_incapacidad bigint,p_aprobar boolean,p_observacion text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid bigint; estado_actual text;
BEGIN
 uid:=public.mi_usuario_id();
 IF uid IS NULL OR public.mi_rol()<>2 THEN RAISE EXCEPTION 'Solo Coordinación puede realizar la aprobación final'; END IF;
 SELECT estado INTO estado_actual FROM public.incapacidades WHERE id_incapacidad=p_id_incapacidad FOR UPDATE;
 IF estado_actual IS NULL THEN RAISE EXCEPTION 'Incapacidad no encontrada'; END IF;
 IF estado_actual<>'Pendiente coordinación' THEN RAISE EXCEPTION 'La incapacidad debe estar aprobada previamente por Enfermería'; END IF;
 IF NOT p_aprobar AND NULLIF(TRIM(COALESCE(p_observacion,'')),'') IS NULL THEN RAISE EXCEPTION 'Debes indicar el motivo del rechazo'; END IF;
 UPDATE public.incapacidades SET
  estado=CASE WHEN p_aprobar THEN 'Aprobada' ELSE 'Rechazada por Coordinación' END,
  revisada_coordinacion_por=uid,fecha_revision_coordinacion=NOW(),
  observacion_coordinacion=NULLIF(TRIM(COALESCE(p_observacion,'')),''),
  aprobado_por=CASE WHEN p_aprobar THEN uid ELSE NULL END,
  fecha_aprobacion=CASE WHEN p_aprobar THEN NOW() ELSE NULL END
 WHERE id_incapacidad=p_id_incapacidad;
END $$;

REVOKE ALL ON FUNCTION public.listar_estudiantes_incapacidades() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revisar_incapacidad_enfermeria(bigint,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolver_incapacidad_coordinacion(bigint,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_estudiantes_incapacidades() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revisar_incapacidad_enfermeria(bigint,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_incapacidad_coordinacion(bigint,boolean,text) TO authenticated;


-- =========================
-- GESTIÓN OPERATIVA DE ESTUDIANTES
-- =========================
CREATE OR REPLACE FUNCTION public.listar_estudiantes_operacion()
RETURNS TABLE(
 id_paciente bigint,
 id_usuario bigint,
 codigo_estudiantil varchar,
 nombre varchar,
 programa_academico varchar,
 semestre integer,
 estado varchar
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF public.mi_rol() NOT IN (1,2,4,5,7) THEN RAISE EXCEPTION 'Sin permiso para consultar estudiantes'; END IF;
 RETURN QUERY
 SELECT p.id_paciente,u.id_usuario,p.codigo_estudiantil,u.nombre,p.programa_academico,p.semestre,u.estado
 FROM public.pacientes p JOIN public.usuarios u ON u.id_usuario=p.id_usuario
 WHERE u.id_rol=3
 ORDER BY p.codigo_estudiantil NULLS LAST,u.nombre;
END $$;

CREATE OR REPLACE FUNCTION public.crear_estudiante_rapido(
 p_codigo text,
 p_nombre text,
 p_programa text DEFAULT NULL,
 p_documento text DEFAULT NULL,
 p_correo text DEFAULT NULL,
 p_telefono text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 uid bigint; pid bigint; existing_uid bigint;
 code text:=NULLIF(TRIM(p_codigo),''); nm text:=NULLIF(TRIM(p_nombre),''); mail text;
BEGIN
 IF public.mi_rol() NOT IN (1,2,4,5,7) THEN RAISE EXCEPTION 'Sin permiso para crear estudiantes'; END IF;
 IF code IS NULL THEN RAISE EXCEPTION 'El ID de estudiante es obligatorio'; END IF;
 IF nm IS NULL THEN RAISE EXCEPTION 'El nombre es obligatorio'; END IF;
 IF code !~ '^[0-9]{4,20}$' THEN RAISE EXCEPTION 'El ID de estudiante debe contener entre 4 y 20 dígitos'; END IF;

 SELECT p.id_paciente,p.id_usuario INTO pid,existing_uid FROM public.pacientes p WHERE p.codigo_estudiantil=code LIMIT 1;
 IF pid IS NOT NULL THEN
  RETURN jsonb_build_object('id_paciente',pid,'id_usuario',existing_uid,'codigo_estudiantil',code,'existente',true);
 END IF;

 mail:=NULLIF(LOWER(TRIM(COALESCE(p_correo,''))),'');
 IF mail IS NULL THEN mail:=LOWER(code)||'@registro.sisu.local'; END IF;
 IF EXISTS(SELECT 1 FROM public.usuarios u WHERE LOWER(u.correo)=mail) THEN RAISE EXCEPTION 'El correo ya está registrado'; END IF;

 INSERT INTO public.usuarios(nombre,correo,documento,telefono,id_rol,estado)
 VALUES(nm,mail,NULLIF(TRIM(COALESCE(p_documento,'')),''),NULLIF(TRIM(COALESCE(p_telefono,'')),''),3,'Activo')
 RETURNING id_usuario INTO uid;

 INSERT INTO public.pacientes(id_usuario,codigo_estudiantil,programa_academico)
 VALUES(uid,code,NULLIF(TRIM(COALESCE(p_programa,'')),''))
 RETURNING id_paciente INTO pid;

 RETURN jsonb_build_object('id_paciente',pid,'id_usuario',uid,'codigo_estudiantil',code,'existente',false);
END $$;

REVOKE ALL ON FUNCTION public.listar_estudiantes_operacion() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.crear_estudiante_rapido(text,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_estudiantes_operacion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_estudiante_rapido(text,text,text,text,text,text) TO authenticated;
