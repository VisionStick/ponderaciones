import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDirectory, searchProfessors, professorHours, professorSubjects, loadDirectory, editCatalogue, directoryRoute, readDirectoryRoute, normalize } from '../src/directory.js';
import { esc } from '../src/ui.js';
const published=JSON.parse(await readFile(new URL('../data/directory.json',import.meta.url),'utf8'));
function fixture(){return {schemaVersion:1,updatedAt:'2026-11-14',defaultPeriodId:'2026-2',sources:[],
  departments:[{id:'math',name:'Matemáticas'},{id:'physics',name:'Física'}],periods:[{id:'2026-2',name:'2026-2'},{id:'2027-1',name:'2027-1'}],campuses:[{id:'sj',name:'San Joaquín'}],
  professors:[{id:'ana',name:'Ana Pérez',email:'ana@example.org',departmentId:'math',office:'A-101',note:'',locationNote:''},{id:'juan',name:'Juan Muñoz',email:'juan@example.org',departmentId:'physics',office:'F-101',note:'',locationNote:''},{id:'sin',name:'Sin Horario',email:'',departmentId:'math',office:'',note:'',locationNote:''}],
  subjects:[{id:'mat1',code:'MAT070',name:'Cálculo',departmentId:'math'},{id:'mat2',code:'MAT071',name:'Cálculo en una Variable',departmentId:'math'}],
  teachings:[{id:'a1',professorId:'ana',subjectId:'mat1',periodId:'2026-2',section:'1'},{id:'a2',professorId:'ana',subjectId:'mat2',periodId:'2026-2',section:'1'},{id:'a3',professorId:'ana',subjectId:'mat1',periodId:'2026-2',section:'2'}],
  officeHours:[{id:'mon',professorId:'ana',periodId:'2026-2',campusId:'sj',kind:'weekly',day:1,start:'10:00',end:'11:00',location:'',note:''},{id:'coord',professorId:'juan',periodId:'2026-2',campusId:'sj',kind:'appointment',day:null,start:'',end:'',location:'',note:''}]
};}
const ids=(filters,data=fixture())=>searchProfessors(data,filters).map(p=>p.id);
test('Catálogo publicado válido y separado de las notas',()=>{assert.deepEqual(validateDirectory(published),published);assert.equal('grades' in published,false);});
test('Un profesor pertenece a varios ramos y paralelos sin duplicarse',()=>{const d=validateDirectory(fixture());assert.deepEqual(ids({subjectId:'mat1'},d),['ana']);assert.equal(professorSubjects(d,'ana').length,2);assert.equal(professorHours(d,'ana').length,1);});
for(const [label,filters,expected] of [
  ['nombre sin tildes',{query:'ANA PEREZ'},['ana']],['búsqueda con varias palabras',{query:'perez mat070'},['ana']],['oficina',{query:'A-101'},['ana']],
  ['departamento',{departmentId:'physics'},['juan']],['departamento y ramo',{departmentId:'physics',subjectId:'mat1'},[]],
  ['profesor',{professorId:'juan'},['juan']],['código de ramo',{query:'MAT071'},['ana']],['día',{day:'1'},['ana']],['día sin atención',{day:'7'},[]],
  ['coordinación por correo',{mode:'appointment'},['juan']],['horario fijo',{mode:'weekly'},['ana']],['sin horario',{mode:'missing'},['sin']],
  ['semestre futuro',{periodId:'2027-1',mode:'missing'},['ana','juan','sin']],['no reutilizar docencia de otro semestre',{periodId:'2027-1',subjectId:'mat1'},[]],
  ['filtro desconocido',{departmentId:'missing'},[]],['profesor desconocido',{professorId:'missing'},[]],['ramo desconocido',{subjectId:'missing'},[]],['semestre desconocido',{periodId:'missing'},[]],['modalidad desconocida',{mode:'wrong'},[]],
  ['combinación de todos los filtros',{query:'perez',subjectId:'mat2',departmentId:'math',professorId:'ana',day:'1',mode:'weekly',periodId:'2026-2'},['ana']]
])test(`Buscador: ${label}`,()=>assert.deepEqual(ids(filters),expected));
test('Búsqueda admite Mª, tildes y mayúsculas',()=>assert.equal(normalize('Mª Gabriela LÓPEZ'),'maria gabriela lopez'));
for(const [label,mutate] of [
  ['versión',d=>d.schemaVersion=2],['fecha imposible',d=>d.updatedAt='2026-02-31'],['lista ausente',d=>delete d.sources],['ID duplicado',d=>d.professors.push({...d.professors[0]})],
  ['correo duplicado',d=>d.professors[1].email='ANA@example.org'],['correo inválido',d=>d.professors[0].email='javascript:alert(1)'],['departamento ausente',d=>d.professors[0].departmentId='missing'],
  ['semestre predeterminado ausente',d=>d.defaultPeriodId='missing'],['profesor en relación ausente',d=>d.teachings[0].professorId='missing'],['asignatura ausente',d=>d.teachings[0].subjectId='missing'],
  ['relación duplicada',d=>d.teachings.push({...d.teachings[0],id:'extra'})],['código duplicado',d=>d.subjects[1].code='MAT 070'],
  ['horario duplicado',d=>d.officeHours.push({...d.officeHours[0],id:'extra'})],['horario solapado',d=>d.officeHours.push({...d.officeHours[0],id:'extra',start:'10:30',end:'12:00'})],
  ['día inválido',d=>d.officeHours[0].day=8],['hora imposible',d=>d.officeHours[0].start='24:00'],['intervalo invertido',d=>d.officeHours[0].end='09:00'],['intervalo nulo',d=>d.officeHours[0].end='10:00'],
  ['hora inventada al coordinar',d=>d.officeHours[1].day=1],['campus inexistente',d=>d.officeHours[0].campusId='missing'],['fuente inexistente',d=>d.professors[0].sourceId='missing'],['nombre vacío',d=>d.professors[0].name=' ']
])test(`Validación rechaza ${label}`,()=>{const d=fixture();mutate(d);assert.throws(()=>validateDirectory(d));});
test('Franjas consecutivas y mismo horario en otro semestre son válidos',()=>{const d=fixture();d.officeHours.push({...d.officeHours[0],id:'next',start:'11:00',end:'12:00'},{...d.officeHours[0],id:'future',periodId:'2027-1'});assert.ok(validateDirectory(d));});
test('Editor actualiza una sola ficha y mantiene sus relaciones',()=>{const d=fixture();const next=editCatalogue(d,'professors',{...d.professors[0],office:'A-999'});assert.equal(d.professors[0].office,'A-101');assert.equal(next.professors[0].office,'A-999');assert.equal(professorSubjects(next,'ana').length,2);assert.equal(next.professors.length,3);});
test('Editor bloquea eliminación de registros utilizados sin modificar el original',()=>{const d=fixture(),before=JSON.stringify(d);for(const c of ['professors','subjects','departments','periods','campuses'])assert.throws(()=>editCatalogue(d,c,{id:d[c][0].id},{remove:true}));assert.equal(JSON.stringify(d),before);});
test('Editor permite alta y eliminación de profesor sin horario',()=>{const d=fixture();const next=editCatalogue(d,'professors',{...d.professors[2],id:'nuevo',name:'Nuevo Profesor'});assert.equal(next.professors.length,4);assert.equal(editCatalogue(next,'professors',{id:'nuevo'},{remove:true}).professors.length,3);});
test('Catálogo validado es una copia independiente',()=>{const d=fixture();const next=validateDirectory(d);next.professors[0].name='Otro';assert.equal(d.professors[0].name,'Ana Pérez');});
test('Filtros sobreviven enlace y caracteres especiales sin corromperse',()=>{const f={query:'Pérez & A-101',subjectId:'mat1',professorId:'ana',departmentId:'math',day:'1',mode:'weekly',periodId:'2026-2'};assert.deepEqual(readDirectoryRoute(directoryRoute(f)),f);});
test('Texto externo se escapa para no ejecutar HTML',()=>assert.equal(esc('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
test('Carga por HTTP verifica estado, esquema y caché',async()=>{let options;const result=await loadDirectory({fetcher:async(url,opts)=>{options=opts;return new Response(JSON.stringify(fixture()));}});assert.equal(result.professors.length,3);assert.equal(options.cache,'no-cache');assert.equal(options.credentials,'same-origin');assert.ok(options.signal);});
for(const [label,response] of [['404',()=>new Response('',{status:404})],['JSON inválido',()=>new Response('{')],['esquema incorrecto',()=>new Response('{}')],['archivo grande',()=>new Response('x'.repeat(2000001))],['cabecera grande',()=>new Response('{}',{headers:{'content-length':'2000001'}})]])test(`Carga rechaza ${label}`,async()=>assert.rejects(()=>loadDirectory({fetcher:async()=>response()})));
test('Carga conserva el error de red y el aborto',async()=>{const signal=AbortSignal.abort();await assert.rejects(()=>loadDirectory({signal,fetcher:async(_,o)=>{o.signal.throwIfAborted();}}),{name:'AbortError'});await assert.rejects(()=>loadDirectory({fetcher:async()=>{throw Error('offline');}}),/offline/);});
