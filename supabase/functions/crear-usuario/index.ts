import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 try{
  const url=Deno.env.get('SUPABASE_URL')!,service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,anon=Deno.env.get('SUPABASE_ANON_KEY')!
  const auth=req.headers.get('Authorization')||''
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}})
  const{data:{user}}=await caller.auth.getUser();if(!user)throw new Error('No autorizado')
  const{data:profile}=await caller.from('usuarios').select('id_rol').eq('auth_user_id',user.id).single();if(!profile||![1,2].includes(Number(profile.id_rol)))throw new Error('Sin permiso')
  const body=await req.json();const admin=createClient(url,service)
  const{data:created,error:aerr}=await admin.auth.admin.createUser({email:body.correo,password:body.password,email_confirm:true,user_metadata:{nombre:body.nombre}});if(aerr)throw aerr
  const{data:u,error:uerr}=await admin.from('usuarios').insert({auth_user_id:created.user.id,nombre:body.nombre,correo:body.correo,documento:body.documento||null,telefono:body.telefono||null,id_rol:Number(body.id_rol),estado:'Activo'}).select('id_usuario').single();if(uerr)throw uerr
  if(Number(body.id_rol)===3){const{error:perr}=await admin.from('pacientes').insert({id_usuario:u.id_usuario,programa_academico:body.programa||null,semestre:body.semestre||null});if(perr)throw perr}
  return new Response(JSON.stringify({ok:true,id_usuario:u.id_usuario}),{headers:{...cors,'Content-Type':'application/json'}})
 }catch(e){return new Response(JSON.stringify({error:e.message}),{status:400,headers:{...cors,'Content-Type':'application/json'}})}
})