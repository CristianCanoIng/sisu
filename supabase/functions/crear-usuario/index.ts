import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors={
 'Access-Control-Allow-Origin':'*',
 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})

 let admin:any=null
 let createdAuthId:string|null=null

 try{
  const url=Deno.env.get('SUPABASE_URL')!
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anon=Deno.env.get('SUPABASE_ANON_KEY')!
  const auth=req.headers.get('Authorization')||''

  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}})
  const{data:{user}}=await caller.auth.getUser()
  if(!user)throw new Error('No autorizado')

  const{data:profile}=await caller.from('usuarios').select('id_rol').eq('auth_user_id',user.id).single()
  if(!profile||![1,2].includes(Number(profile.id_rol)))throw new Error('Sin permiso')

  const body=await req.json()
  const rol=Number(body.id_rol)
  const rolesPermitidos=[1,2,3,4,5,7]
  if(!rolesPermitidos.includes(rol))throw new Error('Rol no permitido')
  if(!body.nombre?.trim())throw new Error('El nombre es obligatorio')
  if(!body.correo?.trim())throw new Error('El correo es obligatorio')
  if(!body.password||String(body.password).length<6)throw new Error('La contraseña temporal debe tener al menos 6 caracteres')

  const codigo=String(body.codigo_estudiantil||'').trim()
  if(rol===3){
   if(!codigo)throw new Error('El ID de estudiante es obligatorio')
   if(!/^[0-9]{4,20}$/.test(codigo))throw new Error('El ID de estudiante debe contener entre 4 y 20 dígitos')
  }

  admin=createClient(url,service)

  let existingPatient:any=null
  let existingUser:any=null

  if(rol===3){
   const{data:pac,error:pacErr}=await admin.from('pacientes').select('id_paciente,id_usuario,codigo_estudiantil').eq('codigo_estudiantil',codigo).maybeSingle()
   if(pacErr)throw pacErr
   existingPatient=pac

   if(existingPatient){
    const{data:usr,error:usrErr}=await admin.from('usuarios').select('id_usuario,auth_user_id,correo').eq('id_usuario',existingPatient.id_usuario).single()
    if(usrErr)throw usrErr
    existingUser=usr
    if(existingUser.auth_user_id)throw new Error('Ese ID de estudiante ya tiene una cuenta de acceso')
   }
  }

  const{data:created,error:aerr}=await admin.auth.admin.createUser({
   email:String(body.correo).trim().toLowerCase(),
   password:String(body.password),
   email_confirm:true,
   user_metadata:{nombre:String(body.nombre).trim()}
  })
  if(aerr)throw aerr
  createdAuthId=created.user.id

  if(existingUser){
   const{error:uerr}=await admin.from('usuarios').update({
    auth_user_id:created.user.id,
    nombre:String(body.nombre).trim(),
    correo:String(body.correo).trim().toLowerCase(),
    documento:body.documento?.trim()||null,
    telefono:body.telefono?.trim()||null,
    id_rol:3,
    estado:'Activo'
   }).eq('id_usuario',existingUser.id_usuario)
   if(uerr)throw uerr

   const{error:perr}=await admin.from('pacientes').update({
    programa_academico:body.programa?.trim()||null,
    semestre:body.semestre||null
   }).eq('id_paciente',existingPatient.id_paciente)
   if(perr)throw perr

   return new Response(JSON.stringify({
    ok:true,
    id_usuario:existingUser.id_usuario,
    id_paciente:existingPatient.id_paciente,
    codigo_estudiantil:codigo,
    perfil_existente:true
   }),{headers:{...cors,'Content-Type':'application/json'}})
  }

  const{data:u,error:uerr}=await admin.from('usuarios').insert({
   auth_user_id:created.user.id,
   nombre:String(body.nombre).trim(),
   correo:String(body.correo).trim().toLowerCase(),
   documento:body.documento?.trim()||null,
   telefono:body.telefono?.trim()||null,
   id_rol:rol,
   estado:'Activo'
  }).select('id_usuario').single()
  if(uerr)throw uerr

  let idPaciente:null|number=null
  if(rol===3){
   const{data:pac,error:perr}=await admin.from('pacientes').insert({
    id_usuario:u.id_usuario,
    codigo_estudiantil:codigo,
    programa_academico:body.programa?.trim()||null,
    semestre:body.semestre||null
   }).select('id_paciente').single()
   if(perr)throw perr
   idPaciente=pac.id_paciente
  }

  return new Response(JSON.stringify({
   ok:true,
   id_usuario:u.id_usuario,
   id_paciente:idPaciente,
   codigo_estudiantil:rol===3?codigo:null,
   perfil_existente:false
  }),{headers:{...cors,'Content-Type':'application/json'}})

 }catch(e){
  if(createdAuthId&&admin){
   try{await admin.auth.admin.deleteUser(createdAuthId)}catch{}
  }
  return new Response(JSON.stringify({error:e.message}),{status:400,headers:{...cors,'Content-Type':'application/json'}})
 }
})
