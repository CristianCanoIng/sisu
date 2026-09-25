import{requireProfile}from'../session.js';import{supabase}from'../supabase.js';import{renderNavbar}from'../navbar.js';import{escapeHtml,formatDateTime,badgeClass,showAlert,openModal,closeModal,wireModal,$,downloadCsv}from'../utils.js';import{loadOperationalStudents,studentOptions,filterStudentSelect,quickStudentHtml,createQuickStudent}from'../students.js';

const p=await requireProfile('consultas');renderNavbar(p,'consultas');
const student=Number(p.id_rol)===3,professional=Number(p.id_rol)===4,admin=Number(p.id_rol)===1;
let students=[];

async function loadStudents(){if(!student)students=await loadOperationalStudents()}
async function getPatientId(){if(!student)return null;const{data}=await supabase.from('pacientes').select('id_paciente').eq('id_usuario',p.id_usuario).maybeSingle();return data?.id_paciente||null}

async function load(){
 let q=supabase.from('consultas').select('*,pacientes(id_usuario,codigo_estudiantil,programa_academico,usuarios(nombre)),profesional:id_profesional(nombre,roles(nombre))').order('fecha',{ascending:false});
 if(student)q=q.eq('pacientes.id_usuario',p.id_usuario);else if(professional)q=q.or(`id_profesional.eq.${p.id_usuario},id_profesional.is.null`);
 const{data,error}=await q;if(error)throw error;
 return(data||[]).filter(c=>!student||c.pacientes?.id_usuario===p.id_usuario);
}

function modal(){
 const selector=student?'':`<div class="form-group full"><label>Buscar por ID de estudiante</label><input id="studentSearch" class="form-control" placeholder="Ej. 824426"></div><div class="form-group full"><label>Estudiante</label><select id="idPaciente" class="form-control" required>${studentOptions(students,'id_paciente')}</select></div>${quickStudentHtml('co')}`;
 return `<div id="consultModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>Nuevo registro</h3><button class="close-btn" data-close-modal>&times;</button></div><form id="consultForm"><div class="modal-body"><div class="form-grid">${selector}<div class="form-group"><label>Tipo</label><select id="tipo" class="form-control"><option>Enfermería</option><option>Medicina General</option></select></div><div class="form-group full"><label>Motivo</label><textarea id="motivo" class="form-control" required></textarea></div><div class="form-group full"><label>Síntomas</label><textarea id="sintomas" class="form-control"></textarea></div>${professional||admin?`<div class="form-group full"><label>Signos vitales</label><input id="signos" class="form-control"></div><div class="form-group full"><label>Diagnóstico</label><textarea id="diagnostico" class="form-control"></textarea></div><div class="form-group full"><label>Tratamiento / medicamentos</label><textarea id="tratamiento" class="form-control"></textarea></div>`:''}<div class="form-group full"><label>Observaciones</label><textarea id="observaciones" class="form-control"></textarea></div></div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-close-modal>Cancelar</button><button class="btn btn-primary">Guardar</button></div></form></div></div>`;
}

