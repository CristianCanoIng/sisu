-- SISU - Gestión operativa de estudiantes por ID institucional
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.
-- El codigo_estudiantil (ej. 824426) es el identificador principal visible.

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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
 IF public.mi_rol() NOT IN (1,2,4,5,7) THEN
  RAISE EXCEPTION 'Sin permiso para consultar estudiantes';
 END IF;

 RETURN QUERY
 SELECT p.id_paciente,u.id_usuario,p.codigo_estudiantil,u.nombre,p.programa_academico,p.semestre,u.estado
 FROM public.pacientes p
 JOIN public.usuarios u ON u.id_usuario=p.id_usuario
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
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
 uid bigint;
 pid bigint;
 existing_uid bigint;
 code text:=NULLIF(TRIM(p_codigo),'');
 nm text:=NULLIF(TRIM(p_nombre),'');
 mail text;
BEGIN
 IF public.mi_rol() NOT IN (1,2,4,5,7) THEN
  RAISE EXCEPTION 'Sin permiso para crear estudiantes';
 END IF;
 IF code IS NULL THEN RAISE EXCEPTION 'El ID de estudiante es obligatorio'; END IF;
 IF nm IS NULL THEN RAISE EXCEPTION 'El nombre es obligatorio'; END IF;
 IF code !~ '^[0-9]{4,20}$' THEN RAISE EXCEPTION 'El ID de estudiante debe contener entre 4 y 20 dígitos'; END IF;

 SELECT p.id_paciente,p.id_usuario INTO pid,existing_uid
 FROM public.pacientes p
 WHERE p.codigo_estudiantil=code
 LIMIT 1;

 IF pid IS NOT NULL THEN
  RETURN jsonb_build_object('id_paciente',pid,'id_usuario',existing_uid,'codigo_estudiantil',code,'existente',true);
 END IF;

 mail:=NULLIF(LOWER(TRIM(COALESCE(p_correo,''))),'');
 IF mail IS NULL THEN mail:=LOWER(code)||'@registro.sisu.local'; END IF;

 IF EXISTS(SELECT 1 FROM public.usuarios u WHERE LOWER(u.correo)=mail) THEN
  RAISE EXCEPTION 'El correo ya está registrado';
 END IF;

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

NOTIFY pgrst, 'reload schema';
