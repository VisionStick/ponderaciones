import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, evaluate, messageFor } from '../src/engine.js';
import { buildCases } from '../src/scenarios.js';
import { q, parseLabFactor } from '../src/rational.js';
import { blankState, readState, validateState } from '../src/state.js';
import { modelFor, RULE_VERSION } from '../src/courses.js';
import { cfg, full, stateFor, setGroup } from './fixtures.mjs';
const eq = (a,b) => assert.ok(a?.eq(b), `${a} != ${b}`);
const factorConfig = cfg('calculus1');
const detailsConfig = cfg('calculus1', {mat71LabMode:'confirmedDetails'});
const state = (v,c=factorConfig) => stateFor('calculus1',v,c);

test('MAT071 corregido: tres certámenes y tres controles; taller y η ya no se usan',()=>{
  const fields=modelFor('calculus1').flatMap(g=>g.fields);
  assert.deepEqual(fields.map(f=>f.id),['c1','c2','c3','q1','q2','q3','labFactor']);
  assert.deepEqual(fields.slice(0,3).map(f=>f.weight),[.25,.25,.25]);
  const v={c1:40,c2:50,c3:70,q1:50,q2:60,q3:70,labFactor:'1.1',eta:999,pt:100};
  const e=evaluate('calculus1',factorConfig,v);eq(e.details.base,55);eq(e.final,'60.5');
});
test('MAT071: el factor tiene tope y la nota final no supera100',()=>{
  const v={...full('calculus1',100),labFactor:'1.1'};eq(evaluate('calculus1',factorConfig,v).final,100);
  assert.equal(evaluate('calculus1',factorConfig,{...v,labFactor:'1.100001'}).pending,true);
});
for(const raw of ['','0.9','0,95','1','1.1'])test(`Factor L válido: ${raw}`,()=>assert.equal(parseLabFactor(raw).error,null));
for(const raw of ['0','0.899999','1.100001','101','-1','NaN'])test(`Factor L inválido: ${raw}`,()=>assert.ok(parseLabFactor(raw).error));
test('MAT071: factor vacío o solo η antiguo no produce resultado definitivo',()=>{
  const v=full('calculus1',100);delete v.labFactor;v.eta=1;
  const a=analyze('calculus1',state(v));assert.equal(a.status,'conditional');assert.equal(a.exact,null);assert.equal(a.target,null);assert.equal(a.range,null);
});
test('MAT071: una nota60 con L1 deja meta uniforme52.67',()=>{
  const a=analyze('calculus1',state({c1:60,labFactor:1}));eq(a.target.high,'52.67');assert.equal(a.weightKnown,.25);assert.equal(a.pointsKnown,15);
});
test('MAT071: mitad de notas y última nota pendiente',()=>{
  const v={...full('calculus1',60),c1:50};delete v.c3;
  const a=analyze('calculus1',state(v));eq(a.target.high,48);assert.equal(a.target.field,'Certamen 3');
  assert.equal(evaluate('calculus1',factorConfig,{...v,c3:'47.99'}).pass,false);eq(evaluate('calculus1',factorConfig,{...v,c3:48}).final,'54.5');
});
test('MAT071: Global88 da54.5 y87.99 no alcanza',()=>{
  const v={...full('calculus1',40),c1:20,c2:40,c3:50};const a=analyze('calculus1',state(v));eq(a.recoveryTarget.low,88);
  eq(evaluate('calculus1',factorConfig,v,{recovery:q(88)}).final,'54.5');assert.equal(evaluate('calculus1',factorConfig,v,{recovery:q('87.99')}).pass,false);
});
test('MAT071: no hay piso49.5 ni Global mínimo50',()=>{
  const low={...full('calculus1',40),c1:20,c2:40,c3:50};const a=analyze('calculus1',state(low));eq(a.exact.semester,'37.5');assert.equal(a.exact.eligible,true);
  const v={...full('calculus1',60),c1:50,c2:80,c3:80};eq(evaluate('calculus1',factorConfig,v,{recovery:q(0)}).final,55);
});
test('MAT071: Global voluntario puede bajar una aprobación; no es una entrada inválida',()=>{
  const a=analyze('calculus1',state({...full('calculus1',60),g:0}));assert.equal(a.errors.length,0);assert.equal(a.exact.eligible,true);assert.equal(a.status,'impossible');eq(a.exactBefore.final,60);eq(a.exact.final,45);
  assert.match(messageFor(analyze('calculus1',state(full('calculus1',60)))).body,/podría bajar/);
});
test('MAT071: empates de peor certamen no cambian ponderación ni exigen confirmación',()=>{
  const v={...full('calculus1',0),c1:50,c2:70,c3:50,g:98};const a=analyze('calculus1',state(v));assert.deepEqual(a.issues,[]);assert.equal(a.status,'approved');eq(a.exact.final,'54.5');eq(a.recoveryTarget.low,98);eq(a.recoveryTarget.high,98);
});
test('MAT071: Global fijo permite proyectar una nota pendiente con pesos iguales',()=>{
  const v={...full('calculus1',60),c2:50,g:0};delete v.c3;
  const a=analyze('calculus1',state(v));assert.equal(a.status,'progress');eq(a.target.high,98);eq(a.range.low,'42.5');eq(a.finalRange.high,55);
  const before=evaluate('calculus1',factorConfig,{...v,c3:'49.99'},{recovery:q(100)});
  const after=evaluate('calculus1',factorConfig,{...v,c3:'50.01'},{recovery:q(100)});
  assert.ok(after.final.gte(before.final));
});
test('MAT071: laboratorio bajo55 o dos certámenes bajo50 no son bloqueos inventados',()=>{
  const v={...full('calculus1',100),c1:0,c2:40,labFactor:1};assert.equal(evaluate('calculus1',factorConfig,v).pass,true);
  const c={...full('calculus1',60,detailsConfig),l1:0,l2:0,attendance:0};setGroup(c,'q',3,80);eq(evaluate('calculus1',detailsConfig,c).final,'58.5');
});
for(const [nl,factor] of [[0,'.9'],[55,'1'],[100,'1.1']])test(`MAT071: pauta confirmada NL${nl} daL${factor}`,()=>{
  const v={...full('calculus1',60,detailsConfig),l1:nl,l2:nl,attendance:nl};const e=evaluate('calculus1',detailsConfig,v);eq(e.details.nl,nl);eq(e.details.factor,factor);
});
test('MAT071: laboratorio pondera30% asistencia y35% cada control',()=>{
  const v={...full('calculus1',60,detailsConfig),attendance:80,l1:40,l2:60};const e=evaluate('calculus1',detailsConfig,v);eq(e.details.nl,59);eq(e.details.factor,q(79).div(90).add(q(59).div(450)));
});
test('MAT071: falta asistencia en pauta confirmada, muestra rango condicionado',()=>{
  const v=full('calculus1',60,detailsConfig);delete v.attendance;const a=analyze('calculus1',state(v,detailsConfig));assert.equal(a.status,'conditional');assert.equal(a.exact,null);assert.ok(a.range.high.gte(a.range.low));
});
test('MAT071: última nota de laboratorio se calcula y no se cuenta asistencia como pendiente académica',()=>{
  const v={...full('calculus1',55,detailsConfig),attendance:100,l1:0};delete v.l2;const a=analyze('calculus1',state(v,detailsConfig));eq(a.target.high,'57.15');assert.equal(a.pending[0].id,'l2');
});
test('MAT071: casos C3/Q3 verificables con sus distintos pesos efectivos',()=>{
  const v={c1:50,c2:60,q1:60,q2:60,labFactor:1};const s=state(v),before=JSON.stringify(s);const p=buildCases('calculus1',s,false,{first:'c3',second:'q3'});
  assert.deepEqual(p.rows.map(r=>r.possible?Number(r.required):null),[null,84,24,0,0]);assert.equal(JSON.stringify(s),before);
  for(const row of p.rows.filter(r=>r.possible)){const e=evaluate('calculus1',factorConfig,{...v,...row.hypotheses});assert.ok(e.pass);if(row.required.cmp(0)>0)assert.equal(evaluate('calculus1',factorConfig,{...v,...row.hypotheses,q3:row.required.sub('.01')}).pass,false);}
});
test('MAT071: casos de Global son voluntarios incluso si ya aprobarías sin él',()=>{
  const v=full('calculus1',60);delete v.c3;const p=buildCases('calculus1',state(v),false,{route:'recovery'});const row=p.rows.find(r=>r.fixed===100);eq(row.required,0);assert.equal(row.hypotheses.g,'0.00');
});
test('Migración2→3 conserva certámenes, Global, notas antiguas y otros ramos sin convertir taller en control',()=>{
  const old=blankState();old.ruleVersion='2026-2.2';old.courses.calculus1.config={};old.courses.calculus1.grades={c1:{real:'42',sim:'55'},pt:{real:'80',sim:''},eta:{real:'1.2',sim:'1'},g:{real:'',sim:'70'}};old.courses.physics.grades={c2:{real:'49.5',sim:''}};
  const out=validateState(old);assert.equal(out.ruleVersion,RULE_VERSION);assert.deepEqual(out.courses.calculus1.grades,old.courses.calculus1.grades);assert.equal(out.courses.calculus1.grades.q1,undefined);assert.equal(out.courses.calculus1.grades.labFactor,undefined);assert.equal(out.courses.calculus1.config.mat71LabMode,'factor');assert.deepEqual(out.courses.physics.grades,old.courses.physics.grades);
  assert.match(readState({getItem:()=>JSON.stringify(old)}).warning,/reglamento correcto/);
});
test('Respaldo nuevo conserva ambas modalidades y valida L por separado de η histórico',()=>{
  const s=blankState();s.courses.calculus1.config.mat71LabMode='confirmedDetails';s.courses.calculus1.scenarioConfig={mat71LabMode:'factor'};s.courses.calculus1.grades={labFactor:{real:'0.9',sim:'1.1'},eta:{real:'101',sim:''}};assert.deepEqual(validateState(s),s);s.courses.calculus1.grades.labFactor.sim='1.100001';assert.throws(()=>validateState(s),/nota inválida/);
});
test('La aplicación publicada no enlaza al repositorio GitHub',()=>{
  for(const file of ['../src/app.js','../index.html'])assert.doesNotMatch(readFileSync(new URL(file,import.meta.url),'utf8'),/github\.com\/VisionStick\/ponderaciones/);
});
