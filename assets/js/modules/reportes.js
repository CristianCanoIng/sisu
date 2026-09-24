import{requireProfile}from'../session.js';import{supabase}from'../supabase.js';import{renderNavbar}from'../navbar.js';import{escapeHtml,$}from'../utils.js';
const p=await requireProfile('reportes');renderNavbar(p,'reportes');
async function count(t,fn=q=>q){const{count,error}=await fn(supabase.from(t).select('*',{count:'exact',head:true}));if(error)throw error;return count||0}
async function safeCount(t,fn=q=>q){try{const{count,error}=await fn(supabase.from(t).select('*',{count:'exact',head:true}));return error?0:(count||0)}catch{return 0}}
async function group(table,column){const{data}=await supabase.from(table).select(column);const m={};(data||[]).forEach(r=>{const v=r[column]||'Sin clasificar';m[v]=(m[v]||0)+1});return Object.entries(m).map(([etiqueta,total])=>({etiqueta,total}))}
const tbl=(title,rows)=>'<div class="card"><div class="card-header"><h3>'+escapeHtml(title)+'</h3></div><div class="card-body"><table class="data-table"><thead><tr><th>Categoría</th><th>Total</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+escapeHtml(r.etiqueta)+'</td><td>'+r.total+'</td></tr>').join('')+'</tbody></table></div></div>';
async function bienestarReport(){
 const today=new Date().toISOString().slice(0,10);
 const [actividades,participaciones,tipos,prestamosActivos,devolucionesHoy]=await Promise.all([
  safeCount('actividades_bienestar'),safeCount('inscripciones_bienestar'),safeCount('implementos_deportivos'),safeCount('prestamos_implementos',q=>q.eq('estado','Prestado')),safeCount('prestamos_implementos',q=>q.eq('estado','Devuelto').gte('fecha_devolucion',today+'T00:00:00'))
 ]);
 const{data:items}=await supabase.from('implementos_deportivos').select('categoria,cantidad_disponible');
 const unidades=(items||[]).reduce((s,i)=>s+Number(i.cantidad_disponible||0),0);
 const [ac,pc]=await Promise.all([group('actividades_bienestar','categoria'),group('prestamos_implementos','estado')]);
 const im={};(items||[]).forEach(i=>{const k=i.categoria||'Otro';im[k]=(im[k]||0)+Number(i.cantidad_disponible||0)});
 const ic=Object.entries(im).map(([etiqueta,total])=>({etiqueta,total}));
 const cards=[['Actividades',actividades],['Participaciones',participaciones],['Tipos de implemento',tipos],['Unidades disponibles',unidades],['Préstamos activos',prestamosActivos],['Devoluciones hoy',devolucionesHoy]];
 $('#app').innerHTML='<div class="stats-grid">'+cards.map(x=>'<div class="stat-card"><div class="stat-value">'+x[1]+'</div><div class="stat-label">'+escapeHtml(x[0])+'</div></div>').join('')+'</div><div class="grid-3">'+tbl('Actividades por categoría',ac)+tbl('Disponibilidad deportiva',ic)+tbl('Préstamos por estado',pc)+'</div>';
}
async function generalReport(){
 const k=await Promise.all([count('consultas'),count('consultas',q=>q.eq('estado','Atendida')),count('actividades_bienestar'),count('inscripciones_bienestar'),count('eventos_sst'),count('asistencia_sst'),count('incapacidades'),count('incapacidades',q=>q.eq('estado','Aprobada'))]);
 const [ct,ss,ie]=await Promise.all([group('consultas','tipo_consulta'),group('eventos_sst','estado'),group('incapacidades','estado')]);
 $('#app').innerHTML='<div class="stats-grid">'+[['Consultas',k[0]],['Atendidas',k[1]],['Actividades',k[2]],['Participaciones',k[3]],['Eventos SST',k[4]],['Asistencias',k[5]],['Incapacidades',k[6]],['Aprobadas',k[7]]].map(x=>'<div class="stat-card"><div class="stat-value">'+x[1]+'</div><div class="stat-label">'+x[0]+'</div></div>').join('')+'</div><div class="grid-3">'+tbl('Consultas por tipo',ct)+tbl('SST por estado',ss)+tbl('Incapacidades por estado',ie)+'</div>';
}
if(Number(p.id_rol)===7)bienestarReport();else generalReport();