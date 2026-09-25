import{requireProfile}from'../session.js';import{supabase}from'../supabase.js';import{renderNavbar}from'../navbar.js';import{escapeHtml,showAlert,openModal,closeModal,wireModal,$,downloadCsv}from'../utils.js';
const p=await requireProfile('usuarios');renderNavbar(p,'usuarios');let rows=[];

async function load(){
 const{data,error}=await supabase.from('usuarios').select('id_usuario,nombre,correo,documento,telefono,id_rol,estado,roles(nombre),pacientes(codigo_estudiantil,programa_academico,semestre)').order('id_usuario',{ascending:false});
 if(error)throw error;rows=data||[];render();
}
function patientOf(u){return Array.isArray(u.pacientes)?u.pacientes[0]:u.pacientes}
function studentCode(u){return patientOf(u)?.codigo_estudiantil||''}

function modal(){
 return `<div id="userModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>Nuevo usuario</h3><button class="close-btn" data-close-modal>&times;</button></div><form id="userForm"><div class="modal-body"><div class="form-grid"><div class="form-group"><label>Nombre</label><input id="nombre" class="form-control" required></div><div class="form-group"><label>Correo</label><input id="correo" type="email" class="form-control" required></div><div class="form-group"><label>Contraseña temporal</label><input id="password" type="password" class="form-control" value="123456" required></div><div class="form-group"><label>Documento</label><input id="documento" class="form-control"></div><div class="form-group"><label>Teléfono</label><input id="telefono" class="form-control"></div><div class="form-group"><label>Rol</label><select id="rol" class="form-control"><option value="1">Administrador</option><option value="2">Coordinador</option><option value="3">Estudiante</option><option value="4">Enfermero</option><option value="5">Docente</option><option value="7">Bienestar</option></select></div><div class="form-group full"><label>ID de estudiante (obligatorio para Estudiante)</label><input id="codigoEstudiantil" class="form-control" inputmode="numeric" placeholder="Ej. 824426"></div><div class="form-group"><label>Programa (si estudiante)</label><input id="programa" class="form-control"></div><div class="form-group"><label>Semestre</label><input id="semestre" type="number" min="1" max="20" class="form-control"></div></div><div class="alert alert-info">Para estudiantes, SISU usa el ID institucional como identificador principal. Si ya existe un perfil operativo con ese ID, al crear la cuenta se vinculará al mismo estudiante.</div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-close-modal>Cancelar</button><button class="btn btn-primary">Crear</button></div></form></div></div>`;
}

function render(){
 $('#topActions').innerHTML='<button id="exportUsers" class="btn btn-success"><i class="fas fa-file-csv"></i> Exportar CSV</button><button id="newUser" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo usuario</button>';
 $('#app').innerHTML=`<div class="card"><div class="card-header"><h3>Listado de usuarios</h3><span>${rows.length} usuarios</span></div><div class="card-body">${rows.length?`<table class="data-table"><thead><tr><th>ID estudiante</th><th>Nombre</th><th>Correo</th><th>Documento</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${rows.map(u=>`<tr><td>${Number(u.id_rol)===3?'<strong>'+escapeHtml(studentCode(u)||'SIN-ID')+'</strong>':'—'}</td><td>${escapeHtml(u.nombre)}</td><td>${escapeHtml(String(u.correo||'').endsWith('@registro.sisu.local')?'Perfil operativo sin acceso':u.correo)}</td><td>${escapeHtml(u.documento||'')}</td><td>${escapeHtml(u.telefono||'')}</td><td>${escapeHtml(u.roles?.nombre||'')}</td><td><span class="badge badge-${u.estado}">${u.estado}</span></td><td><div class="actions">${u.id_usuario!==p.id_usuario?`<button class="btn ${u.estado==='Activo'?'btn-warning':'btn-success'} btn-sm toggle" data-id="${u.id_usuario}" data-state="${u.estado}">${u.estado==='Activo'?'Desactivar':'Activar'}</button>`:''}</div></td></tr>`).join('')}</tbody></table>`:'<div class="empty-state">No hay usuarios</div>'}</div></div>${modal()}`;
 wireModal('userModal');$('#exportUsers').onclick=exportUsers;$('#newUser').onclick=()=>openModal('userModal');$('#userForm').onsubmit=createUser;document.querySelectorAll('.toggle').forEach(b=>b.onclick=()=>toggle(b.dataset.id,b.dataset.state));
}

function exportUsers(){
 downloadCsv('usuarios_'+new Date().toISOString().slice(0,10)+'.csv',rows,[
  {label:'ID estudiante',value:r=>studentCode(r)},{label:'ID interno',value:'id_usuario'},{label:'Nombre',value:'nombre'},{label:'Correo',value:'correo'},{label:'Documento',value:'documento'},{label:'Telefono',value:'telefono'},{label:'Rol',value:r=>r.roles?.nombre||''},{label:'Estado',value:'estado'},{label:'Programa',value:r=>patientOf(r)?.programa_academico||''},{label:'Semestre',value:r=>patientOf(r)?.semestre||''}
 ]);
}

async function createUser(e){
 e.preventDefault();
 const rol=Number($('#rol').value);
 const codigo=$('#codigoEstudiantil').value.trim();
 if(rol===3&&!codigo)return showAlert('El ID de estudiante es obligatorio.','error');
 if(rol===3&&!/^[0-9]{4,20}$/.test(codigo))return showAlert('El ID de estudiante debe contener entre 4 y 20 dígitos.','error');
 const body={nombre:$('#nombre').value.trim(),correo:$('#correo').value.trim(),password:$('#password').value,documento:$('#documento').value.trim(),telefono:$('#telefono').value.trim(),id_rol:rol,codigo_estudiantil:rol===3?codigo:null,programa:$('#programa').value.trim(),semestre:$('#semestre').value?Number($('#semestre').value):null};
 const{data,error}=await supabase.functions.invoke('crear-usuario',{body});
 if(error)return showAlert(error.message,'error');
 if(data?.error)return showAlert(data.error,'error');
 closeModal('userModal');showAlert(data?.perfil_existente?'Cuenta vinculada al estudiante existente.':'Usuario creado.');load();
}

async function toggle(id,state){const{error}=await supabase.from('usuarios').update({estado:state==='Activo'?'Inactivo':'Activo'}).eq('id_usuario',Number(id));if(error)return showAlert(error.message,'error');load()}
load();
