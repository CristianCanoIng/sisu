-- SISU: ejecutar primero database/bd.sql en un proyecto Supabase nuevo y luego este archivo.
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.usuarios ALTER COLUMN password DROP NOT NULL;
INSERT INTO public.roles(id_rol,nombre,descripcion) OVERRIDING SYSTEM VALUE VALUES (6,'Psicólogo','Gestiona consultas de psicología') ON CONFLICT (id_rol) DO UPDATE SET nombre=EXCLUDED.nombre,descripcion=EXCLUDED.descripcion;
CREATE UNIQUE INDEX IF NOT EXISTS inventario_codigo_unique ON public.inventario(codigo) WHERE codigo IS NOT NULL;
CREATE INDEX IF NOT EXISTS usuarios_auth_user_idx ON public.usuarios(auth_user_id);
-- Bucket privado para soportes de incapacidades
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('incapacidades','incapacidades',false,5242880,ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;
