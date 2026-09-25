import{requireProfile}from'../session.js';import{supabase}from'../supabase.js';import{renderNavbar}from'../navbar.js';import{escapeHtml,formatDate,badgeClass,showAlert,openModal,closeModal,wireModal,$,downloadCsv}from'../utils.js';import{loadOperationalStudents,studentOptions,filterStudentSelect,quickStudentHtml,createQuickStudent}from'../students.js';
const p=await requireProfile('incapacidades');renderNavbar(p,'incapacidades');
const role=Number(p.id_rol),student=role===3,teacher=role===5,nurse=role===4,coordinator=role===2,admin=role===1,canSubmit=student||teacher;
let students=[];
async function loadStudents(){
 if(!teacher)return;
 students=await loadOperationalStudents();
}
async function load(){
 const{data,error}=await supabase.from('incapacidades').select('*,pacientes(id_usuario,codigo_estudiantil,programa_academico,usuarios(nombre)),radicador:radicada_por(nombre),revisor_enfermeria:revisada_enfermeria_por(nombre),revisor_coordinacion:revisada_coordinacion_por(nombre),aprobador:aprobado_por(nombre)').order('fecha_radicacion',{ascending:false});
 if(error)throw error;
 const rows=data||[];
 if(!teacher)return rows;
 return rows.map(i=>{
  const s=students.find(x=>Number(x.id_paciente)===Number(i.id_paciente));
  if(!s)return i;
  return {...i,pacientes:i.pacientes||{id_usuario:s.id_usuario,codigo_estudiantil:s.codigo_estudiantil,programa_academico:s.programa_academico,usuarios:{nombre:s.nombre}}};
 });
}
function flowCard(){
 return '<div class="alert alert-info"><strong>Flujo de incapacidad:</strong> Radicación por estudiante o profesor de apoyo → revisión de Enfermería → aprobación final de Coordinación. El profesor de apoyo puede consultar el estado de las incapacidades que haya radicado.</div>';
}
function modal(){
 if(!canSubmit)return '';
 const studentField=teacher?`<div class="form-group full"><label>Buscar por ID de estudiante</label><input id="studentSearch" class="form-control" placeholder="Ej. 824426"></div><div class="form-group full"><label>Estudiante</label><select id="idPaciente" class="form-control" required>${studentOptions(students,'id_paciente')}</select></div>${quickStudentHtml('in')}`:'';
 return `<div id="incModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>Formulario de radicación de incapacidad</h3><button class="close-btn" data-close-modal>&times;</button></div><form id="incForm"><div class="modal-body"><div class="form-grid">${studentField}<div class="form-group full"><label>Motivo</label><input id="motivo" class="form-control" required></div><div class="form-group"><label>Fecha inicio</label><input id="inicio" class="form-control" type="date" required></div><div class="form-group"><label>Fecha fin</label><input id="fin" class="form-control" type="date" required></div><div class="form-group full"><label>Diagnóstico</label><textarea id="diag" class="form-control"></textarea></div><div class="form-group full"><label>Observaciones</label><textarea id="obs" class="form-control" placeholder="Información adicional para Enfermería y Coordinación"></textarea></div><div class="form-group full"><label>Adjunto de incapacidad (PDF/JPG/PNG, máx. 5 MB)</label><input id="file" class="form-control" type="file" accept=".pdf,.jpg,.jpeg,.png" required></div></div><div class="alert alert-info">El soporte se almacena de forma privada. Después de radicarlo, Enfermería realiza la primera revisión y Coordinación la aprobación final.</div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-close-modal>Cancelar</button><button class="btn btn-primary">Radicar incapacidad</button></div></form></div></div>`;
}
async function render(){
 const rows=await load();
 const pendingNurse=rows.filter(i=>i.estado==='Radicada').length;
 const pendingCoord=rows.filter(i=>i.estado==='Pendiente coordinación').length;
 const approved=rows.filter(i=>i.estado==='Aprobada').length;
 const rejected=rows.filter(i=>String(i.estado).startsWith('Rechazada')).length;
 $('#topActions').innerHTML='<button id="exportInc" class="btn btn-success"><i class="fas fa-file-csv"></i> Exportar CSV</button>'+(canSubmit?'<button id="newInc" class="btn btn-primary"><i class="fas fa-paperclip"></i> Radicar incapacidad</button>':'');
 $('#app').innerHTML=flowCard()+`<div class="stats-grid"><div class="stat-card"><div class="stat-value">${rows.length}</div><div class="stat-label">Total</div></div><div class="stat-card"><div class="stat-value">${pendingNurse}</div><div class="stat-label">Pendientes Enfermería</div></div><div class="stat-card"><div class="stat-value">${pendingCoord}</div><div class="stat-label">Pendientes Coordinación</div></div><div class="stat-card"><div class="stat-value">${approved}</div><div class="stat-label">Aprobadas</div></div><div class="stat-card"><div class="stat-value">${rejected}</div><div class="stat-label">Rechazadas</div></div></div><div class="card"><div class="card-header"><h3>Seguimiento de incapacidades</h3></div><div class="card-body">${rows.length?`<table class="data-table"><thead><tr><th>ID estudiante</th><th>Estudiante</th><th>Programa</th><th>Motivo</th><th>Periodo</th><th>Radicada por</th><th>Estado</th><th>Soporte</th><th>Acciones</th></tr></thead><tbody>${rows.map(i=>`<tr><td><strong>${escapeHtml(i.pacientes?.codigo_estudiantil||'—')}</strong><br><small>Rad. #${String(i.id_incapacidad).padStart(4,'0')}</small></td><td>${escapeHtml(i.pacientes?.usuarios?.nombre||'—')}</td><td>${escapeHtml(i.pacientes?.programa_academico||'—')}</td><td>${escapeHtml((i.motivo||'').slice(0,45))}</td><td>${formatDate(i.fecha_inicio)}<br><small>${formatDate(i.fecha_fin)}</small></td><td>${escapeHtml(i.radicador?.nombre||i.pacientes?.usuarios?.nombre||'—')}</td><td><span class="badge badge-${badgeClass(i.estado)}">${escapeHtml(i.estado)}</span>${i.observacion_enfermeria?`<br><small>Enfermería: ${escapeHtml(i.observacion_enfermeria)}</small>`:''}${i.observacion_coordinacion?`<br><small>Coordinación: ${escapeHtml(i.observacion_coordinacion)}</small>`:''}</td><td>${i.archivo_soporte?`<div class="actions"><button class="btn btn-light btn-sm support" data-path="${escapeHtml(i.archivo_soporte)}">Ver</button><button class="btn btn-light btn-sm download" data-path="${escapeHtml(i.archivo_soporte)}">Descargar</button></div>`:'—'}</td><td><div class="actions">${nurse&&i.estado==='Radicada'?`<button class="btn btn-success btn-sm nurseApprove" data-id="${i.id_incapacidad}">Aprobar Enfermería</button><button class="btn btn-danger btn-sm nurseReject" data-id="${i.id_incapacidad}">Rechazar</button>`:''}${coordinator&&i.estado==='Pendiente coordinación'?`<button class="btn btn-success btn-sm coordApprove" data-id="${i.id_incapacidad}">Aprobar Coordinación</button><button class="btn btn-danger btn-sm coordReject" data-id="${i.id_incapacidad}">Rechazar</button>`:''}${admin?`<button class="btn btn-light btn-sm del" data-id="${i.id_incapacidad}">Eliminar</button>`:''}</div></td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">No hay incapacidades registradas</div>'}</div></div>${modal()}`;
 $('#exportInc').onclick=()=>exportInc(rows);
 if(canSubmit){wireModal('incModal');$('#newInc').onclick=()=>openModal('incModal');$('#incForm').onsubmit=save;if(teacher){$('#studentSearch').oninput=e=>filterStudentSelect($('#idPaciente'),students,e.target.value,'id_paciente');$('#inCreate').onclick=quickCreate}}
 document.querySelectorAll('.nurseApprove').forEach(b=>b.onclick=()=>nurseDecision(b.dataset.id,true));
 document.querySelectorAll('.nurseReject').forEach(b=>b.onclick=()=>nurseDecision(b.dataset.id,false));
 document.querySelectorAll('.coordApprove').forEach(b=>b.onclick=()=>coordDecision(b.dataset.id,true));
 document.querySelectorAll('.coordReject').forEach(b=>b.onclick=()=>coordDecision(b.dataset.id,false));
 document.querySelectorAll('.del').forEach(b=>b.onclick=()=>del(b.dataset.id));
 document.querySelectorAll('.support').forEach(b=>b.onclick=()=>openSupport(b.dataset.path,false));
 document.querySelectorAll('.download').forEach(b=>b.onclick=()=>openSupport(b.dataset.path,true));
}
async function quickCreate(){
 try{
  const result=await createQuickStudent('in');
  await loadStudents();
  await render();
  openModal('incModal');
  $('#idPaciente').value=String(result.id_paciente);
  showAlert(result.existente?'El ID ya existía y fue seleccionado.':'Estudiante creado y seleccionado.');
 }catch(err){showAlert(err.message||'No fue posible crear el estudiante.','error')}
}
function exportInc(rows){
 downloadCsv('incapacidades_'+new Date().toISOString().slice(0,10)+'.csv',rows,[
  {label:'ID',value:'id_incapacidad'},{label:'Estudiante',value:r=>r.pacientes?.usuarios?.nombre||''},{label:'Codigo estudiantil',value:r=>r.pacientes?.codigo_estudiantil||''},{label:'Programa',value:r=>r.pacientes?.programa_academico||''},{label:'Motivo',value:'motivo'},{label:'Diagnostico',value:'diagnostico'},{label:'Fecha inicio',value:'fecha_inicio'},{label:'Fecha fin',value:'fecha_fin'},{label:'Dias',value:'dias_totales'},{label:'Radicada por',value:r=>r.radicador?.nombre||''},{label:'Estado',value:'estado'},{label:'Revision Enfermeria',value:r=>r.revisor_enfermeria?.nombre||''},{label:'Observacion Enfermeria',value:'observacion_enfermeria'},{label:'Revision Coordinacion',value:r=>r.revisor_coordinacion?.nombre||''},{label:'Observacion Coordinacion',value:'observacion_coordinacion'},{label:'Observaciones',value:'observaciones'}
 ]);
}
async function save(e){
 e.preventDefault();
 let patientId=null;
 if(student){
  const{data:pac,error}=await supabase.from('pacientes').select('id_paciente').eq('id_usuario',p.id_usuario).maybeSingle();
  if(error)return showAlert(error.message,'error');
  patientId=pac?.id_paciente||null;
 }else{
  patientId=Number($('#idPaciente').value||0)||null;
 }
 if(!patientId)return showAlert('Selecciona o verifica el estudiante.','error');
 const start=new Date($('#inicio').value+'T00:00:00'),end=new Date($('#fin').value+'T00:00:00');
 if(end<start)return showAlert('La fecha final no puede ser anterior.','error');
 const f=$('#file').files[0];
 if(!f)return showAlert('Debes adjuntar el soporte de la incapacidad.','error');
 if(f.size>5*1024*1024)return showAlert('El archivo supera 5 MB.','error');
 if(!['application/pdf','image/jpeg','image/png'].includes(f.type))return showAlert('Formato no permitido. Usa PDF, JPG o PNG.','error');
 const path=`${p.id_usuario}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
 const up=await supabase.storage.from('incapacidades').upload(path,f);
 if(up.error)return showAlert(up.error.message,'error');
 const days=Math.floor((end-start)/86400000)+1;
 const{error}=await supabase.from('incapacidades').insert({id_paciente:patientId,fecha_inicio:$('#inicio').value,fecha_fin:$('#fin').value,dias_totales:days,motivo:$('#motivo').value.trim(),diagnostico:$('#diag').value.trim(),observaciones:$('#obs').value.trim(),archivo_soporte:path,radicada_por:p.id_usuario,estado:'Radicada'});
 if(error){await supabase.storage.from('incapacidades').remove([path]);return showAlert(error.message,'error')}
 closeModal('incModal');showAlert('Incapacidad radicada y enviada a Enfermería.');render();
}
async function nurseDecision(id,approve){
 const obs=prompt(approve?'Observación de Enfermería (opcional):':'Motivo del rechazo por Enfermería:','');
 if(obs===null)return;
 if(!approve&&!obs.trim())return showAlert('Indica el motivo del rechazo.','error');
 const{error}=await supabase.rpc('revisar_incapacidad_enfermeria',{p_id_incapacidad:Number(id),p_aprobar:approve,p_observacion:obs.trim()||null});
 if(error)return showAlert(error.message,'error');
 showAlert(approve?'Aprobada por Enfermería y enviada a Coordinación.':'Incapacidad rechazada por Enfermería.');
 render();
}
async function coordDecision(id,approve){
 const obs=prompt(approve?'Observación de Coordinación (opcional):':'Motivo del rechazo por Coordinación:','');
 if(obs===null)return;
 if(!approve&&!obs.trim())return showAlert('Indica el motivo del rechazo.','error');
 const{error}=await supabase.rpc('resolver_incapacidad_coordinacion',{p_id_incapacidad:Number(id),p_aprobar:approve,p_observacion:obs.trim()||null});
 if(error)return showAlert(error.message,'error');
 showAlert(approve?'Incapacidad aprobada definitivamente.':'Incapacidad rechazada por Coordinación.');
 render();
}
async function del(id){
 if(!confirm('¿Eliminar incapacidad?'))return;
 const{error}=await supabase.from('incapacidades').delete().eq('id_incapacidad',id);
 if(error)return showAlert(error.message,'error');
 render();
}
async function openSupport(path,download){
 const result=download?await supabase.storage.from('incapacidades').createSignedUrl(path,300,{download:true}):await supabase.storage.from('incapacidades').createSignedUrl(path,300);
 if(result.error)return showAlert(result.error.message,'error');
 window.open(result.data.signedUrl,'_blank','noopener');
}
try{await loadStudents();await render()}catch(err){$('#app').innerHTML='<div class="alert alert-error">No fue posible cargar el flujo de incapacidades: '+escapeHtml(err.message||'Error')+'. Ejecuta supabase/flujo_incapacidades.sql y supabase/gestion_estudiantes.sql en Supabase.</div>'}
