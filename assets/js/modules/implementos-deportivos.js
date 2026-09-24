import{requireProfile}from'../session.js';import{supabase}from'../supabase.js';import{renderNavbar}from'../navbar.js';import{escapeHtml,formatDateTime,badgeClass,showAlert,openModal,closeModal,wireModal,$,downloadCsv}from'../utils.js';
const p=await requireProfile('implementos_deportivos');renderNavbar(p,'implementos_deportivos');
let items=[],loans=[],students=[];
const categories=['Balones','Raquetas','Tejo','Petos','Conos','Ajedrez','Tenis de mesa','Otro'];
function stat(label,value,icon){return '<div class="stat-card"><div class="stat-icon"><i class="fas '+icon+'"></i></div><div><div class="stat-value">'+value+'</div><div class="stat-label">'+escapeHtml(label)+'</div></div></div>'}
function studentName(id){const s=students.find(x=>Number(x.id_usuario)===Number(id));return s||{}}
function itemName(id){const i=items.find(x=>Number(x.id_implemento)===Number(id));return i||{}}
async function load(){
 const [ir,lr,sr]=await Promise.all([
  supabase.from('implementos_deportivos').select('*').order('nombre'),
  supabase.from('prestamos_implementos').select('*').order('fecha_prestamo',{ascending:false}).limit(300),
  supabase.from('usuarios').select('id_usuario,nombre,documento,correo,estado').eq('id_rol',3).order('nombre')
 ]);
 if(ir.error)throw ir.error;if(lr.error)throw lr.error;if(sr.error)throw sr.error;
 items=ir.data||[];loans=lr.data||[];students=sr.data||[];render();
}
function itemModal(){
 const opts=categories.map(x=>'<option>'+escapeHtml(x)+'</option>').join('');
 return '<div id="itemModal" class="modal"><div class="modal-content"><div class="modal-header"><h3 id="itemTitle">Nuevo implemento</h3><button class="close-btn" data-close-modal>&times;</button></div><form id="itemForm"><input id="itemId" type="hidden"><div class="modal-body"><div class="form-grid"><div class="form-group"><label>Código</label><input id="codigo" class="form-control" required></div><div class="form-group"><label>Nombre</label><input id="nombre" class="form-control" required></div><div class="form-group"><label>Categoría</label><select id="categoria" class="form-control">'+opts+'</select></div><div class="form-group"><label>Cantidad total</label><input id="total" type="number" min="1" value="1" class="form-control" required></div><div class="form-group"><label>Ubicación</label><input id="ubicacion" class="form-control" placeholder="Ej. Bodega Bienestar"></div><div class="form-group"><label>Estado</label><select id="itemEstado" class="form-control"><option>Activo</option><option>Mantenimiento</option><option>Inactivo</option></select></div><div class="form-group full"><label>Descripción</label><textarea id="descripcion" class="form-control"></textarea></div></div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-close-modal>Cancelar</button><button class="btn btn-primary">Guardar</button></div></form></div></div>';
}
function loanModal(){
 const studentOpts=students.filter(s=>s.estado==='Activo').map(s=>'<option value="'+s.id_usuario+'">'+escapeHtml(s.nombre)+' - '+escapeHtml(s.documento||s.correo||'')+'</option>').join('');
 const itemOpts=items.filter(i=>i.estado==='Activo'&&Number(i.cantidad_disponible)>0).map(i=>'<option value="'+i.id_implemento+'">'+escapeHtml(i.nombre)+' ('+Number(i.cantidad_disponible)+' disponibles)</option>').join('');
 return '<div id="loanModal" class="modal"><div class="modal-content"><div class="modal-header"><h3>Registrar préstamo presencial</h3><button class="close-btn" data-close-modal>&times;</button></div><form id="loanForm"><div class="modal-body"><div class="form-grid"><div class="form-group full"><label>Estudiante</label><select id="estudiante" class="form-control" required><option value="">Seleccionar...</option>'+studentOpts+'</select></div><div class="form-group"><label>Implemento</label><select id="implemento" class="form-control" required><option value="">Seleccionar...</option>'+itemOpts+'</select></div><div class="form-group"><label>Cantidad</label><input id="cantidad" type="number" min="1" value="1" class="form-control" required></div><div class="form-group full"><label>Observaciones de salida</label><textarea id="obsSalida" class="form-control" placeholder="Estado del implemento, lugar de uso, etc."></textarea></div></div><div class="alert alert-info">La hora de préstamo se registra automáticamente al guardar.</div></div><div class="modal-footer"><button type="button" class="btn btn-light" data-close-modal>Cancelar</button><button class="btn btn-primary">Registrar préstamo</button></div></form></div></div>';
}
function render(){
 const totalUnits=items.reduce((s,i)=>s+Number(i.cantidad_total||0),0);
 const available=items.reduce((s,i)=>s+Number(i.cantidad_disponible||0),0);
 const active=loans.filter(l=>l.estado==='Prestado').reduce((s,l)=>s+Number(l.cantidad||1),0);
 const returnedToday=loans.filter(l=>l.estado==='Devuelto'&&String(l.fecha_devolucion||'').slice(0,10)===new Date().toISOString().slice(0,10)).length;
 $('#topActions').innerHTML='<button id="exportLoans" class="btn btn-success"><i class="fas fa-file-csv"></i> Préstamos CSV</button><button id="exportItems" class="btn btn-warning"><i class="fas fa-file-csv"></i> Inventario CSV</button><button id="newLoan" class="btn btn-success"><i class="fas fa-handshake"></i> Registrar préstamo</button><button id="newItem" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo implemento</button>';
 const inventoryRows=items.map(i=>'<tr><td><strong>'+escapeHtml(i.codigo)+'</strong></td><td>'+escapeHtml(i.nombre)+'</td><td>'+escapeHtml(i.categoria||'')+'</td><td>'+Number(i.cantidad_total)+'</td><td>'+Number(i.cantidad_disponible)+'</td><td>'+escapeHtml(i.ubicacion||'—')+'</td><td><span class="badge badge-'+badgeClass(i.estado)+'">'+escapeHtml(i.estado)+'</span></td><td><button class="btn btn-warning btn-sm editItem" data-id="'+i.id_implemento+'">Editar</button></td></tr>').join('');
 const loanRows=loans.map(l=>{const s=studentName(l.id_estudiante),i=itemName(l.id_implemento);return '<tr><td>#'+String(l.id_prestamo).padStart(4,'0')+'</td><td>'+escapeHtml(s.nombre||'—')+'<br><small>'+escapeHtml(s.documento||'')+'</small></td><td>'+escapeHtml(i.nombre||'—')+'</td><td>'+Number(l.cantidad||1)+'</td><td>'+formatDateTime(l.fecha_prestamo)+'</td><td>'+(l.fecha_devolucion?formatDateTime(l.fecha_devolucion):'—')+'</td><td><span class="badge badge-'+badgeClass(l.estado)+'">'+escapeHtml(l.estado)+'</span></td><td>'+(l.estado==='Prestado'?'<button class="btn btn-success btn-sm returnLoan" data-id="'+l.id_prestamo+'">Registrar devolución</button>':'—')+'</td></tr>'}).join('');
 $('#app').innerHTML='<div class="welcome"><div><h2>Inventario deportivo de Bienestar</h2><p>Control de implementos entregados presencialmente a estudiantes.</p></div><div class="date-chip"><strong>'+new Date().getDate()+'</strong>'+new Intl.DateTimeFormat('es-CO',{month:'long'}).format(new Date())+'</div></div><div class="stats-grid">'+stat('Unidades registradas',totalUnits,'fa-boxes-stacked')+stat('Disponibles',available,'fa-circle-check')+stat('Unidades prestadas',active,'fa-handshake')+stat('Devoluciones hoy',returnedToday,'fa-rotate-left')+'</div><div class="card"><div class="card-header"><h3>Inventario de implementos</h3><span>'+items.length+' tipos registrados</span></div><div class="card-body">'+(items.length?'<table class="data-table"><thead><tr><th>Código</th><th>Implemento</th><th>Categoría</th><th>Total</th><th>Disponibles</th><th>Ubicación</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>'+inventoryRows+'</tbody></table>':'<div class="empty-state">No hay implementos registrados</div>')+'</div></div><div class="card"><div class="card-header"><h3>Historial de préstamos</h3><span>'+loans.length+' registros</span></div><div class="card-body">'+(loans.length?'<table class="data-table"><thead><tr><th>ID</th><th>Estudiante</th><th>Implemento</th><th>Cant.</th><th>Prestado</th><th>Devuelto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>'+loanRows+'</tbody></table>':'<div class="empty-state">Aún no hay préstamos registrados</div>')+'</div></div>'+itemModal()+loanModal();
 wireModal('itemModal');wireModal('loanModal');
 $('#exportItems').onclick=exportItems;$('#exportLoans').onclick=exportLoans;$('#newItem').onclick=openNewItem;$('#newLoan').onclick=()=>{if(!items.some(i=>i.estado==='Activo'&&Number(i.cantidad_disponible)>0))return showAlert('No hay implementos disponibles para prestar.','error');openModal('loanModal')};
 $('#itemForm').onsubmit=saveItem;$('#loanForm').onsubmit=saveLoan;
 document.querySelectorAll('.editItem').forEach(b=>b.onclick=()=>openEditItem(b.dataset.id));
 document.querySelectorAll('.returnLoan').forEach(b=>b.onclick=()=>returnLoan(b.dataset.id));
}
function exportItems(){downloadCsv('implementos_deportivos_'+new Date().toISOString().slice(0,10)+'.csv',items,[{label:'Codigo',value:'codigo'},{label:'Nombre',value:'nombre'},{label:'Categoria',value:'categoria'},{label:'Descripcion',value:'descripcion'},{label:'Cantidad_total',value:'cantidad_total'},{label:'Cantidad_disponible',value:'cantidad_disponible'},{label:'Unidades_prestadas',value:r=>Number(r.cantidad_total||0)-Number(r.cantidad_disponible||0)},{label:'Ubicacion',value:'ubicacion'},{label:'Estado',value:'estado'}])}
function exportLoans(){downloadCsv('prestamos_implementos_'+new Date().toISOString().slice(0,10)+'.csv',loans,[{label:'ID',value:'id_prestamo'},{label:'Estudiante',value:r=>studentName(r.id_estudiante).nombre||''},{label:'Documento',value:r=>studentName(r.id_estudiante).documento||''},{label:'Implemento',value:r=>itemName(r.id_implemento).nombre||''},{label:'Codigo',value:r=>itemName(r.id_implemento).codigo||''},{label:'Cantidad',value:'cantidad'},{label:'Fecha_prestamo',value:'fecha_prestamo'},{label:'Fecha_devolucion',value:'fecha_devolucion'},{label:'Estado',value:'estado'},{label:'Observaciones_salida',value:'observaciones_salida'},{label:'Observaciones_entrega',value:'observaciones_entrega'}])}
function openNewItem(){
 $('#itemForm').reset();$('#itemId').value='';$('#itemTitle').textContent='Nuevo implemento';$('#total').value=1;$('#itemEstado').value='Activo';openModal('itemModal');
}
function openEditItem(id){
 const i=items.find(x=>Number(x.id_implemento)===Number(id));if(!i)return;
 $('#itemId').value=i.id_implemento;$('#itemTitle').textContent='Editar implemento';$('#codigo').value=i.codigo||'';$('#nombre').value=i.nombre||'';$('#categoria').value=i.categoria||'Otro';$('#total').value=i.cantidad_total;$('#ubicacion').value=i.ubicacion||'';$('#itemEstado').value=i.estado||'Activo';$('#descripcion').value=i.descripcion||'';openModal('itemModal');
}
async function saveItem(e){
 e.preventDefault();const id=Number($('#itemId').value||0),total=Number($('#total').value||1);
 const base={codigo:$('#codigo').value.trim(),nombre:$('#nombre').value.trim(),categoria:$('#categoria').value,descripcion:$('#descripcion').value.trim(),cantidad_total:total,ubicacion:$('#ubicacion').value.trim(),estado:$('#itemEstado').value};
 if(id){
  const old=items.find(x=>Number(x.id_implemento)===id),prestadas=Number(old.cantidad_total)-Number(old.cantidad_disponible);
  if(total<prestadas)return showAlert('No puedes dejar el total por debajo de las unidades actualmente prestadas ('+prestadas+').','error');
  base.cantidad_disponible=total-prestadas;
  const{error}=await supabase.from('implementos_deportivos').update(base).eq('id_implemento',id);if(error)return showAlert(error.message,'error');
 }else{
  base.cantidad_disponible=total;base.creado_por=p.id_usuario;
  const{error}=await supabase.from('implementos_deportivos').insert(base);if(error)return showAlert(error.message,'error');
 }
 closeModal('itemModal');showAlert(id?'Implemento actualizado':'Implemento creado');load();
}
async function saveLoan(e){
 e.preventDefault();const itemId=Number($('#implemento').value),studentId=Number($('#estudiante').value),qty=Number($('#cantidad').value||1);
 const item=items.find(x=>Number(x.id_implemento)===itemId);if(!item)return showAlert('Selecciona un implemento.','error');
 if(qty>Number(item.cantidad_disponible))return showAlert('La cantidad supera las unidades disponibles.','error');
 const{data,error}=await supabase.rpc('registrar_prestamo_implemento',{p_id_implemento:itemId,p_id_estudiante:studentId,p_cantidad:qty,p_observaciones:$('#obsSalida').value.trim()||null});
 if(error)return showAlert(error.message,'error');closeModal('loanModal');showAlert('Préstamo registrado #'+data);load();
}
async function returnLoan(id){
 if(!confirm('¿Registrar la devolución de este préstamo?'))return;
 const obs=prompt('Observaciones de entrega (opcional):','')||null;
 const{error}=await supabase.rpc('registrar_devolucion_implemento',{p_id_prestamo:Number(id),p_observaciones:obs});if(error)return showAlert(error.message,'error');
 showAlert('Devolución registrada');load();
}
load().catch(err=>{$('#app').innerHTML='<div class="card"><div class="card-header"><h3>Módulo pendiente de activar</h3></div><div class="card-body"><p>No fue posible cargar las tablas de implementos deportivos.</p><p>Ejecuta el archivo <strong>supabase/modulo_implementos_deportivos.sql</strong> en el SQL Editor del proyecto Supabase y vuelve a abrir esta página.</p><div class="alert alert-error">'+escapeHtml(err.message||'Error de base de datos')+'</div></div></div>'});