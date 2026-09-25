import{requireProfile}from'../session.js';import{supabase}from'../supabase.js';import{renderNavbar}from'../navbar.js';import{escapeHtml,formatDate,badgeClass,showAlert,openModal,closeModal,wireModal,$,downloadCsv}from'../utils.js';import{loadOperationalStudents,studentOptions,filterStudentSelect,quickStudentHtml,createQuickStudent}from'../students.js';

const p=await requireProfile('acompanamiento');renderNavbar(p,'acompanamiento');
const student=Number(p.id_rol)===3;
let students=[];

async function loadStudents(){
 if(student)return;
 students=await loadOperationalStudents();
}

async function load(){
 const{data,error}=await supabase.from('acompanamientos').select('*,pacientes(id_usuario,codigo_estudiantil,programa_academico,usuarios(nombre)),responsable:usuario_id(nombre),seguimientos_acompanamiento(id_seguimiento,usuario_id,fecha_contacto,tipo_contacto,notas,estado,proxima_fecha,usuarios(nombre))').order('fecha_inicio',{ascending:false});
 if(error)throw error;
 return(data||[]).filter(c=>!student||c.pacientes?.id_usuario===p.id_usuario);
}

function newModal(){
 if(student)return '';
 return `<div id="newCase" class="modal"><div class="modal-content"><div class="modal-header"><h3>Nuevo acompañamiento</h3><button class="close-btn" data-close-modal>&times;</button></div><form id="caseForm"><div class="modal-body"><div class="form-group"><label>Buscar estudiante por ID</label><input id="studentSearch" class="form-control" placeholder="Ej. 824426"></div><div class="form-group"><label>Estudiante</label><select id="paciente" class="form-control" required>${studentOptions(students,'id_paciente')}</select></div>${quickStudentHtml('ac')}<div class="form-group"><label>Motivo del acompañamiento</label><textarea id="motivo" class="form-control" required></textarea></div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-close-modal>Cancelar</button><button class="btn btn-primary">Crear acompañamiento</button></div></form></div></div>`;
}

