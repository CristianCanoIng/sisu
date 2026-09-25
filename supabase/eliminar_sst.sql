-- SISU - Eliminación del módulo SST
-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase actualmente usado por SISU.
-- La tabla de asistencias se elimina primero por su relación con eventos_sst.

BEGIN;

DROP TABLE IF EXISTS public.asistencia_sst CASCADE;
DROP TABLE IF EXISTS public.eventos_sst CASCADE;

COMMIT;
