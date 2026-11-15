import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate,analyze } from '../src/engine.js';
import { cfg,full,stateFor,setGroup } from './fixtures.mjs';
import { blankState,validateState,readState } from '../src/state.js';
const config=cfg('physics',{alpha:'1'});
// Independent integer oracle: 1 unit = 0.0001 grade point. No engine helpers.
function reference(c,nl,control,task,alpha,g){
  const cents=x=>Math.round(x*100),cs=c.map(cents);
  const ps=alpha*(20*cs.reduce((a,b)=>a+b,0)+8*cents(control)+12*cents(task)+20*cents(nl));
  if(cents(nl)<5500||ps<495000)return {pass:false,direct:false,eligible:false,final:Math.min(ps,540000),ps};
  if(ps>=545000&&cs.every(x=>x>=5000))return {pass:true,direct:true,eligible:false,final:ps,ps};
  if(g===null)return {pass:false,direct:false,eligible:true,final:null,ps};
  const blend=(ps*6+cents(g)*400)/10,pass=cents(g)>=5000&&blend>=545000;
  return {pass,direct:false,eligible:true,final:pass?blend:Math.min(ps,540000),ps};
}
test('FIS111: 18.432 escenarios contrastados con un oráculo independiente',()=>{
  let count=0;
  for(const c1 of [0,49,50,100])for(const c2 of [0,49,50,100])for(const c3 of [0,49,50,100])for(const nl of [0,54.99,55,100])for(const control of [0,42.5,100])for(const task of [0,100])for(const alpha of [.5,1])for(const g of [null,0,49.99,50,62,100]){
    const v=full('physics',0,config);Object.assign(v,{c1,c2,c3,nl});setGroup(v,'q',5,control);setGroup(v,'t',5,task);
    const expected=reference([c1,c2,c3],nl,control,task,alpha,g),actual=evaluate('physics',config,v,{alpha,recovery:g});
    assert.equal(actual.pass,expected.pass);assert.equal(actual.direct,expected.direct);assert.equal(actual.eligible,expected.eligible);
    assert.ok(Math.abs(Number(actual.semester)*10000-expected.ps)<1e-6);
    if(expected.final===null)assert.equal(actual.final,null);else assert.ok(Math.abs(Number(actual.final)*10000-expected.final)<1e-6);count++;
  }
  assert.equal(count,18432);
});
test('FIS111: 648 escenarios con ausencia justificada conservan las ramas originales',()=>{
  let count=0;
  for(const justified of ['c1','c2','c3'])for(const c1 of [30,50,100])for(const c2 of [30,50,100])for(const c3 of [30,50,100])for(const alpha of [.5,1])for(const g of [49,50,70,100]){
    const values=full('physics',60,config);Object.assign(values,{c1,c2,c3});const cs=[c1,c2,c3];cs[Number(justified[1])-1]=g;
    const e=reference(cs,60,60,60,alpha,g),a=evaluate('physics',{...config,justified},values,{alpha,recovery:g});
    assert.equal(a.pass,e.pass);assert.equal(a.direct,e.direct);assert.equal(a.eligible,e.eligible);assert.ok(Math.abs(Number(a.final)*10000-e.final)<1e-6);count++;
  }assert.equal(count,648);
});
test('Dos certámenes bajos, PS49.5 y G62 aprueban justo; 61.99 no',()=>{
  const v=full('physics',42.5,config);Object.assign(v,{c1:40,c2:40,c3:70,nl:55});
  const a=analyze('physics',stateFor('physics',v,config));assert.equal(a.status,'recovery');assert.equal(Number(a.recoveryTarget.high),62);assert.equal(Number(a.exact.semester),49.5);
  assert.equal(evaluate('physics',config,v,{recovery:62}).pass,true);assert.equal(evaluate('physics',config,v,{recovery:61.99}).pass,false);
});
test('Tres certámenes bajo50 pueden aprobar mediante Global; no directamente',()=>{
  const v=full('physics',100,config);setGroup(v,'c',3,49);const a=evaluate('physics',config,v,{recovery:50});assert.equal(Number(a.semester),69.4);assert.equal(Number(a.final),61.64);assert.equal(a.pass,true);assert.equal(a.direct,false);
});
test('La presentación49.49 y laboratorio54.99 siguen bloqueando aunque G100',()=>{
  const v=full('physics',42.5,config);Object.assign(v,{c1:40,c2:40,c3:69.95,nl:55});assert.equal(evaluate('physics',config,v,{recovery:100}).reason,'presentation');
  Object.assign(v,full('physics',100,config),{c1:49,c2:49,nl:54.99});assert.equal(evaluate('physics',config,v,{recovery:100}).reason,'lab');
});
test('Cambiar Física no pierde las notas reales ni simuladas de versiones anteriores',()=>{
  const old=blankState();old.ruleVersion='2026-2.3';for(const c of Object.values(old.courses)){c.grades.c1={real:'40',sim:'70'};c.scenario=true;}
  const next=validateState(old);for(const id of Object.keys(old.courses))assert.deepEqual(next.courses[id],old.courses[id]);assert.match(readState({getItem:()=>JSON.stringify(old)}).warning,/varios certámenes/);
});
