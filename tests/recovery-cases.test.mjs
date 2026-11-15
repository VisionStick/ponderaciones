import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCases, applyCaseToCourse, undoCaseForCourse } from '../src/scenarios.js';
import { analyze, evaluate } from '../src/engine.js';
import { modelFor } from '../src/courses.js';
import { q } from '../src/rational.js';
import { cfg, full, stateFor } from './fixtures.mjs';

const ids=['calculus','algebra','calculus1','physics','programming'];
const configFor=id=>cfg(id,id==='calculus'?{controlMode:'average'}:id==='physics'?{alpha:'1'}:id==='programming'?{recoveryAccess:'yes'}:{});
const effective=course=>({...course,config:course.scenario&&course.scenarioConfig?course.scenarioConfig:course.config});
const eq=(actual,expected)=>assert.ok(actual?.eq(expected),`${actual} != ${expected}`);

for(const id of ids)test(`${id}: un caso aprobado no solicita recuperación ni inventa un Global0`,()=>{
  const config=configFor(id),v=full(id,60,config),pending=id==='programming'?'c2':'c3';delete v[pending];
  const s=stateFor(id,v,config),before=JSON.stringify(s),p=buildCases(id,s,false,{route:'recovery',first:pending});
  const row=p.rows.find(r=>r.fixed===100);
  assert.equal(row.noRecoveryNeeded,true);assert.equal(row.required,null);assert.equal(row.hypotheses.g,undefined);
  const next=applyCaseToCourse(s,row).course,a=analyze(id,effective(next),true);
  assert.equal(a.hasG,false);assert.equal(a.status,'approved');eq(a.exact.final,row.final);assert.equal(JSON.stringify(s),before);
});

// Independent hand calculation: for the math courses factor=1, NF=(50+60+C3+60)/4.
// Programming: C1=50, other groups60; C2>=60 meets C>=55. Physics: PS=.2*(50+60+C3)+24.
for(const id of ids)test(`${id}: tabla mixta distingue recuperación de aprobación sin rendirla`,()=>{
  const config=configFor(id),v=full(id,60,config),pending=id==='programming'?'c2':'c3';
  v.c1=50;delete v[pending];if(id==='algebra')Object.assign(v,{attendance:55,l1:55,l2:55});
  const p=buildCases(id,stateFor(id,v,config),false,{route:'recovery',first:pending});
  const targets=id==='physics'?[61.25,55.25,null,null,null]:id==='programming'?[60,60,null,null,null]:[48,48,null,null,null];
  assert.deepEqual(p.rows.map(r=>r.required===null?null:Number(r.required)),targets);
  assert.deepEqual(p.rows.map(r=>!!r.noRecoveryNeeded),[false,false,true,true,true]);
});

test('Regresión de la captura: rango59.49–68.44; las cinco filas dicen que no hace falta Global',()=>{
  // Synthetic inputs reproducing the screenshot's numbers, not a student record.
  const s=stateFor('algebra',{c1:56,c2:60,c3:62,q1:63,q2:68,attendance:100,l1:83,l2:83});
  const a=analyze('algebra',s);assert.equal(a.status,'secured');
  assert.equal(Number(a.range.low).toFixed(2),'59.49');assert.equal(Number(a.range.high).toFixed(2),'68.44');
  const p=buildCases('algebra',s,false,{route:'recovery',first:'q3'});
  assert.equal(p.rows.length,5);
  for(const row of p.rows){assert.equal(row.noRecoveryNeeded,true);assert.equal(row.required,null);assert.equal(row.hypotheses.g,undefined);}
  const row=p.rows.find(r=>r.fixed===60);assert.equal(Number(row.final).toFixed(2),'64.86');
});

test('Caso descrito: C1=C2=70, PQ60 y C3=60 ya aprueban; no se pide Global18',()=>{
  const c=configFor('calculus'),s=stateFor('calculus',{c1:70,c2:70,pq:60},c);
  const row=buildCases('calculus',s,false,{route:'recovery'}).rows.find(r=>r.fixed===60);
  assert.equal(row.noRecoveryNeeded,true);eq(row.final,65);assert.equal(row.required,null);
});