async function render(){
 const rows=await load();
 $('#topActions').innerHTML='<button id="exportConsult" class="btn btn-success"><i class="fas fa-file-csv"></i> Exportar CSV</button><button id="newConsult" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo registro</button>';
 $('#app').innerHTML=`<div class="card"><div class="card-header"><h3>Registros médicos</h3><span>${rows.length} registros</span></div><div class="card-body">${rows.length?`<table class="data-table"><thead><tr><th>ID estudiante</th><th>Paciente</th><th>Programa</th><th>Tipo</th><th>Motivo</th><th>Fecha</th><th>Profesional</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(c=>`<tr><td><strong>${escapeHtml(c.pacientes?.codigo_estudiantil||'—')}</strong></td><td>${escapeHtml(c.pacientes?.usuarios?.nombre||'—')}</td><td>${escapeHtml(c.pacientes?.programa_academico||'—')}</td><td>${escapeHtml(c.tipo_consulta||'')}</td><td>${escapeHtml((c.motivo||'').slice(0,45))}</td><td>${formatDateTime(c.fecha)}</td><td>${escapeHtml(c.profesional?.nombre||'Sin asignar')}</td><td><span class="badge badge-${badgeClass(c.estado)}">${escapeHtml(c.estado)}</span></td><td><div class="actions">${[1,2,4].includes(Number(p.id_rol))&&c.estado==='Pendiente'? `<button class="btn btn-success btn-sm attend" data-id="${c.id_consulta}">Atender</button>`:''}${admin?`<button class="btn btn-danger btn-sm del" data-id="${c.id_consulta}">Eliminar</button>`:''}</div></td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">No hay consultas registradas</div>'}</div></div>${modal()}`;

 wireModal('consultModal');
 $('#exportConsult').onclick=()=>exportConsult(rows);
 $('#newConsult').onclick=()=>openModal('consultModal');
 $('#consultForm').onsubmit=save;
 if(!student){
  $('#studentSearch').oninput=e=>filterStudentSelect($('#idPaciente'),students,e.target.value,'id_paciente');
  $('#coCreate').onclick=quickCreate;
 }
 document.querySelectorAll('.attend').forEach(b=>b.onclick=()=>updateState(b.dataset.id));
 document.querySelectorAll('.del').forEach(b=>b.onclick=()=>remove(b.dataset.id));
}

async function quickCreate(){
 try{
  const result=await createQuickStudent('co');
  await loadStudents();
  await render();
  openModal('consultModal');
  $('#idPaciente').value=String(result.id_paciente);
  showAlert(result.existente?'El ID ya existía y fue seleccionado.':'Estudiante creado y seleccionado.');
 }catch(err){showAlert(err.message||'No fue posible crear el estudiante.','error')}
}

function exportConsult(rows){
 downloadCsv('consultas_'+new Date().toISOString().slice(0,10)+'.csv',rows,[
  {label:'ID',value:'id_consulta'},{label:'ID estudiante',value:r=>r.pacientes?.codigo_estudiantil||''},{label:'Paciente',value:r=>r.pacientes?.usuarios?.nombre||''},{label:'Programa',value:r=>r.pacientes?.programa_academico||''},{label:'Tipo',value:'tipo_consulta'},{label:'Motivo',value:'motivo'},{label:'Sintomas',value:'sintomas'},{label:'Diagnostico',value:'diagnostico'},{label:'Tratamiento',value:'tratamiento'},{label:'Fecha',value:'fecha'},{label:'Profesional',value:r=>r.profesional?.nombre||''},{label:'Estado',value:'estado'},{label:'Observaciones',value:'observaciones'}
 ]);
}

async function save(e){
 e.preventDefault();
 const id=student?await getPatientId():Number($('#idPaciente').value);
 if(!id)return showAlert('No se encontró o seleccionó el estudiante.','error');
 const row={id_paciente:id,id_profesional:professional?p.id_usuario:null,tipo_consulta:$('#tipo').value,motivo:$('#motivo').value.trim(),sintomas:$('#sintomas')?.value||'',signos_vitales:$('#signos')?.value||null,diagnostico:$('#diagnostico')?.value||null,tratamiento:$('#tratamiento')?.value||null,observaciones:$('#observaciones')?.value||'',estado:'Pendiente'};
 const{error}=await supabase.from('consultas').insert(row);
 if(error)return showAlert(error.message,'error');
 closeModal('consultModal');showAlert('Consulta registrada');render();
}
async function updateState(id){const{error}=await supabase.from('consultas').update({estado:'Atendida',id_profesional:p.id_usuario}).eq('id_consulta',id);if(error)return showAlert(error.message,'error');render()}
async function remove(id){if(!confirm('¿Eliminar esta consulta?'))return;const{error}=await supabase.from('consultas').delete().eq('id_consulta',id);if(error)return showAlert(error.message,'error');render()}

try{await loadStudents();await render()}catch(err){$('#app').innerHTML='<div class="alert alert-error">No fue posible cargar estudiantes: '+escapeHtml(err.message||'Error')+'. Ejecuta supabase/gestion_estudiantes.sql en Supabase.</div>'}
