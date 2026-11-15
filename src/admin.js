import { loadDirectory, validateDirectory, editCatalogue, DAYS, normalize } from './directory.js';
import { esc } from './ui.js';
import { COURSES, COURSE_IDS } from './courses.js';

const KEY='rumbo-directory-draft-v1';
const labels={professors:'Profesores',officeHours:'Horarios de consulta',teachings:'Docencia por semestre',subjects:'Asignaturas',departments:'Departamentos',periods:'Semestres',campuses:'Campus',sources:'Fuentes'};
const fields={
  professors:[['name','Nombre','text',true],['departmentId','Departamento','departments',true],['email','Correo de contacto','email'],['office','Oficina','text'],['locationNote','Indicaciones de ubicación','text'],['note','Información adicional','textarea']],
  officeHours:[['professorId','Profesor','professors',true],['periodId','Semestre','periods',true],['campusId','Campus','campuses',true],['kind','Modalidad','kind',true],['day','Día','day'],['start','Hora de inicio','time'],['end','Hora de término','time'],['location','Lugar (vacío: usa la oficina del profesor)','text'],['note','Información adicional','textarea']],
  teachings:[['professorId','Profesor','professors',true],['subjectId','Asignatura','subjects',true],['periodId','Semestre','periods',true],['section','Paralelo (opcional)','text']],
  subjects:[['code','Código de asignatura','text',true],['name','Nombre de la asignatura','text',true],['departmentId','Departamento','departments',true],['calculatorId','Calculadora existente (opcional)','calculator']],
  departments:[['name','Nombre del departamento','text',true],['shortName','Abreviatura','text']],
  periods:[['id','Código del semestre, por ejemplo 2027-1','text',true],['name','Nombre del semestre','text',true]],
  campuses:[['name','Nombre del campus','text',true]],
  sources:[['title','Nombre de la fuente','text',true],['sheet','Hoja o sección','text'],['receivedAt','Fecha de recepción','date'],['note','Observaciones','textarea']]
};
let data=null,published=null,previous=null,collection='professors',selected='',confirmAction=null,dirty=false;
let storage;try{storage=localStorage;}catch{storage=null;}
const el=id=>document.getElementById(id);
const status=text=>el('admin-status').textContent=text;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function errors(error){const issues=error?.issues || [error.message || 'No pudimos completar el cambio.'];el('admin-errors').innerHTML=`<div class="admin-error"><strong>Revisa estos datos antes de guardar.</strong><ul>${issues.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;el('admin-errors').scrollIntoView({block:'nearest'});}
function ask(title,copy,action){el('admin-dialog-title').textContent=title;el('admin-dialog-copy').textContent=copy;confirmAction=action;el('admin-dialog').showModal();}
function recordName(row,type=collection){
  if(type==='officeHours')return `${data.professors.find(p=>p.id===row.professorId)?.name || row.professorId} · ${row.periodId} · ${row.kind==='weekly'?`${DAYS[row.day]} ${row.start}`:'Por coordinar'}`;
  if(type==='teachings')return `${data.professors.find(p=>p.id===row.professorId)?.name || row.professorId} · ${data.subjects.find(s=>s.id===row.subjectId)?.code || row.subjectId} · ${row.periodId}${row.section?' · '+row.section:''}`;
  if(type==='subjects')return `${row.code} · ${row.name}`;
  return row.name || row.title || row.id;
}
function saveDraft(){try{if(!storage)throw Error();storage.setItem(KEY,JSON.stringify(data));status('Borrador guardado en este navegador. Todavía no está publicado.');}catch{status('No se pudo guardar en el navegador. Descarga el catálogo para conservar tus cambios.');}}
function setData(next,{save=true}={}){previous=data;data=next;dirty=false;el('admin-errors').innerHTML='';if(save)saveDraft();render();}
function options(type){
  if(type==='kind')return [['weekly','Horario semanal'],['appointment','Coordinar por correo']];
  if(type==='day')return DAYS.slice(1).map((v,i)=>[String(i+1),v]);
  if(type==='calculator')return [['','Sin calculadora'],...COURSE_IDS.map(id=>[id,`${COURSES[id].code} · ${COURSES[id].name}`])];
  return (data[type] || []).map(row=>[row.id,recordName(row,type)]).sort((a,b)=>a[1].localeCompare(b[1],'es'));
}
function fieldHTML([key,label,type,required],row){
  const value=row[key] ?? (key==='periodId'?data.defaultPeriodId:key==='kind'?'weekly':'');
  const attrs=`id="edit-${key}" name="${key}" ${required?'required':''}`;
  let input;
  if(['text','email','time','date'].includes(type))input=`<input ${attrs} type="${type}" value="${esc(value)}" maxlength="${key==='name'?150:500}" ${key==='id'&&selected?'readonly':''}>`;
  else if(type==='textarea')input=`<textarea ${attrs} rows="3" maxlength="500">${esc(value)}</textarea>`;
  else input=`<select ${attrs}>${!required&&type!=='calculator'?'<option value="">Sin especificar</option>':''}${required&&!['kind'].includes(type)?'<option value="">Selecciona una opción</option>':''}${options(type).map(([v,l])=>`<option value="${esc(v)}" ${String(value)===v?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
  return `<div class="admin-field ${type==='textarea'?'wide':''}" ${['day','start','end'].includes(key)?'data-weekly-field':''}><label for="edit-${key}">${esc(label)}${required?' <span aria-hidden="true">*</span>':''}</label>${input}</div>`;
}
function modeFields(){if(collection!=='officeHours')return;const weekly=el('edit-kind').value==='weekly';document.querySelectorAll('[data-weekly-field]').forEach(node=>{node.hidden=!weekly;const input=node.querySelector('input,select');input.disabled=!weekly;input.required=weekly;});}
function form(){const row=data[collection].find(r=>r.id===selected) || {};el('admin-form').innerHTML=`<div class="admin-form-heading"><h2>${selected?'Editar registro':'Nuevo registro'}</h2>${selected?`<span>${esc(row.id)}</span>`:''}</div><div class="admin-fields">${fields[collection].map(f=>fieldHTML(f,row)).join('')}</div><div class="admin-form-actions"><button class="primary-button" type="submit">Guardar en borrador</button>${selected?'<button class="text-button danger" type="button" id="admin-delete">Eliminar registro</button>':''}</div>`;modeFields();dirty=false;}
function render(){
  el('admin-default-period').disabled=false; el('admin-default-period').innerHTML=data.periods.map(p=>`<option value="${p.id}" ${p.id===data.defaultPeriodId?'selected':''}>${esc(p.name)}</option>`).join('');
  el('admin-export').disabled=false;el('admin-new').disabled=false;el('admin-restore').disabled=!published;el('admin-undo').disabled=!previous;
  el('admin-summary').innerHTML=`<div class="admin-stats"><span><b>${data.professors.length}</b> profesores</span><span><b>${data.departments.length}</b> departamentos</span><span><b>${data.subjects.length}</b> asignaturas</span><span><b>${data.officeHours.length}</b> registros de atención</span><span><b>${data.teachings.length}</b> vínculos de docencia</span></div>`;
  el('admin-collection').innerHTML=Object.entries(labels).map(([v,l])=>`<option value="${v}" ${v===collection?'selected':''}>${l}</option>`).join('');
  const rows=[...data[collection]].sort((a,b)=>recordName(a).localeCompare(recordName(b),'es'));
  if(!rows.some(r=>r.id===selected))selected='';
  el('admin-record').innerHTML='<option value="">Nuevo registro</option>'+rows.map(row=>`<option value="${row.id}" ${row.id===selected?'selected':''}>${esc(recordName(row))}</option>`).join('');form();
}
function abandonThen(action){if(dirty)ask('¿Descartar cambios sin guardar?','Los campos que estás editando aún no forman parte del borrador.',()=>{dirty=false;action();});else action();}
function slug(text){return normalize(text).replace(/[^a-z0-9]+/g,'-').slice(0,80).replace(/^-|-$/g,'')||'registro';}
function newId(row){let id=slug(row.name || row.code || row.title || [row.professorId,row.subjectId,row.periodId,row.day,row.start].filter(Boolean).join('-')),candidate=id,n=2;while(data[collection].some(r=>r.id===candidate))candidate=id+'-'+n++;return candidate;}
el('admin-form').addEventListener('input',()=>dirty=true);
el('admin-form').addEventListener('change',()=>{dirty=true;modeFields();});
el('admin-form').addEventListener('submit',event=>{
  event.preventDefault();if(!data)return;
  try{
    const old=data[collection].find(r=>r.id===selected),row={...old};const fd=new FormData(event.currentTarget);
    for(const [key] of fields[collection])row[key]=String(fd.get(key) ?? '').trim();
    if(collection==='officeHours'){row.day=row.kind==='weekly'?Number(row.day):null;if(row.kind!=='weekly'){row.start='';row.end='';}}
    row.id=selected || row.id || newId(row);
    if(!selected && data[collection].some(r=>r.id===row.id))throw Error('Ese identificador ya existe. Selecciona el registro para editarlo.');
    // A manual change is no longer claimed as an exact transcription of a source row.
    if(old)for(const key of ['sourceId','sourceRow','sourceSchedule','sourceOffice'])delete row[key];
    const next=editCatalogue(data,collection,row);next.updatedAt=today();selected=row.id;setData(next);
  }catch(error){errors(error);}
});
el('admin-form').addEventListener('click',event=>{
  if(!event.target.closest('#admin-delete'))return;
  ask('¿Eliminar este registro del borrador?','Si otros registros lo utilizan, primero tendrás que modificar esas relaciones.',()=>{try{const next=editCatalogue(data,collection,{id:selected},{remove:true});next.updatedAt=today();selected='';setData(next);}catch(error){errors(error);}});
});
el('admin-collection').onchange=event=>{const next=event.target.value;event.target.value=collection;abandonThen(()=>{collection=next;selected='';render();});};
el('admin-record').onchange=event=>{const next=event.target.value;event.target.value=selected;abandonThen(()=>{selected=next;render();});};
el('admin-default-period').onchange=event=>{const next=event.target.value;event.target.value=data.defaultPeriodId;abandonThen(()=>{try{setData(validateDirectory({...data,defaultPeriodId:next,updatedAt:today()}));}catch(error){errors(error);}});};
el('admin-new').onclick=()=>abandonThen(()=>{selected='';render();el('admin-form').querySelector('input,select')?.focus();});
el('admin-undo').onclick=()=>abandonThen(()=>{if(!previous)return;const old=previous;previous=null;data=old;dirty=false;saveDraft();render();});
el('admin-restore').onclick=()=>ask('¿Restaurar el catálogo publicado?','Se descartará el borrador local. Puedes descargarlo antes de continuar.',()=>{setData(structuredClone(published));status('Borrador restaurado desde el catálogo publicado.');});
el('admin-export').onclick=()=>{
  if(!data)return;
  const download=()=>{try{const valid=validateDirectory(data);const url=URL.createObjectURL(new Blob([JSON.stringify(valid,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='directory.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Catálogo descargado y validado. Para publicarlo, actualiza data/directory.json.');}catch(error){errors(error);}};
  if(dirty)ask('Hay campos sin guardar.','La descarga incluirá únicamente los cambios que ya guardaste en el borrador.',download);else download();
};
el('admin-import').onclick=()=>el('admin-file').click();
el('admin-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error('El archivo supera 2 MB.');const incoming=validateDirectory(JSON.parse(await file.text()));ask('¿Usar este catálogo como borrador?',`Contiene ${incoming.professors.length} profesores y ${incoming.officeHours.length} registros de atención. Reemplazará el borrador local.`,()=>{selected='';setData(incoming);});}catch(error){errors(error);}finally{event.target.value='';}};
el('admin-cancel').onclick=()=>{confirmAction=null;el('admin-dialog').close();};
el('admin-confirm').onclick=()=>{const action=confirmAction;confirmAction=null;el('admin-dialog').close();action?.();};
el('admin-dialog').addEventListener('cancel',()=>confirmAction=null);
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
async function init(){
  let draft=null;try{const raw=storage?.getItem(KEY);if(raw){if(raw.length>2000000)throw Error();draft=validateDirectory(JSON.parse(raw));}}catch{status('No se pudo recuperar el borrador local. Se intentará cargar el publicado.');}
  try{published=await loadDirectory();data=draft || structuredClone(published);render();status(draft?'Recuperamos tu borrador local. Todavía no está publicado.':'Catálogo publicado cargado. Puedes preparar un borrador.');}
  catch{if(draft){data=draft;render();status('No hay conexión con el catálogo publicado. Puedes seguir editando tu borrador local.');}else{el('admin-form').innerHTML='<p>No se pudo cargar el catálogo. Importa un archivo válido para continuar, o vuelve a cargar la página.</p>';status('Catálogo no disponible. Las notas de los estudiantes no se ven afectadas.');}}
}
init();
