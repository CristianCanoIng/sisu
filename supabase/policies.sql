-- RLS base para SISU. La UI oculta acciones, pero estas políticas son la seguridad real.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['roles','usuarios','pacientes','consultas','incapacidades','actividades_bienestar','inscripciones_bienestar','eventos_sst','asistencia_sst','inventario','movimiento_inventario','acompanamientos','seguimientos_acompanamiento']
 LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); END LOOP;
END $$;

CREATE POLICY roles_read ON public.roles FOR SELECT TO authenticated USING(true);
CREATE POLICY usuarios_self_read ON public.usuarios FOR SELECT TO authenticated USING(auth_user_id=auth.uid() OR public.mi_rol() IN (1,2,4,6,7));
CREATE POLICY usuarios_admin_update ON public.usuarios FOR UPDATE TO authenticated USING(public.mi_rol() IN (1,2)) WITH CHECK(public.mi_rol() IN (1,2));
CREATE POLICY pacientes_read ON public.pacientes FOR SELECT TO authenticated USING(id_usuario=public.mi_usuario_id() OR public.mi_rol() IN (1,2,4,6));
CREATE POLICY pacientes_admin_write ON public.pacientes FOR ALL TO authenticated USING(public.mi_rol() IN (1,2)) WITH CHECK(public.mi_rol() IN (1,2));

CREATE POLICY consultas_read ON public.consultas FOR SELECT TO authenticated USING(
 public.mi_rol() IN (1,2,4,6) OR EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=consultas.id_paciente AND p.id_usuario=public.mi_usuario_id())
);
CREATE POLICY consultas_insert ON public.consultas FOR INSERT TO authenticated WITH CHECK(
 public.mi_rol() IN (1,4,6) OR EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=consultas.id_paciente AND p.id_usuario=public.mi_usuario_id())
);
CREATE POLICY consultas_update ON public.consultas FOR UPDATE TO authenticated USING(public.mi_rol() IN (1,2,4,6)) WITH CHECK(public.mi_rol() IN (1,2,4,6));
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

CREATE POLICY acomp_read ON public.acompanamientos FOR SELECT TO authenticated USING(public.mi_rol() IN (1,4,6) OR EXISTS(SELECT 1 FROM pacientes p WHERE p.id_paciente=acompanamientos.id_paciente AND p.id_usuario=public.mi_usuario_id()));
CREATE POLICY acomp_insert ON public.acompanamientos FOR INSERT TO authenticated WITH CHECK(public.mi_rol() IN (1,4,6));
CREATE POLICY acomp_update ON public.acompanamientos FOR UPDATE TO authenticated USING(public.mi_rol() IN (1,4,6)) WITH CHECK(public.mi_rol() IN (1,4,6));
CREATE POLICY seg_read ON public.seguimientos_acompanamiento FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM acompanamientos a JOIN pacientes p ON p.id_paciente=a.id_paciente WHERE a.id_acompanamiento=seguimientos_acompanamiento.id_acompanamiento AND (public.mi_rol() IN (1,4,6) OR p.id_usuario=public.mi_usuario_id())));
CREATE POLICY seg_insert ON public.seguimientos_acompanamiento FOR INSERT TO authenticated WITH CHECK(usuario_id=public.mi_usuario_id() AND EXISTS(SELECT 1 FROM acompanamientos a JOIN pacientes p ON p.id_paciente=a.id_paciente WHERE a.id_acompanamiento=seguimientos_acompanamiento.id_acompanamiento AND (public.mi_rol() IN (1,4,6) OR p.id_usuario=public.mi_usuario_id())));

CREATE POLICY incap_storage_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='incapacidades' AND (storage.foldername(name))[1]=public.mi_usuario_id()::text);
CREATE POLICY incap_storage_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='incapacidades' AND (public.mi_rol() IN (1,2,4,5) OR (storage.foldername(name))[1]=public.mi_usuario_id()::text));
