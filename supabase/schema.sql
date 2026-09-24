-- SISU: ejecutar primero database/bd.sql en un proyecto Supabase nuevo y luego este archivo.
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.usuarios ALTER COLUMN password DROP NOT NULL;
-- Retirar completamente el rol y el tipo de consulta eliminados.
UPDATE public.consultas SET tipo_consulta = NULL WHERE tipo_consulta IS NOT NULL AND tipo_consulta NOT IN ('Enfermería','Medicina General');
ALTER TABLE public.consultas DROP CONSTRAINT IF EXISTS consultas_tipo_consulta_check;
ALTER TABLE public.consultas ADD CONSTRAINT consultas_tipo_consulta_check
CHECK (tipo_consulta IS NULL OR tipo_consulta IN ('Enfermería','Medicina General'));
UPDATE public.usuarios SET id_rol = NULL WHERE id_rol IS NOT NULL AND id_rol NOT IN (1,2,3,4,5,7);
DELETE FROM public.roles WHERE id_rol NOT IN (1,2,3,4,5,7);
CREATE UNIQUE INDEX IF NOT EXISTS inventario_codigo_unique ON public.inventario(codigo) WHERE codigo IS NOT NULL;
CREATE INDEX IF NOT EXISTS usuarios_auth_user_idx ON public.usuarios(auth_user_id);
-- Bucket privado para soportes de incapacidades
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('incapacidades','incapacidades',false,5242880,ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;
