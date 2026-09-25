import{supabase}from'./supabase.js';import{escapeHtml}from'./utils.js';

export async function loadOperationalStudents(){
 const{data,error}=await supabase.rpc('listar_estudiantes_operacion');
 if(error)throw error;
 return data||[];
}

export function studentLabel(s){
 const code=s.codigo_estudiantil||'SIN-ID';
 const program=s.programa_academico?' - '+s.programa_academico:'';
 return code+' - '+(s.nombre||'Sin nombre')+program;
}

export function studentOptions(students,valueField='id_paciente',selected=''){
 return '<option value="">Seleccionar estudiante...</option>'+students.map(s=>'<option value="'+escapeHtml(s[valueField])+'" '+(String(s[valueField])===String(selected)?'selected':'')+'>'+escapeHtml(studentLabel(s))+'</option>').join('');
}

export function filterStudentSelect(select,students,term,valueField='id_paciente'){
 const current=select.value;
 const q=String(term||'').trim().toLowerCase();
 const filtered=!q?students:students.filter(s=>[
  s.codigo_estudiantil,s.nombre,s.documento,s.programa_academico
 ].some(v=>String(v||'').toLowerCase().includes(q)));
 select.innerHTML=studentOptions(filtered,valueField,current);
 if(filtered.some(s=>String(s[valueField])===String(current)))select.value=current;
}

export function quickStudentHtml(prefix){
 return '<div class="card" style="margin-top:12px"><div class="card-header"><h3>Crear estudiante sin salir del módulo</h3></div><div class="card-body"><div class="form-grid">'+
 '<div class="form-group"><label>ID de estudiante *</label><input id="'+prefix+'Codigo" class="form-control" inputmode="numeric" placeholder="Ej. 824426" required></div>'+
 '<div class="form-group"><label>Nombre completo *</label><input id="'+prefix+'Nombre" class="form-control" required></div>'+
 '<div class="form-group"><label>Programa</label><input id="'+prefix+'Programa" class="form-control"></div>'+
 '<div class="form-group"><label>Documento</label><input id="'+prefix+'Documento" class="form-control"></div>'+
 '<div class="form-group"><label>Correo (opcional)</label><input id="'+prefix+'Correo" type="email" class="form-control" placeholder="Si no se indica, queda como registro operativo"></div>'+
 '<div class="form-group"><label>Teléfono</label><input id="'+prefix+'Telefono" class="form-control"></div>'+
 '</div><button type="button" id="'+prefix+'Create" class="btn btn-primary"><i class="fas fa-user-plus"></i> Crear y seleccionar estudiante</button><p style="margin-top:8px"><small>El ID de estudiante es el identificador principal. Si no se registra correo, se crea un perfil operativo sin acceso de inicio de sesión.</small></p></div></div>';
}

export async function createQuickStudent(prefix){
 const codigo=document.querySelector('#'+prefix+'Codigo')?.value.trim();
 const nombre=document.querySelector('#'+prefix+'Nombre')?.value.trim();
 if(!codigo)throw new Error('Ingresa el ID de estudiante.');
 if(!nombre)throw new Error('Ingresa el nombre del estudiante.');
 const params={
  p_codigo:codigo,
  p_nombre:nombre,
  p_programa:document.querySelector('#'+prefix+'Programa')?.value.trim()||null,
  p_documento:document.querySelector('#'+prefix+'Documento')?.value.trim()||null,
  p_correo:document.querySelector('#'+prefix+'Correo')?.value.trim()||null,
  p_telefono:document.querySelector('#'+prefix+'Telefono')?.value.trim()||null
 };
 const{data,error}=await supabase.rpc('crear_estudiante_rapido',params);
 if(error)throw error;
 return data;
}