for(const id of ['calculus','algebra','calculus1'])test(`${id}: si hace falta Global, sustituye el peor certamen, no necesariamente el pendiente`,()=>{
  const c=configFor(id),v=full(id,20,c);Object.assign(v,{c1:10,c2:60});delete v.c3;
  if(id==='algebra')Object.assign(v,{attendance:55,l1:55,l2:55});
  const p=buildCases(id,stateFor(id,v,c),false,{route:'recovery',first:'c3'});
  const row=p.rows.find(r=>r.fixed===60);eq(row.required,78);assert.equal(row.replaced,'c1');eq(row.final,'54.5');
  assert.equal(evaluate(id,c,{...v,c3:60},{recovery:'77.99'}).pass,false);
  assert.equal(row.hypotheses.c1,undefined);assert.equal(row.usesRecovery,true);
});

test('Programación: recuperativo58 reemplaza C1=20 cuando C2=80 y resto40',()=>{
  const c=configFor('programming'),v=full('programming',40,c);v.c1=20;delete v.c2;
  const row=buildCases('programming',stateFor('programming',v,c),false,{route:'recovery'}).rows.find(r=>r.fixed===80);
  eq(row.required,58);eq(row.final,'54.5');assert.equal(row.replaced,'c1');
  assert.equal(evaluate('programming',c,{...v,c2:80},{recovery:'57.99'}).pass,false);
});

test('Física: un Global necesario mantiene60/40 y G>=50, sin sustituir un certamen ordinario',()=>{
  const c=configFor('physics'),v=full('physics',60,c);Object.assign(v,{c1:40,c2:40,c3:70});delete v.nl;
  const p=buildCases('physics',stateFor('physics',v,c),false,{route:'recovery'});
  assert.equal(p.rows[0].possible,false);assert.equal(p.rows[1].possible,false);
  const row=p.rows.find(r=>r.fixed===60);eq(row.required,'55.25');eq(row.final,'54.5');assert.equal(row.replaced,null);
  assert.equal(p.rows.some(r=>r.noRecoveryNeeded),false);
});

test('Física: una ausencia justificada nunca se presenta como aprobación sin rendir Global',()=>{
  const c={...configFor('physics'),justified:'c3'},v=full('physics',60,c);delete v.c3;delete v.q5;
  const p=buildCases('physics',stateFor('physics',v,c),false,{route:'recovery'});
  for(const row of p.rows){assert.equal(!!row.noRecoveryNeeded,false);assert.equal(row.usesRecovery,true);eq(row.required,50);assert.equal(row.replaced,'c3');}
});

test('Programación sin acceso: aún muestra los casos que aprueban sin recuperativo',()=>{
  const c={...configFor('programming'),recoveryAccess:'no'},v=full('programming',60,c);v.c1=50;delete v.c2;
  const p=buildCases('programming',stateFor('programming',v,c),false,{route:'recovery'});
  assert.equal(p.rows.length,5);assert.equal(p.rows[0].possible,false);assert.match(p.rows[0].reason,/Sin acceso/);
  assert.equal(p.rows[2].noRecoveryNeeded,true);assert.equal(p.conditionalAccess,false);
});

test('Programación: las filas sin recuperativo no dependen de confirmar acceso',()=>{
  const c={...configFor('programming'),recoveryAccess:'unknown'},v=full('programming',80,c);delete v.q1;
  const p=buildCases('programming',stateFor('programming',v,c),false,{route:'recovery'});
  assert.ok(p.rows.every(r=>r.noRecoveryNeeded));assert.equal(p.conditionalAccess,false);
  v.c1=50;delete v.c2;v.q1=60;
  const mixed=buildCases('programming',stateFor('programming',v,c),false,{route:'recovery'});assert.equal(mixed.conditionalAccess,true);
});

test('Límite:54.5 no necesita Global;54.499999 todavía lo necesita',()=>{
  const c=configFor('calculus'),s=stateFor('calculus',{c1:60,c2:60,pq:78},c);
  const row=buildCases('calculus',s,false,{route:'recovery'}).rows[0];eq(row.final,'54.5');assert.equal(row.noRecoveryNeeded,true);
  s.grades.pq.real='77.999996';const below=buildCases('calculus',s,false,{route:'recovery'}).rows[0];assert.equal(!!below.noRecoveryNeeded,false);eq(below.required,'20.01');
});