async function render(){
 const rows=await load();
 $('#topActions').innerHTML='<button id="exportCases" class="btn btn-success"><i class="fas fa-file-csv"></i> Exportar CSV</button>'+(student?'':'<button id="newBtn" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo acompañamiento</button>');
 $('#app').innerHTML=`<div class="card"><div class="card-header"><h3>Casos de acompañamiento</h3><span>${rows.length} casos</span></div><div class="card-body">${rows.length?`<table class="data-table"><thead><tr><th>ID estudiante</th><th>Estudiante</th><th>Programa</th><th>Motivo</th><th>Responsable</th><th>Inicio</th><th>Estado</th><th>Seguimientos</th><th>Acciones</th></tr></thead><tbody>${rows.map(c=>`<tr><td><strong>${escapeHtml(c.pacientes?.codigo_estudiantil||'—')}</strong></td><td>${escapeHtml(c.pacientes?.usuarios?.nombre||'')}</td><td>${escapeHtml(c.pacientes?.programa_academico||'')}</td><td>${escapeHtml(c.motivo||'')}</td><td>${escapeHtml(c.responsable?.nombre||'')}</td><td>${formatDate(c.fecha_inicio)}</td><td><span class="badge badge-${badgeClass(c.estado)}">${escapeHtml(c.estado)}</span></td><td>${(c.seguimientos_acompanamiento||[]).length}</td><td><button class="btn btn-primary btn-sm follow" data-id="${c.id_acompanamiento}">Seguimiento</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">No hay casos</div>'}</div></div>${newModal()}<div id="followModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>Registrar seguimiento</h3><button class="close-btn" data-close-modal>&times;</button></div><form id="followForm"><input id="caseId" type="hidden"><div class="modal-body"><div class="form-group"><label>Notas</label><textarea id="notas" class="form-control" required></textarea></div>${student?'':`<div class="form-grid"><div class="form-group"><label>Tipo de contacto</label><select id="tipo" class="form-control"><option>Llamada</option><option>Presencial</option><option>Correo</option></select></div><div class="form-group"><label>Estado</label><select id="estado" class="form-control"><option>Pendiente</option><option>En seguimiento</option><option>Cerrado</option></select></div><div class="form-group full"><label>Próxima fecha</label><input id="proxima" type="date" class="form-control"></div></div>`}</div><div class="modal-footer"><button type="button" class="btn btn-light" data-close-modal>Cancelar</button><button class="btn btn-primary">Guardar</button></div></form></div></div>`;

 $('#exportCases').onclick=()=>exportCases(rows);
 if(!student){
  wireModal('newCase');
  $('#newBtn').onclick=()=>openModal('newCase');
  $('#caseForm').onsubmit=saveCase;
  $('#studentSearch').oninput=e=>filterStudentSelect($('#paciente'),students,e.target.value,'id_paciente');
  $('#acCreate').onclick=quickCreate;
 }
 wireModal('followModal');
 document.querySelectorAll('.follow').forEach(b=>b.onclick=()=>{$('#caseId').value=b.dataset.id;openModal('followModal')});
 $('#followForm').onsubmit=saveFollow;
}

async function quickCreate(){
 try{
  const result=await createQuickStudent('ac');
  await loadStudents();
  await render();
  openModal('newCase');
  $('#paciente').value=String(result.id_paciente);
  showAlert(result.existente?'El ID ya existía y fue seleccionado.':'Estudiante creado y seleccionado.');
 }catch(err){showAlert(err.message||'No fue posible crear el estudiante.','error')}
}

function exportCases(rows){
 downloadCsv('acompanamientos_'+new Date().toISOString().slice(0,10)+'.csv',rows,[
  {label:'ID',value:'id_acompanamiento'},{label:'ID estudiante',value:r=>r.pacientes?.codigo_estudiantil||''},{label:'Estudiante',value:r=>r.pacientes?.usuarios?.nombre||''},{label:'Programa',value:r=>r.pacientes?.programa_academico||''},{label:'Motivo',value:'motivo'},{label:'Responsable',value:r=>r.responsable?.nombre||''},{label:'Fecha_inicio',value:'fecha_inicio'},{label:'Fecha_cierre',value:'fecha_cierre'},{label:'Estado',value:'estado'},{label:'Seguimientos',value:r=>(r.seguimientos_acompanamiento||[]).length}
 ]);
}

async function saveCase(e){
 e.preventDefault();
 const id=Number($('#paciente').value);
 if(!id)return showAlert('Selecciona un estudiante por su ID.','error');
 const{error}=await supabase.from('acompanamientos').insert({id_paciente:id,usuario_id:p.id_usuario,motivo:$('#motivo').value.trim(),estado:'Activo'});
 if(error)return showAlert(error.message,'error');
 closeModal('newCase');showAlert('Acompañamiento creado');render();
}

async function saveFollow(e){
 e.preventDefault();
 const id=Number($('#caseId').value);
 const row={id_acompanamiento:id,usuario_id:p.id_usuario,notas:$('#notas').value.trim(),tipo_contacto:student?'Pregunta':$('#tipo').value,estado:student?'Pendiente':$('#estado').value,proxima_fecha:student?null:($('#proxima').value||null)};
 const{error}=await supabase.from('seguimientos_acompanamiento').insert(row);
 if(error)return showAlert(error.message,'error');
 if(!student){
  const closed=row.estado==='Cerrado';
  await supabase.from('acompanamientos').update({estado:closed?'Cerrado':'Activo',fecha_cierre:closed?new Date().toISOString():null}).eq('id_acompanamiento',id);
 }
 closeModal('followModal');render();
}

try{await loadStudents();await render()}catch(err){$('#app').innerHTML='<div class="alert alert-error">No fue posible cargar estudiantes: '+escapeHtml(err.message||'Error')+'. Ejecuta supabase/gestion_estudiantes.sql en Supabase.</div>'}
