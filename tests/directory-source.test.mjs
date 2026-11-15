import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../data/directory.json',import.meta.url),'utf8'));
// Independent manual transcription of the supplied sheet (rows 4–52).
// Only records still attributed to that source are checked. Later edited or new
// records have their own provenance and do not require editing these fixtures.
const expected=[
 ['A-157','1 12:30 13:40'],['A-169','3 11:05 12:15'],['A-157','2 09:40 10:50'],['A-165','3 14:40 15:50'],['A-157','4 11:05 12:15'],['A-157','appointment'],['A-157','1 11:05 12:15'],['A-157','2 09:40 10:50'],['A-157','5 09:40 10:50'],['A-157','5 09:40 10:50'],['A-157','appointment'],['A-148','2 14:40 15:50'],['F-551','1 08:15 08:50;2 08:15 08:50;3 08:15 08:50;4 08:15 08:50'],['A-163','2 09:40 10:50'],['A-157','2 16:05 17:15'],['A-157','2 11:40 12:15'],['A-157','5 09:40 10:50'],['A-157','5 14:40 15:50'],['A-159','appointment'],['A-166','2 11:05 12:15'],['A-164','1 11:05 12:15'],['A-150','1 12:30 13:05'],['A-157','2 11:05 12:15'],['A-159','3 17:00 18:00'],['A-157','1 16:05 17:15'],['A-160','3 14:40 15:50;5 14:40 15:50'],['A-152','2 14:40 15:50;4 14:40 15:50'],['A-152','5 11:05 12:15'],['A-154','3 11:05 12:15'],['A-151','2 16:05 17:15'],['A-147','2 14:40 15:50;4 14:40 15:50'],['A-157','2 09:40 10:50'],['A-162','2 09:40 10:50'],['A-157','1 16:05 17:15;3 11:05 12:15'],['A-157','4 15:15 16:40'],['A-154','2 11:05 12:15'],['A-157','5 12:30 13:40'],['A-157','2 09:40 10:50;4 09:40 10:50'],['A-153','2 14:40 15:50'],['A-161','3 11:05 12:15'],['A-157','5 09:40 10:50'],['A-162','4 09:40 10:50'],['A-157','5 08:15 09:25'],['A-075','2 09:40 10:50'],['A-157','4 09:40 10:50'],['A-063','1 09:40 12:15'],['A-056','2 11:05 12:15;4 09:40 10:50'],['A-170','3 11:05 12:15'],['A-157','2 11:05 12:15;4 11:05 12:15']
];
for(const p of data.professors.filter(p=>p.sourceId==='dmat-sj-2026-2'))test(`Excel original, fila ${p.sourceRow}: ${p.name}`,()=>{
  const e=expected[p.sourceRow-4];assert.ok(e);assert.equal(p.office,e[0]);
  for(const h of data.officeHours.filter(h=>h.professorId===p.id && h.sourceId===p.sourceId)){
    const slot=h.kind==='appointment'?'appointment':`${h.day} ${h.start} ${h.end}`;
    assert.ok(e[1].split(';').includes(slot),`${p.name}: ${slot}`);assert.equal(h.campusId,'san-joaquin');assert.equal(h.periodId,'2026-2');assert.equal(h.sourceRow,p.sourceRow);
  }
});
test('Transcripción inicial: 49 fichas y 59 registros, incluidos 3 por coordinación',()=>{
  assert.equal(expected.length,49);assert.equal(expected.flatMap(e=>e[1].split(';')).length,59);assert.equal(expected.filter(e=>e[1]==='appointment').length,3);
});
test('Observaciones de origen conservadas sin corregirlas por inferencia',()=>{
  const source=id=>data.professors.find(p=>p.id===id && p.sourceId==='dmat-sj-2026-2');
  if(source('erwin-hernandez'))assert.match(source('erwin-hernandez').locationNote,/4TO/i);
  if(source('nicolas-abarzua'))assert.match(source('nicolas-abarzua').note,/anterior/i);
  if(source('jose-rosales'))assert.equal(source('jose-rosales').email,'jose.rosales.s@usach.cl');
  if(source('gonzalo-contador'))assert.match(source('gonzalo-contador').note,/practicasj.icmat@usm.cl/);
});
