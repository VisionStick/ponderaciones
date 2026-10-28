import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, analyze } from '../src/engine.js';
import { buildCases, labProgress } from '../src/scenarios.js';
import { q, parseFactor } from '../src/rational.js';
import { blankState, validateState, readState } from '../src/state.js';
import { RULE_VERSION } from '../src/courses.js';
import { cfg, full, stateFor, setGroup } from './fixtures.mjs';
const eq=(actual,expected)=>assert.ok(actual?.eq(expected),`${actual} != ${expected}`);
const calc=cfg('calculus',{controlMode:'average'});
const phys=cfg('physics',{alpha:'1'});
const separated=cfg('physics',{alpha:'1',labMode:'details',labLayout:'separate',isCount:'2',inCount:'1',ciCount:'2'});

for(const id of ['calculus','algebra','calculus1']) test(`${id}: 54.5 aprueba y 54.499999 no se redondea hacia arriba`,()=>{
  const config=id==='calculus'?calc:cfg(id);
  const v=full(id,'54.5',config);
  if(id==='algebra') Object.assign(v,{l1:55,l2:55,attendance:55});
  eq(evaluate(id,config,v).final,'54.5');assert.ok(evaluate(id,config,v).pass);
  v.c1='54.499996'; assert.equal(evaluate(id,config,v).pass,false);
});
test('Programación: C55 y otros grupos54 dan P54.5; mínimo de C sigue55',()=>{
  const v=full('programming',54);v.c1=55;v.c2=55;eq(evaluate('programming',cfg('programming'),v).final,'54.5');assert.ok(evaluate('programming',cfg('programming'),v).pass);
  v.c1=54;v.c2=55;assert.equal(evaluate('programming',cfg('programming'),v).pass,false);
});
test('Física: PS49.5 permite Global62 exactamente',()=>{
  const v=full('physics','42.5',phys);setGroup(v,'c',3,50);v.nl=55;
  const a=analyze('physics',stateFor('physics',v,phys));eq(a.exact.semester,'49.5');eq(a.recoveryTarget.low,62);
  eq(evaluate('physics',phys,v,{recovery:q(62)}).final,'54.5');assert.equal(evaluate('physics',phys,v,{recovery:q('61.99')}).pass,false);
});
test('Física: PS54.5 aprueba directamente sin exigir55',()=>{
  const v=full('physics','67.5',phys);setGroup(v,'c',3,50);v.nl=55;const e=evaluate('physics',phys,v);eq(e.final,'54.5');assert.ok(e.direct);
});
test('Física: dos certámenes49.5/49.99 bloquean aunque todo lo demás sea100',()=>{
  const v=full('physics',100,phys);v.c1='49.5';v.c2='49.99'; const e=evaluate('physics',phys,v,{recovery:q(100)});assert.equal(e.reason,'two-certs');assert.equal(e.eligible,false);assert.equal(e.pass,false);
});
test('Física: bloqueo de dos certámenes funciona con el resto vacío y asistencia desconocida',()=>{
  const a=analyze('physics',stateFor('physics',{c1:40,c2:49.9}));assert.equal(a.status,'impossible');assert.equal(a.recoveryTarget,null);assert.equal(a.target,null);
});
test('Física: un solo certamen49.5 permite Global, pero G49.5 no aprueba',()=>{
  const v=full('physics',100,phys);v.c1='49.5';assert.ok(evaluate('physics',phys,v,{recovery:q(50)}).pass);assert.equal(evaluate('physics',phys,v,{recovery:q('49.5')}).pass,false);
});
test('Física: un 50 exacto no cuenta como segundo certamen bajo50',()=>{
  const v=full('physics',100,phys);v.c1=49;v.c2=50;assert.ok(evaluate('physics',phys,v,{recovery:q(50)}).pass);
});
test('Física: NL54.5 sigue incumpliendo el mínimo propio del laboratorio',()=>{
  const v=full('physics',100,phys);v.nl='54.5';const e=evaluate('physics',phys,v,{recovery:q(100)});assert.equal(e.reason,'lab');assert.equal(e.pass,false);
});
test('Laboratorio separado: IS40/80 IN100 CI60/20 da60, no65',()=>{
  const v=full('physics',70,separated);Object.assign(v,{is1:40,is2:80,in1:100,ci1:60,ci2:20});eq(evaluate('physics',separated,v).details.nl,60);
  const lab=labProgress(analyze('physics',stateFor('physics',v,separated)));eq(lab.final,60);assert.ok(lab.secure);
});
test('Laboratorio parcial: falta CI2, necesita40 para NL55',()=>{
  const v={is1:50,is2:50,in1:40,ci1:100};const a=analyze('physics',stateFor('physics',v,separated));const lab=labProgress(a);eq(lab.target,40);assert.equal(lab.pending.length,1);assert.equal(lab.final,null);
});
test('Laboratorio: un tipo IN vacío se permite si hay CI confirmados',()=>{
  const config={...separated,inCount:'0',ciCount:'1'};const v=full('physics',60,config);v.ci1=80;eq(evaluate('physics',config,v).details.nl,70);
});
test('Laboratorio: cantidades desconocidas bloquean metas y no presentan medias parciales como finales',()=>{
  const config={...separated,ciCount:'unknown'};const a=analyze('physics',stateFor('physics',full('physics',100,config),config));assert.equal(a.status,'conditional');assert.equal(a.range,null);assert.equal(a.target,null);assert.equal(a.recoveryTarget,null);assert.equal(labProgress(a).confirmed,false);
});
test('Laboratorio: IN y CI ambos0 es configuración incompleta, no división por cero',()=>{
  const config={...separated,inCount:'0',ciCount:'0'};const a=analyze('physics',stateFor('physics',{},config));assert.equal(a.modelIncomplete,true);assert.equal(labProgress(a).confirmed,false);
});
test('Casos MAT070: C50/60, C3=20/40/60/80/100 requiere PQ88/68/48/28/8',()=>{
  const s=stateFor('calculus',{c1:50,c2:60},calc);const original=JSON.stringify(s);const p=buildCases('calculus',s);assert.equal(p.first.id,'c3');assert.equal(p.second.id,'pq');assert.deepEqual(p.rows.map(r=>Number(r.required)),[88,68,48,28,8]);assert.equal(JSON.stringify(s),original);
  for(const row of p.rows)assert.equal((50+60+row.fixed+Number(row.required))/4,54.5);
});
test('Casos Física: con un certamen bajo50, sugerir otro bajo50 nunca aprueba ni conGlobal100',()=>{
  const v=full('physics',100,phys);v.c1=49;delete v.c2;const p=buildCases('physics',stateFor('physics',v,phys),false,{route:'recovery'});assert.equal(p.rows[0].possible,false);assert.equal(p.rows[1].possible,false);assert.equal(p.rows[2].possible,true);eq(p.rows[2].required,50);
});
test('Casos: resto60 es una hipótesis explícita y se puede cambiar',()=>{
  const s=stateFor('calculus',{c1:50},calc);const a=buildCases('calculus',s,false,{first:'c2',second:'c3',rest:'60'});const b=buildCases('calculus',s,false,{first:'c2',second:'c3',rest:'100'});assert.equal(a.rest[0].id,'pq');eq(a.rows[2].required,48);eq(b.rows[2].required,8);
});
test('Casos: rechaza hipótesis inválida para el resto',()=>{
  const p=buildCases('calculus',stateFor('calculus',{c1:50},calc),false,{rest:'200'});assert.equal(p.rows.length,0);assert.match(p.reason,/0 a 100/);
});
test('Casos: respeta mínimos de promedio de certámenes en Programación',()=>{
  const v=full('programming',100);v.c1=40;delete v.c2;delete v.q8;const p=buildCases('programming',stateFor('programming',v),false,{first:'q8',second:'c2'});for(const row of p.rows)eq(row.required,70);
});
test('Migración1→2 conserva notas reales, hipótesis y antiguo laboratorio combinado',()=>{
  const old=blankState();old.ruleVersion='2026-2.1';delete old.courses.calculus1;delete old.courses.physics.config.labLayout;delete old.courses.physics.config.inCount;delete old.courses.physics.config.ciCount;old.courses.physics.config.labMode='details';old.courses.physics.grades={inci1:{real:'0',sim:'80'},nl:{real:'62',sim:''}};
  const migrated=validateState(old);assert.equal(migrated.ruleVersion,RULE_VERSION);assert.deepEqual(migrated.courses.physics.grades,old.courses.physics.grades);assert.equal(migrated.courses.physics.config.labLayout,'combined');assert.ok(migrated.courses.calculus1);
  const loaded=readState({getItem:()=>JSON.stringify(old)});assert.match(loaded.warning,/conservaron/);
});
for(const raw of ['', '1', '0,95', '1.1', '101'])test(`Factor η válido ${raw}`,()=>assert.equal(parseFactor(raw).error,null));
for(const raw of ['0','-1','NaN','1e2',true])test(`Factor η inválido ${raw}`,()=>assert.ok(parseFactor(raw).error));
test('Respaldo permite factor mayor100 sin tratarlo como nota; no admite factor0',()=>{
  const s=blankState();s.courses.calculus1.grades.eta={real:'101',sim:'1'};assert.ok(validateState(s));s.courses.calculus1.grades.eta.real='0';assert.throws(()=>validateState(s),/nota inválida/);
});

