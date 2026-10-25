import test from 'node:test';
import assert from 'node:assert/strict';
import { q, parseGrade, minimumHundredth } from '../src/rational.js';
import { blankState, readState, validateState } from '../src/state.js';

test('Aritmética exacta: 0.1+0.2=0.3 y promedios sin falsos límites',()=>{assert.ok(q('.1').add('.2').eq('.3'));assert.ok(q(55).div(3).mul(3).eq(55));});
for (const raw of ['', ' ', null, undefined]) test(`Campo pendiente ${String(raw)}`,()=>assert.equal(parseGrade(raw).value,null));
for (const raw of ['0',0,'100','54,99','.5','55.000001']) test(`Nota válida ${raw}`,()=>assert.equal(parseGrade(raw).error,null));
for (const raw of ['-1','100.000001','101','55abc','NaN','Infinity','1e2','1,2,3',true,{},'1.1234567']) test(`Nota inválida ${String(raw)}`,()=>assert.ok(parseGrade(raw).error));
test('Mínimo a centésimas se eleva, sin redondear la nota final',()=>{assert.ok(minimumHundredth(x=>x.mul('.75').add(15).gte(55)).eq('53.34'));assert.equal(minimumHundredth(x=>x.gte(101)),null);});
test('Respaldo valida y conserva ceros, simulaciones y notas ocultas al cambiar modalidad',()=>{const s=blankState();s.courses.calculus.config.controlCount='6';s.courses.calculus.grades.q8={real:'0',sim:'75'};assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))),s);});
test('Respaldo incompatible no migra reglas silenciosamente',()=>{const s=blankState();s.ruleVersion='otro';assert.throws(()=>validateState(s),/versión/);});
test('Respaldo no acepta notas inválidas ni configuraciones arbitrarias',()=>{const s=blankState();s.courses.physics.grades.c1={real:'150'};assert.throws(()=>validateState(s),/nota inválida/);s.courses.physics.grades={};s.courses.physics.config.alpha='0.25';assert.throws(()=>validateState(s),/configuración/);});
test('Guardado roto o inaccesible no hace fallar la aplicación',()=>{const result=readState({getItem(){throw new Error('Blocked');}});assert.equal(result.state.activeCourse,'calculus');assert.ok(result.warning);});
test('Datos almacenados inválidos se recuperan como borrador y la UI puede corregirlos',()=>{const s=blankState();s.courses.calculus.grades.c1={real:'-1',sim:''};const r=readState({getItem:()=>JSON.stringify(s)});assert.equal(r.state.courses.calculus.grades.c1.real,'-1');});
