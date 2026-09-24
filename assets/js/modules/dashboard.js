import{requireProfile}from'../session.js';import{supabase}from'../supabase.js';import{renderNavbar}from'../navbar.js';import{escapeHtml,formatDate,formatDateTime,badgeClass,$}from'../utils.js';
const p=await requireProfile('dashboard');renderNavbar(p,'dashboard');
async function count(table,build=q=>q){const{count,error}=await build(supabase.from(table).select('*',{count:'exact',head:true}));if(error)throw error;return count||0}
async function safeCount(table,build=q=>q){try{const{count,error}=await build(supabase.from(table).select('*',{count:'exact',head:true}));return error?0:(count||0)}catch{return 0}}
function welcome(copy){return '<div class="welcome"><div><h2>Bienvenido, '+escapeHtml(p.nombre.split(' ')[0])+'</h2><p>'+escapeHtml(copy)+'</p></div><div class="date-chip"><strong>'+new Date().getDate()+'</strong>'+new Intl.DateTimeFormat('es-CO',{month:'long'}).format(new Date())+'</div></div>'}
function stat(label,value,icon){return '<div class="stat-card"><div class="stat-icon"><i class="fas '+icon+'"></i></div><div><div class="stat-value">'+value+'</div><div class="stat-label">'+escapeHtml(label)+'</div></div></div>'}
async function renderBienestar(){
 const today=new Date().toISOString().slice(0,10);
 const [activas,participaciones,prestamosActivos]=await Promise.all([
  safeCount('actividades_bienestar',q=>q.eq('estado','Activa')),
  safeCount('inscripciones_bienestar'),
  safeCount('prestamos_implementos',q=>q.eq('estado','Prestado'))
 ]);
 const [{data:items},{data:acts},{data:loans}]=await Promise.all([
  supabase.from('implementos_deportivos').select('cantidad_total,cantidad_disponible,estado').eq('estado','Activo'),
  supabase.from('actividades_bienestar').select('id_actividad,titulo,fecha,hora,lugar,cupos_disponibles').gte('fecha',today).eq('estado','Activa').order('fecha').limit(5),
  supabase.from('prestamos_implementos').select('id_prestamo,id_implemento,id_estudiante,cantidad,fecha_prestamo,estado').eq('estado','Prestado').order('fecha_prestamo',{ascending:false}).limit(6)
 ]);
 const unidades=(items||[]).reduce((s,i)=>s+Number(i.cantidad_disponible||0),0);
 const itemIds=[...new Set((loans||[]).map(x=>x.id_implemento))];
 const studentIds=[...new Set((loans||[]).map(x=>x.id_estudiante))];
 let implementos=[],estudiantes=[];
 if(itemIds.length){const r=await supabase.from('implementos_deportivos').select('id_implemento,nombre,codigo').in('id_implemento',itemIds);implementos=r.data||[]}
 if(studentIds.length){const r=await supabase.from('usuarios').select('id_usuario,nombre,documento').in('id_usuario',studentIds);estudiantes=r.data||[]}
 const im=new Map(implementos.map(x=>[Number(x.id_implemento),x]));
 const es=new Map(estudiantes.map(x=>[Number(x.id_usuario),x]));
 const cards=stat('Actividades activas',activas,'fa-heartbeat')+stat('Participaciones',participaciones,'fa-users')+stat('Unidades deportivas disponibles',unidades,'fa-basketball')+stat('Préstamos activos',prestamosActivos,'fa-handshake');
 const actsHtml=(acts||[]).length?'<table class="data-table"><thead><tr><th>Actividad</th><th>Fecha</th><th>Hora</th><th>Lugar</th><th>Cupos</th></tr></thead><tbody>'+(acts||[]).map(a=>'<tr><td>'+escapeHtml(a.titulo)+'</td><td>'+formatDate(a.fecha)+'</td><td>'+escapeHtml(a.hora||'—')+'</td><td>'+escapeHtml(a.lugar||'—')+'</td><td>'+Number(a.cupos_disponibles||0)+'</td></tr>').join('')+'</tbody></table>':'<div class="empty-state">Sin actividades próximas</div>';
 const loanHtml=(loans||[]).length?'<table class="data-table"><thead><tr><th>Estudiante</th><th>Implemento</th><th>Cantidad</th><th>Hora préstamo</th></tr></thead><tbody>'+(loans||[]).map(l=>{const u=es.get(Number(l.id_estudiante))||{},i=im.get(Number(l.id_implemento))||{};return '<tr><td>'+escapeHtml(u.nombre||'—')+'<br><small>'+escapeHtml(u.documento||'')+'</small></td><td>'+escapeHtml(i.nombre||'—')+'</td><td>'+Number(l.cantidad||1)+'</td><td>'+formatDateTime(l.fecha_prestamo)+'</td></tr>'}).join('')+'</tbody></table>':'<div class="empty-state">No hay implementos prestados en este momento</div>';
 $('#app').innerHTML=welcome('Panel de Bienestar Universitario')+'<div class="stats-grid">'+cards+'</div><div class="grid-2"><div class="card"><div class="card-header"><h3>Próximas actividades</h3><a href="./bienestar.html">Gestionar</a></div><div class="card-body">'+actsHtml+'</div></div><div class="card"><div class="card-header"><h3>Préstamos deportivos activos</h3><a href="./implementos-deportivos.html">Gestionar</a></div><div class="card-body">'+loanHtml+'</div></div></div>';
}
async function renderGeneral(){
 const [consultas,incaps,actividades,usuarios,inventario]=await Promise.all([
  count('consultas'),count('incapacidades',q=>q.in('estado',['Radicada','En revisión'])),count('actividades_bienestar',q=>q.eq('estado','Activa')),count('usuarios'),count('inventario')
 ]);
 const [{data:incs},{data:cons},{data:acts}]=await Promise.all([
  supabase.from('incapacidades').select('id_incapacidad,fecha_inicio,estado,pacientes(programa_academico,usuarios(nombre))').order('fecha_radicacion',{ascending:false}).limit(5),
  supabase.from('consultas').select('id_consulta,fecha,motivo,estado,pacientes(programa_academico,usuarios(nombre))').order('fecha',{ascending:false}).limit(5),
  supabase.from('actividades_bienestar').select('id_actividad,titulo,fecha,hora,lugar').gte('fecha',new Date().toISOString().slice(0,10)).eq('estado','Activa').order('fecha').limit(5)
 ]);
 const cards=stat('Consultas',consultas,'fa-stethoscope')+stat('Incapacidades pendientes',incaps,'fa-file-medical')+stat('Actividades activas',actividades,'fa-heartbeat')+stat('Usuarios',usuarios,'fa-users')+stat('Inventario',inventario,'fa-boxes');
 const incHtml=(incs||[]).length?'<table class="data-table"><thead><tr><th>Estudiante</th><th>Programa</th><th>Inicio</th><th>Estado</th></tr></thead><tbody>'+(incs||[]).map(i=>'<tr><td>'+escapeHtml(i.pacientes?.usuarios?.nombre||'—')+'</td><td>'+escapeHtml(i.pacientes?.programa_academico||'—')+'</td><td>'+formatDate(i.fecha_inicio)+'</td><td><span class="badge badge-'+badgeClass(i.estado)+'">'+escapeHtml(i.estado)+'</span></td></tr>').join('')+'</tbody></table>':'<div class="empty-state">Sin incapacidades registradas</div>';
 const conHtml=(cons||[]).length?'<table class="data-table"><thead><tr><th>Paciente</th><th>Motivo</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>'+(cons||[]).map(c=>'<tr><td>'+escapeHtml(c.pacientes?.usuarios?.nombre||'—')+'</td><td>'+escapeHtml((c.motivo||'').slice(0,45))+'</td><td>'+formatDateTime(c.fecha)+'</td><td><span class="badge badge-'+badgeClass(c.estado)+'">'+escapeHtml(c.estado)+'</span></td></tr>').join('')+'</tbody></table>':'<div class="empty-state">Sin consultas registradas</div>';
 const actHtml=(acts||[]).length?'<table class="data-table"><thead><tr><th>Actividad</th><th>Fecha</th><th>Hora</th><th>Lugar</th></tr></thead><tbody>'+(acts||[]).map(a=>'<tr><td>'+escapeHtml(a.titulo)+'</td><td>'+formatDate(a.fecha)+'</td><td>'+escapeHtml(a.hora||'—')+'</td><td>'+escapeHtml(a.lugar||'—')+'</td></tr>').join('')+'</tbody></table>':'<div class="empty-state">Sin actividades próximas</div>';
 $('#app').innerHTML=welcome('Panel de control del Sistema Integral de Salud Universitaria')+'<div class="stats-grid">'+cards+'</div><div class="grid-2"><div class="card"><div class="card-header"><h3>Incapacidades recientes</h3><a href="./incapacidades.html">Ver todas</a></div><div class="card-body">'+incHtml+'</div></div><div class="card"><div class="card-header"><h3>Consultas recientes</h3><a href="./consultas.html">Ver todas</a></div><div class="card-body">'+conHtml+'</div></div></div><div class="card"><div class="card-header"><h3>Próximas actividades</h3></div><div class="card-body">'+actHtml+'</div></div>';
}
if(Number(p.id_rol)===7)renderBienestar();else renderGeneral();