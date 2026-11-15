// One normalized catalogue, shared by the public directory and its data editor.
// No student grades enter this data path.
export const DIRECTORY_URL = new URL('../data/directory.json', import.meta.url);
export const DAYS = ['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
export const COLLECTIONS = ['departments','professors','subjects','teachings','officeHours','periods','campuses','sources'];
export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/mª/g,'maria').replace(/[^a-z0-9@-]+/g,' ').trim();
const cmp = (a,b) => a.localeCompare(b,'es',{sensitivity:'base',numeric:true});
const idPattern = /^[a-z0-9][a-z0-9-]{0,99}$/;
const clockPattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
export class DirectoryError extends Error {
  constructor(issues) { super(issues.join('\n')); this.name = 'DirectoryError'; this.issues = issues; }
}
export function validateDirectory(input) {
  const errors = [], check = (ok,message) => { if (!ok) errors.push(message); };
  if (!plain(input) || input.schemaVersion !== 1) throw new DirectoryError(['El catálogo no tiene un formato compatible (versión 1).']);
  for (const key of COLLECTIONS) check(Array.isArray(input[key]) && input[key].length <= 10000, `${key}: se espera una lista de hasta 10.000 registros.`);
  if (errors.length) throw new DirectoryError(errors);
  const text = (row,key,where,required=true,max=500) => check(typeof row[key] === 'string' && row[key].length <= max && (!required || row[key].trim().length > 0),`${where}: revisa ${key}.`);
  const maps = {};
  for (const key of COLLECTIONS) {
    maps[key] = new Map();
    for (const row of input[key]) {
      if (!plain(row) || !idPattern.test(row.id || '')) { errors.push(`${key}: identificador inválido.`); continue; }
      check(!maps[key].has(row.id),`${key}: el identificador ${row.id} está duplicado.`);
      maps[key].set(row.id,row);
    }
  }
  if (errors.length) throw new DirectoryError(errors);
  const ref = (row,key,table,where,optional=false) => check(optional && (row[key] == null || row[key] === '') || typeof row[key] === 'string' && maps[table].has(row[key]),`${where}: ${key} no existe en ${table}.`);
  check(datePattern.test(input.updatedAt) && !Number.isNaN(Date.parse(input.updatedAt)) && new Date(input.updatedAt).toISOString().slice(0,10) === input.updatedAt, 'Falta una fecha de actualización válida.');
  check(maps.periods.has(input.defaultPeriodId),'El semestre predeterminado no existe.');
  for (const key of ['departments','periods','campuses']) for (const row of input[key]) text(row,'name',`${key} / ${row.id}`,true,150);
  const emails = new Set();
  for (const row of input.professors) {
    const where = `Profesor ${row.id}`; text(row,'name',where,true,150); ref(row,'departmentId','departments',where);
    for (const key of ['office','locationNote','note','email']) text(row,key,where,false);
    if (row.email) {
      check(/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(row.email),`${where}: correo inválido.`);
      check(!emails.has(row.email.toLowerCase()),`${where}: ya existe un profesor con ese correo.`); emails.add(row.email.toLowerCase());
    }
    ref(row,'sourceId','sources',where,true);
  }
  const codes = new Set(), calculators = new Set();
  for (const row of input.subjects) {
    const where = `Asignatura ${row.id}`; text(row,'code',where,true,40); text(row,'name',where,true,180); ref(row,'departmentId','departments',where);
    const code = normalize(row.code).replace(/[- ]/g,''); check(!codes.has(code),`${where}: código duplicado.`); codes.add(code);
    if (row.calculatorId) { check(typeof row.calculatorId === 'string' && idPattern.test(row.calculatorId),`${where}: identificador de calculadora inválido.`); check(!calculators.has(row.calculatorId),`${where}: calculadora duplicada.`); calculators.add(row.calculatorId); }
  }
  const teachingKeys = new Set();
  for (const row of input.teachings) {
    const where = `Vínculo ${row.id}`;
    ref(row,'professorId','professors',where); ref(row,'subjectId','subjects',where); ref(row,'periodId','periods',where); text(row,'section',where,false,100);
    const key = [row.professorId,row.subjectId,row.periodId,normalize(row.section)].join('|'); check(!teachingKeys.has(key),`${where}: vínculo duplicado.`); teachingKeys.add(key);
  }
  const hourKeys = new Set(), weekly = [];
  for (const row of input.officeHours) {
    const where = `Horario ${row.id}`;
    ref(row,'professorId','professors',where); ref(row,'periodId','periods',where); ref(row,'campusId','campuses',where); ref(row,'sourceId','sources',where,true);
    text(row,'location',where,false,150); text(row,'note',where,false,1000);
    check(['weekly','appointment'].includes(row.kind),`${where}: modalidad desconocida.`);
    if (row.kind === 'weekly') {
      check(Number.isInteger(row.day) && row.day >= 1 && row.day <= 7,`${where}: día inválido.`);
      check(clockPattern.test(row.start) && clockPattern.test(row.end) && row.start < row.end,`${where}: la hora de término debe ser posterior al inicio (HH:MM).`);
      weekly.push(row);
    } else check(row.day === null && row.start === '' && row.end === '',`${where}: coordinar por correo no lleva un horario inventado.`);
    const key = [row.professorId,row.periodId,row.campusId,row.kind,row.day,row.start,row.end].join('|'); check(!hourKeys.has(key),`${where}: horario duplicado.`); hourKeys.add(key);
  }
  const byPerson = new Map();
  for (const row of weekly) {
    const key = [row.professorId,row.periodId,row.day].join('|'); const other = byPerson.get(key) || [];
    check(!other.some(x=>row.start < x.end && x.start < row.end),`Horario ${row.id}: se solapa con otro horario del mismo profesor.`);
    other.push(row); byPerson.set(key,other);
  }
  for (const row of input.sources) { text(row,'title',`Fuente ${row.id}`,true,300); if (row.sha256) check(/^[a-f0-9]{64}$/.test(row.sha256),`Fuente ${row.id}: huella inválida.`); }
  if (errors.length) throw new DirectoryError(errors.slice(0,40));
  return structuredClone(input);
}
export async function loadDirectory({url=DIRECTORY_URL,fetcher=globalThis.fetch,signal}={}) {
  const ownSignal = signal || AbortSignal.timeout(10000);
  const response = await fetcher(url,{signal:ownSignal,cache:'no-cache',credentials:'same-origin'});
  if (!response.ok) throw new Error('No pudimos cargar los horarios. Tus notas siguen disponibles.');
  if (Number(response.headers?.get('content-length')) > 2000000) throw new Error('El catálogo supera el tamaño admitido.');
  const text = await response.text(); if (text.length > 2000000) throw new Error('El catálogo supera el tamaño admitido.');
  return validateDirectory(JSON.parse(text));
}
export function professorHours(data,id,periodId=data.defaultPeriodId) {
  return data.officeHours.filter(h=>h.professorId===id && h.periodId===periodId).sort((a,b)=>(a.day || 8)-(b.day || 8) || cmp(a.start,b.start));
}
export function professorSubjects(data,id,periodId=data.defaultPeriodId) {
  const ids = new Set(data.teachings.filter(t=>t.professorId===id && t.periodId===periodId).map(t=>t.subjectId));
  return data.subjects.filter(s=>ids.has(s.id)).sort((a,b)=>cmp(a.code,b.code));
}
export function searchProfessors(data,filters={}) {
  const period = filters.periodId || data.defaultPeriodId;
  if (!data.periods.some(p=>p.id===period) || filters.mode && !['weekly','appointment','missing'].includes(filters.mode)) return [];
  const words = normalize(filters.query).split(' ').filter(Boolean);
  const subject = data.subjects.find(s=>s.id===filters.subjectId);
  return data.professors.filter(p=>{
    if (filters.departmentId && p.departmentId!==filters.departmentId) return false;
    const courses = professorSubjects(data,p.id,period), hours = professorHours(data,p.id,period);
    if (filters.subjectId && (!subject || !courses.some(s=>s.id===subject.id))) return false;
    if (filters.professorId && p.id!==filters.professorId) return false;
    if (filters.day && !hours.some(h=>h.kind==='weekly' && h.day===Number(filters.day))) return false;
    if (filters.mode === 'weekly' && !hours.some(h=>h.kind==='weekly')) return false;
    if (filters.mode === 'appointment' && !hours.some(h=>h.kind==='appointment')) return false;
    if (filters.mode === 'missing' && hours.length) return false;
    const haystack = normalize([p.name,p.email,p.office,...courses.flatMap(s=>[s.code,s.name]),...hours.map(h=>h.location)].join(' '));
    return words.every(w=>haystack.includes(w));
  }).sort((a,b)=>cmp(a.name,b.name));
}
export function catalogueStats(data) {
  return {professors:data.professors.length,weekly:data.officeHours.filter(h=>h.periodId===data.defaultPeriodId && h.kind==='weekly').length,appointment:data.officeHours.filter(h=>h.periodId===data.defaultPeriodId && h.kind==='appointment').length,teachings:data.teachings.length};
}
export function readDirectoryRoute(hash) {
  const q = hash.split('?')[1] || ''; const p = new URLSearchParams(q);
  return {departmentId:p.get('departamento') || '',subjectId:p.get('ramo') || '',professorId:p.get('profesor') || '',query:p.get('q') || '',day:p.get('dia') || '',mode:p.get('modalidad') || '',periodId:p.get('semestre') || ''};
}
export function directoryRoute(filters={}) {
  const p = new URLSearchParams();
  for (const [key,label] of Object.entries({departmentId:'departamento',subjectId:'ramo',professorId:'profesor',query:'q',day:'dia',mode:'modalidad',periodId:'semestre'})) if(filters[key]) p.set(label,filters[key]);
  return '#consultas'+(p.size?'?'+p:'');
}
export function editCatalogue(data,collection,record,{remove=false}={}) {
  if (!COLLECTIONS.includes(collection)) throw new DirectoryError(['Colección desconocida.']);
  const draft = structuredClone(data), at = draft[collection].findIndex(r=>r.id===record.id);
  if (remove) { if(at<0) throw new DirectoryError(['El registro ya no existe.']); draft[collection].splice(at,1); }
  else if (at<0) draft[collection].push(record); else draft[collection][at] = record;
  // Validation blocks deletions with dependent records and duplicate relationships.
  return validateDirectory(draft);
}
