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
