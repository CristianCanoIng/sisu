-- SISU - Flujo de incapacidades
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase usado por SISU.
-- Flujo: Estudiante/Profesor de apoyo -> Enfermería -> Coordinación.

BEGIN;

ALTER TABLE public.incapacidades ADD COLUMN IF NOT EXISTS radicada_por BIGINT REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL;
ALTER TABLE public.incapacidades ADD COLUMN IF NOT EXISTS revisada_enfermeria_por BIGINT REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL;
ALTER TABLE public.incapacidades ADD COLUMN IF NOT EXISTS fecha_revision_enfermeria TIMESTAMPTZ;
ALTER TABLE public.incapacidades ADD COLUMN IF NOT EXISTS observacion_enfermeria TEXT;
ALTER TABLE public.incapacidades ADD COLUMN IF NOT EXISTS revisada_coordinacion_por BIGINT REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL;
ALTER TABLE public.incapacidades ADD COLUMN IF NOT EXISTS fecha_revision_coordinacion TIMESTAMPTZ;
ALTER TABLE public.incapacidades ADD COLUMN IF NOT EXISTS observacion_coordinacion TEXT;

UPDATE public.incapacidades i
SET radicada_por=p.id_usuario
FROM public.pacientes p
WHERE p.id_paciente=i.id_paciente AND i.radicada_por IS NULL;

-- Ampliar primero la columna y retirar temporalmente la restricción anterior.
-- Los nuevos estados superan los 20 caracteres y no pertenecen al CHECK antiguo.
ALTER TABLE public.incapacidades ALTER COLUMN estado TYPE VARCHAR(40);
ALTER TABLE public.incapacidades DROP CONSTRAINT IF EXISTS incapacidades_estado_check;

UPDATE public.incapacidades SET estado='Radicada' WHERE estado='En revisión';
UPDATE public.incapacidades SET estado='Rechazada por Coordinación' WHERE estado='Rechazada';

ALTER TABLE public.incapacidades ADD CONSTRAINT incapacidades_estado_check
CHECK (estado IN ('Radicada','Pendiente coordinación','Aprobada','Rechazada por Enfermería','Rechazada por Coordinación'));

CREATE INDEX IF NOT EXISTS idx_incapacidades_radicada_por ON public.incapacidades(radicada_por);
CREATE INDEX IF NOT EXISTS idx_incapacidades_estado ON public.incapacidades(estado);

COMMIT;

CREATE OR REPLACE FUNCTION public.listar_estudiantes_incapacidades()
RETURNS TABLE(id_paciente bigint,id_usuario bigint,nombre varchar,codigo_estudiantil varchar,programa_academico varchar)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF public.mi_rol()<>5 THEN RAISE EXCEPTION 'Sin permiso para consultar estudiantes'; END IF;
 RETURN QUERY
 SELECT p.id_paciente,u.id_usuario,u.nombre,p.codigo_estudiantil,p.programa_academico
 FROM public.pacientes p
 JOIN public.usuarios u ON u.id_usuario=p.id_usuario
 WHERE u.id_rol=3 AND u.estado='Activo'
 ORDER BY u.nombre;
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
 UPDATE public.incapacidades
 SET estado=CASE WHEN p_aprobar THEN 'Pendiente coordinación' ELSE 'Rechazada por Enfermería' END,
     revisada_enfermeria_por=uid,
     fecha_revision_enfermeria=NOW(),
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
 UPDATE public.incapacidades
 SET estado=CASE WHEN p_aprobar THEN 'Aprobada' ELSE 'Rechazada por Coordinación' END,
     revisada_coordinacion_por=uid,
     fecha_revision_coordinacion=NOW(),
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

DROP POLICY IF EXISTS incapacidades_read ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_student_insert ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_manage ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_submit ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_admin_update ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_delete ON public.incapacidades;

CREATE POLICY incapacidades_read ON public.incapacidades FOR SELECT TO authenticated USING(
 public.mi_rol() IN (1,2,4)
 OR EXISTS(SELECT 1 FROM public.pacientes p WHERE p.id_paciente=incapacidades.id_paciente AND p.id_usuario=public.mi_usuario_id())
 OR (public.mi_rol()=5 AND incapacidades.radicada_por=public.mi_usuario_id())
);

CREATE POLICY incapacidades_submit ON public.incapacidades FOR INSERT TO authenticated WITH CHECK(
 radicada_por=public.mi_usuario_id()
 AND (
  (public.mi_rol()=3 AND EXISTS(SELECT 1 FROM public.pacientes p WHERE p.id_paciente=incapacidades.id_paciente AND p.id_usuario=public.mi_usuario_id()))
  OR public.mi_rol()=5
 )
 AND estado='Radicada'
);

CREATE POLICY incapacidades_admin_update ON public.incapacidades FOR UPDATE TO authenticated
USING(public.mi_rol()=1) WITH CHECK(public.mi_rol()=1);

CREATE POLICY incapacidades_delete ON public.incapacidades FOR DELETE TO authenticated USING(public.mi_rol()=1);

DROP POLICY IF EXISTS incap_storage_read ON storage.objects;
CREATE POLICY incap_storage_read ON storage.objects FOR SELECT TO authenticated USING(
 bucket_id='incapacidades' AND (
  public.mi_rol() IN (1,2,4)
  OR (storage.foldername(name))[1]=public.mi_usuario_id()::text
  OR EXISTS(
   SELECT 1
   FROM public.incapacidades i
   JOIN public.pacientes p ON p.id_paciente=i.id_paciente
   WHERE i.archivo_soporte=name
     AND (p.id_usuario=public.mi_usuario_id() OR i.radicada_por=public.mi_usuario_id())
  )
 )
);

UPDATE public.roles
SET descripcion='Profesor de apoyo: radica incapacidades y consulta su estado'
WHERE id_rol=5;

-- Solicitar a PostgREST/Supabase que recargue el esquema y detecte las RPC nuevas.
NOTIFY pgrst, 'reload schema';