for (const id of ['physics']) test(`${id}: los casos no inventan un Global0 cuando ya apruebas directamente`,()=>{
  const config=id==='physics'?phys:cfg(id);const v=full(id,60,config);delete v.c3;
  const s=stateFor(id,v,config);const p=buildCases(id,s,false,{route:'recovery'});
  const row=p.rows.find(r=>r.fixed===100);assert.equal(row.noRecoveryNeeded,true);assert.equal(row.hypotheses.g,undefined);
  for(const [k,value] of Object.entries(row.hypotheses))s.grades[k]={real:'',sim:value};
  assert.equal(analyze(id,s,true).status,'approved');
});

test('Recargar o importar conserva los ajustes simulados sin cambiar la configuración real',()=>{
  const s=blankState();s.courses.calculus.scenario=true;s.courses.calculus.scenarioConfig={controlMode:'average',controlCount:'unknown'};s.courses.calculus.grades={c1:{real:'42',sim:'50'},c2:{real:'',sim:'60'}};
  const out=validateState(JSON.parse(JSON.stringify(s)));assert.equal(out.courses.calculus.config.controlMode,'individual');assert.equal(out.courses.calculus.scenarioConfig.controlMode,'average');
  const sim={...out.courses.calculus,config:out.courses.calculus.scenarioConfig};eq(analyze('calculus',sim,true).target.high,54);assert.equal(out.courses.calculus.grades.c1.real,'42');
  s.courses.calculus.scenarioConfig.controlMode='inventado';assert.throws(()=>validateState(s));
});
