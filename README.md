# SISU
Migración del Sistema Integral de Salud Universitaria a GitHub Pages + Supabase.

## Configuración
1. Cree un proyecto Supabase.
2. Ejecute `database/bd.sql`, luego `supabase/schema.sql`, `supabase/functions.sql`, `supabase/policies.sql` y `supabase/seed.sql` en SQL Editor.
3. Cree/migre usuarios a Supabase Auth y asegúrese de que `public.usuarios.auth_user_id` apunte al UUID de Auth.
4. Edite `assets/js/supabase.js` y coloque la URL y la **publishable/anon key** pública. Nunca use service_role en el frontend.
5. Despliegue la Edge Function `crear-usuario`.
6. Active GitHub Pages desde la rama main (o la rama de migración mientras prueba).

Los soportes de incapacidades viven en el bucket privado `incapacidades` de Supabase Storage.
