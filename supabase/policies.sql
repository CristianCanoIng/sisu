-- RLS base para SISU. La UI oculta acciones, pero estas políticas son la seguridad real.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['roles','usuarios','pacientes','consultas','incapacidades','actividades_bienestar','inscripciones_bienestar','eventos_sst','asistencia_sst','inventario','movimiento_inventario','acompanamientos','seguimientos_acompanamiento']
 LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); END LOOP;
END $$;

DROP POLICY IF EXISTS roles_read ON public.roles;
DROP POLICY IF EXISTS usuarios_self_read ON public.usuarios;
DROP POLICY IF EXISTS usuarios_admin_update ON public.usuarios;
DROP POLICY IF EXISTS pacientes_read ON public.pacientes;
DROP POLICY IF EXISTS pacientes_admin_write ON public.pacientes;
DROP POLICY IF EXISTS consultas_read ON public.consultas;
DROP POLICY IF EXISTS consultas_insert ON public.consultas;
DROP POLICY IF EXISTS consultas_update ON public.consultas;
DROP POLICY IF EXISTS consultas_delete ON public.consultas;
DROP POLICY IF EXISTS incapacidades_read ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_student_insert ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_manage ON public.incapacidades;
DROP POLICY IF EXISTS incapacidades_delete ON public.incapacidades;
DROP POLICY IF EXISTS bienestar_read ON public.actividades_bienestar;
DROP POLICY IF EXISTS bienestar_manage ON public.actividades_bienestar;
DROP POLICY IF EXISTS inscripciones_read ON public.inscripciones_bienestar;
DROP POLICY IF EXISTS sst_read ON public.eventos_sst;
DROP POLICY IF EXISTS sst_manage ON public.eventos_sst;
DROP POLICY IF EXISTS asistencia_read ON public.asistencia_sst;
DROP POLICY IF EXISTS asistencia_insert ON public.asistencia_sst;
DROP POLICY IF EXISTS inventario_read ON public.inventario;
DROP POLICY IF EXISTS inventario_write ON public.inventario;
DROP POLICY IF EXISTS movimientos_read ON public.movimiento_inventario;
DROP POLICY IF EXISTS acomp_read ON public.acompanamientos;
DROP POLICY IF EXISTS acomp_insert ON public.acompanamientos;
DROP POLICY IF EXISTS acomp_update ON public.acompanamientos;
DROP POLICY IF EXISTS seg_read ON public.seguimientos_acompanamiento;
DROP POLICY IF EXISTS seg_insert ON public.seguimientos_acompanamiento;
DROP POLICY IF EXISTS incap_storage_insert ON storage.objects;
DROP POLICY IF EXISTS incap_storage_read ON storage.objects;

CREATE POLICY roles_read ON public.roles FOR SELECT TO authenticated USING(true);
CREATE POLICY usuarios_self_read ON public.usuarios FOR SELECT TO authenticated USING(auth_user_id=auth.uid() OR public.mi_rol() IN (1,2,4,7));
CREATE POLICY usuarios_admin_update ON public.usuarios FOR UPDATE TO authenticated USING(public.mi_rol() IN (1,2)) WITH CHECK(public.mi_rol() IN (1,2));
CREATE POLICY pacientes_read ON public.pacientes FOR SELECT TO authenticated USING(id_usuario=public.mi_usuario_id() OR public.mi_rol() IN (1,2,4));
CREATE POLICY pacientes_admin_write ON public.pacientes FOR ALL TO authenticated USING(public.mi_rol() IN (1,2)) WITH CHECK(public.mi_rol() IN (1,2));

CREATE POLICY consultas_read ON public.consultas FOR SELECT TO authenticated USING(
 public.mi_rol() IN (1,2,4) OR EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=consultas.id_paciente AND p.id_usuario=public.mi_usuario_id())
);
CREATE POLICY consultas_insert ON public.consultas FOR INSERT TO authenticated WITH CHECK(
 public.mi_rol() IN (1,4) OR EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=consultas.id_paciente AND p.id_usuario=public.mi_usuario_id())
);
CREATE POLICY consultas_update ON public.consultas FOR UPDATE TO authenticated USING(public.mi_rol() IN (1,2,4)) WITH CHECK(public.mi_rol() IN (1,2,4));
CREATE POLICY consultas_delete ON public.consultas FOR DELETE TO authenticated USING(public.mi_rol()=1);

CREATE POLICY incapacidades_read ON public.incapacidades FOR SELECT TO authenticated USING(
 public.mi_rol() IN (1,2,4,5) OR EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=incapacidades.id_paciente AND p.id_usuario=public.mi_usuario_id())
);
CREATE POLICY incapacidades_student_insert ON public.incapacidades FOR INSERT TO authenticated WITH CHECK(
 public.mi_rol()=3 AND EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=incapacidades.id_paciente AND p.id_usuario=public.mi_usuario_id())
);
CREATE POLICY incapacidades_manage ON public.incapacidades FOR UPDATE TO authenticated USING(public.mi_rol() IN (1,2)) WITH CHECK(public.mi_rol() IN (1,2));
CREATE POLICY incapacidades_delete ON public.incapacidades FOR DELETE TO authenticated USING(public.mi_rol()=1);