test('Probar desde notas reales no reactiva un Global, notas o ajustes simulados antiguos; deshacer los recupera',()=>{
  const c=configFor('calculus'),s=stateFor('calculus',{c1:50,c2:60,pq:60},c);
  s.grades.c1.sim='0';s.grades.g={real:'',sim:'0'};s.scenarioConfig={...c,controlMode:'individual',controlCount:'6'};
  const row=buildCases('calculus',s,false,{route:'recovery'}).rows.find(r=>r.fixed===60);
  const change=applyCaseToCourse(s,row),a=analyze('calculus',effective(change.course),true);
  assert.equal(a.status,'approved');assert.equal(a.hasG,false);eq(a.exact.final,'57.5');assert.equal(change.course.scenarioConfig,null);assert.equal(s.grades.g.sim,'0');
  change.course.grades.c1.real='70';const back=undoCaseForCourse(change.course,change.previous);
  assert.equal(back.scenario,false);assert.deepEqual(back.scenarioConfig,s.scenarioConfig);assert.equal(back.grades.g.sim,'0');assert.equal(back.grades.c1.sim,'0');assert.equal(back.grades.c1.real,'70');
});

test('Probar dentro de una simulación conserva las hipótesis activas utilizadas en la fila',()=>{
  const s=stateFor('calculus',{c1:20,c2:60,pq:60},configFor('calculus'));s.scenario=true;s.grades.c1.sim='50';
  const row=buildCases('calculus',s,true,{route:'recovery'}).rows.find(r=>r.fixed===60);
  const change=applyCaseToCourse(s,row),a=analyze('calculus',effective(change.course),true);
  assert.equal(change.course.grades.c1.real,'20');assert.equal(change.course.grades.c1.sim,'50');eq(a.exact.final,'57.5');
});

test('Hipótesis adicionales conservan los seis decimales al aplicar un caso',()=>{
  const s=stateFor('calculus',{c1:50},configFor('calculus'));
  const row=buildCases('calculus',s,false,{route:'recovery',first:'c2',rest:'54,499999'}).rows.find(r=>r.fixed===60);
  assert.equal(row.hypotheses.c3,'54.499999');assert.equal(row.hypotheses.pq,'54.499999');
  const next=applyCaseToCourse(s,row).course;eq(analyze('calculus',effective(next),true).exact.final,row.final);
});

test('Una nota de Global0 ya registrada no se borra ni se presenta como examen pendiente',()=>{
  const c=configFor('calculus'),s=stateFor('calculus',{c1:80,c2:80,c3:80,g:0},c),before=JSON.stringify(s);
  const p=buildCases('calculus',s,false,{route:'recovery'});assert.equal(p.rows.length,0);assert.match(p.reason,/Ya hay una nota/);assert.equal(JSON.stringify(s),before);
});

test('Toda fila ofrecida conserva su resultado al aplicarla: todos los campos y cinco ramos',()=>{
  let checked=0;
  for(const id of ids){const c=configFor(id);for(const field of modelFor(id,c).flatMap(g=>g.fields).filter(f=>f.kind==='grade'))for(const score of [20,54.5,60,100]){
    const v=full(id,score,c);delete v[field.id];const s=stateFor(id,v,c),p=buildCases(id,s,false,{route:'recovery',first:field.id});
    for(const row of p.rows.filter(r=>r.possible)){
      const next=applyCaseToCourse(s,row).course,a=analyze(id,effective(next),true);
      assert.equal(a.exact?.pass,true,`${id}/${field.id}/${score}/${row.fixed}`);eq(a.exact.final,row.final);
      if(row.noRecoveryNeeded){assert.equal(a.hasG,false);assert.equal(row.required,null);}else{assert.equal(a.hasG,true);assert.ok(row.required.gte(0));}
      checked++;
    }
  }}assert.ok(checked>500,`Se comprobaron ${checked} filas`);
});
