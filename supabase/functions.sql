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