CREATE POLICY bienestar_read ON public.actividades_bienestar FOR SELECT TO authenticated USING(public.mi_rol() IN (1,3,7));
CREATE POLICY bienestar_manage ON public.actividades_bienestar FOR ALL TO authenticated USING(public.mi_rol() IN (1,7)) WITH CHECK(public.mi_rol() IN (1,7));
CREATE POLICY inscripciones_read ON public.inscripciones_bienestar FOR SELECT TO authenticated USING(id_usuario=public.mi_usuario_id() OR public.mi_rol() IN (1,7));

CREATE POLICY sst_read ON public.eventos_sst FOR SELECT TO authenticated USING(public.mi_rol() IN (1,3));
CREATE POLICY sst_manage ON public.eventos_sst FOR ALL TO authenticated USING(public.mi_rol()=1) WITH CHECK(public.mi_rol()=1);
CREATE POLICY asistencia_read ON public.asistencia_sst FOR SELECT TO authenticated USING(id_usuario=public.mi_usuario_id() OR public.mi_rol()=1);
CREATE POLICY asistencia_insert ON public.asistencia_sst FOR INSERT TO authenticated WITH CHECK(id_usuario=public.mi_usuario_id() OR public.mi_rol()=1);

CREATE POLICY inventario_read ON public.inventario FOR SELECT TO authenticated USING(public.mi_rol() IN (1,2,4));
CREATE POLICY inventario_write ON public.inventario FOR ALL TO authenticated USING(public.mi_rol() IN (1,2,4)) WITH CHECK(public.mi_rol() IN (1,2,4));
CREATE POLICY movimientos_read ON public.movimiento_inventario FOR SELECT TO authenticated USING(public.mi_rol() IN (1,2,4));

CREATE POLICY acomp_read ON public.acompanamientos FOR SELECT TO authenticated USING(public.mi_rol() IN (1,4) OR EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=acompanamientos.id_paciente AND p.id_usuario=public.mi_usuario_id()));
CREATE POLICY acomp_insert ON public.acompanamientos FOR INSERT TO authenticated WITH CHECK(public.mi_rol() IN (1,4));
CREATE POLICY acomp_update ON public.acompanamientos FOR UPDATE TO authenticated USING(public.mi_rol() IN (1,4)) WITH CHECK(public.mi_rol() IN (1,4));
CREATE POLICY seg_read ON public.seguimientos_acompanamiento FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM acompanamientos a JOIN pacientes p ON p.id_paciente=a.id_paciente WHERE a.id_acompanamiento=seguimientos_acompanamiento.id_acompanamiento AND (public.mi_rol() IN (1,4) OR p.id_usuario=public.mi_usuario_id())));
CREATE POLICY seg_insert ON public.seguimientos_acompanamiento FOR INSERT TO authenticated WITH CHECK(usuario_id=public.mi_usuario_id() AND EXISTS(SELECT 1 FROM acompanamientos a JOIN pacientes p ON p.id_paciente=a.id_paciente WHERE a.id_acompanamiento=seguimientos_acompanamiento.id_acompanamiento AND (public.mi_rol() IN (1,4) OR p.id_usuario=public.mi_usuario_id())));

CREATE POLICY incap_storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='incapacidades' AND (storage.foldername(name))[1]=public.mi_usuario_id()::text);
CREATE POLICY incap_storage_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='incapacidades' AND (public.mi_rol() IN (1,2,4,5) OR (storage.foldername(name))[1]=public.mi_usuario_id()::text));


-- Seguridad del módulo de implementos deportivos
ALTER TABLE public.implementos_deportivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos_implementos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS implementos_deportivos_read ON public.implementos_deportivos;
DROP POLICY IF EXISTS implementos_deportivos_insert ON public.implementos_deportivos;
DROP POLICY IF EXISTS implementos_deportivos_update ON public.implementos_deportivos;
DROP POLICY IF EXISTS implementos_deportivos_delete ON public.implementos_deportivos;
DROP POLICY IF EXISTS prestamos_implementos_read ON public.prestamos_implementos;

CREATE POLICY implementos_deportivos_read
ON public.implementos_deportivos FOR SELECT TO authenticated
USING (public.mi_rol() IN (1,7));

CREATE POLICY implementos_deportivos_insert
ON public.implementos_deportivos FOR INSERT TO authenticated
WITH CHECK (public.mi_rol() IN (1,7));

CREATE POLICY implementos_deportivos_update
ON public.implementos_deportivos FOR UPDATE TO authenticated
USING (public.mi_rol() IN (1,7))
WITH CHECK (public.mi_rol() IN (1,7));

CREATE POLICY implementos_deportivos_delete
ON public.implementos_deportivos FOR DELETE TO authenticated
USING (public.mi_rol()=1);

CREATE POLICY prestamos_implementos_read
ON public.prestamos_implementos FOR SELECT TO authenticated
USING (public.mi_rol() IN (1,7));

REVOKE ALL ON TABLE public.implementos_deportivos FROM anon,authenticated;
REVOKE ALL ON TABLE public.prestamos_implementos FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.implementos_deportivos TO authenticated;
GRANT SELECT ON TABLE public.prestamos_implementos TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.implementos_deportivos_id_implemento_seq TO authenticated;
