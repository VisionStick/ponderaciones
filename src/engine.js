import { q, mean, sum, min, max, parseGrade, parseFactor, minimumHundredth } from './rational.js';
import { COURSES, modelFor, PASS_MARK, PHYSICS_PRESENTATION } from './courses.js';

const groupValues = (groups, name, values) => (groups.find(g => g.id === name)?.fields || []).filter(f => f.kind === 'grade').map(f => values[f.id]);
const groupMean = (groups, name, values) => mean(groupValues(groups, name, values));
const best = (values, n) => mean([...values].sort((a, b) => b.cmp(a)).slice(0, n));
export function omega(nl) { return nl.lt(55) ? q('0.9').add(nl.div(550)) : q(79).div(90).add(nl.div(450)); }
export function physicsLab(simple, reportsAndControls) { return mean(simple).add(mean(reportsAndControls)).div(2); }
function labValue(config, groups, values) {
  if (config.labMode !== 'details') return values.nl;
  const simple = groupValues(groups, 'simple', values);
  const combined = config.labLayout === 'separate' ? [...groupValues(groups, 'reports', values), ...groupValues(groups, 'labControls', values)] : groupValues(groups, 'complete', values);
  return simple.length && combined.length ? physicsLab(simple, combined) : q(0);
}
function evaluateMat071(config, v, recovery, replacementId) {
  if (!v.eta || v.eta.eq(0)) return { pending: true, reason: 'factor', pass: false, direct: false, eligible: false, semester: null, final: null, details: {} };
  const weights = ['0.30', '0.30', '0.25'];
  const cs = [v.c1, v.c2, v.c3];
  const base = sum(cs.map((x, i) => x.mul(weights[i]))).add(v.pt.mul('0.15'));
  const original = base.mul(v.eta);
  let final = original, replaced = null, alternatives = [];
  const eligible = original.lt(PASS_MARK);
  if (recovery !== null && eligible) {
    const lowest = min(...cs);
    const candidates = cs.map((x, i) => x.eq(lowest) ? i : null).filter(i => i !== null);
    alternatives = candidates.map(i => ({ id: 'c' + (i + 1), final: base.add(q(recovery).sub(lowest).mul(weights[i])).mul(v.eta) }));
    const selected = alternatives.find(x => x.id === replacementId);
    final = selected ? selected.final : min(...alternatives.map(x => x.final));
    replaced = selected?.id || (alternatives.length === 1 ? alternatives[0].id : null);
  }
  return { semester: original, final, alternatives, pass: final.gte(PASS_MARK), direct: recovery === null && original.gte(PASS_MARK), eligible, replaced, ignoredRecovery: recovery !== null && !eligible, reason: final.gte(PASS_MARK) ? 'passed' : 'grade', details: { base, eta: v.eta, pt: v.pt }, requirements: [{ label: 'Nota final ≥ 54,5', value: final, met: final.gte(PASS_MARK) }] };
}

// Complete, exact evaluation. Caller explicitly supplies pending-grade scenarios.
export function evaluate(id, config, values, { recovery = null, alpha = 1, controlCount, replacementId } = {}) {
  const groups = modelFor(id, config, controlCount);
  const v = Object.fromEntries(Object.entries(values).map(([k, x]) => [k, x === null ? null : q(x)]));
  const cs = groupValues(groups, 'certs', v);
  if (id === 'calculus1') return evaluateMat071(config, v, recovery, replacementId);
  let replaced = null;
  if (id === 'physics' && config.justified && config.justified !== 'none') {
    if (recovery === null) return { pending: true, reason: 'justified', pass: false, direct: false, semester: null, final: null, eligible: false, details: {} };
    const index = Number(config.justified.slice(1)) - 1;
    cs[index] = q(recovery); replaced = config.justified;
  } else if (recovery !== null && id !== 'physics') {
    const lowest = min(...cs);
    const at = cs.findIndex(x => x.eq(lowest));
    if (id === 'algebra' && config.protectedZero !== 'none' && cs[Number(config.protectedZero?.slice(1)) - 1]?.eq(0)) {
      return { pending: true, reason: 'protected', pass: false, direct: false, semester: null, final: null, eligible: false, details: {} };
    }
    cs[at] = q(recovery); replaced = 'c' + (at + 1);
  }
  const nc = mean(cs);
  if (id === 'calculus' || id === 'algebra') {
    const nq = groupMean(groups, 'controls', v);
    let raw = sum(cs).add(nq).div(4), nl = null, w = q(1);
    if (id === 'algebra') {
      nl = v.attendance.mul('0.30').add(v.l1.mul('0.35')).add(v.l2.mul('0.35'));
      w = omega(nl); raw = min(raw.mul(w), 100);
    }
    return { semester: raw, final: raw, pass: raw.gte(PASS_MARK), direct: recovery === null && raw.gte(PASS_MARK), eligible: true, replaced, reason: raw.gte(PASS_MARK) ? 'passed' : 'grade', details: { nc, nq, nl, omega: w }, requirements: [{ label: 'Nota final ≥ 54,5', met: raw.gte(PASS_MARK), value: raw }] };
  }
  if (id === 'programming') {
    const ctl = groupMean(groups, 'controls', v), t = groupMean(groups, 'tasks', v), ef = groupMean(groups, 'ef', v), eca = groupMean(groups, 'eca', v);
    const p = nc.mul('0.5').add(ctl.mul('0.2')).add(t.mul('0.2')).add(ef.mul('0.05')).add(eca.mul('0.05'));
    const final = nc.gte(55) ? p : min(nc, 54);
    return { semester: p, final, pass: final.gte(PASS_MARK), direct: recovery === null && final.gte(PASS_MARK), eligible: config.recoveryAccess !== 'no', replaced, reason: nc.lt(55) ? 'certificates' : p.lt(PASS_MARK) ? 'grade' : 'passed', details: { nc, ctl, t, ef, eca }, requirements: [{ label: 'Promedio de certámenes ≥ 55', met: nc.gte(55), value: nc }, { label: 'Promedio ponderado ≥ 54,5', met: p.gte(PASS_MARK), value: p }] };
  }
  const pco = best(groupValues(groups, 'controls', v), 4), pta = best(groupValues(groups, 'tasks', v), 3);
  const nl = labValue(config, groups, v);
  const ps = nc.mul('0.6').add(pco.mul('0.08')).add(pta.mul('0.12')).add(nl.mul('0.2')).mul(alpha);
  const details = { nc, pco, pta, nl, alpha: q(alpha) };
  const requirements = [{ label: 'Laboratorio ≥ 55', met: nl.gte(55), value: nl }, { label: 'Cada certamen ≥ 50 (directa)', met: cs.every(x => x.gte(50)), value: min(...cs) }, { label: 'Promedio semestral ≥ 54,5 (directa)', met: ps.gte(PASS_MARK), value: ps }, { label: 'Como máximo un certamen bajo 50', met: cs.filter(x => x.lt(50)).length < 2, value: q(cs.filter(x => x.lt(50)).length) }];
  // The lab and PS gates precede Global, including after a justified replacement.
  if (nl.lt(55) || ps.lt(PHYSICS_PRESENTATION) || cs.filter(x => x.lt(50)).length >= 2) return { semester: ps, final: min(ps, 54), pass: false, direct: false, eligible: false, replaced, reason: cs.filter(x => x.lt(50)).length >= 2 ? 'two-certs' : nl.lt(55) ? 'lab' : 'presentation', details, requirements };
  if (ps.gte(PASS_MARK) && cs.every(x => x.gte(50))) return { semester: ps, final: ps, pass: true, direct: true, eligible: false, replaced, reason: 'passed', details, requirements };
  if (recovery === null) return { semester: ps, final: null, pass: false, direct: false, eligible: true, replaced, reason: 'global', details, requirements };
  const blended = ps.mul('0.6').add(q(recovery).mul('0.4'));
  const pass = q(recovery).gte(50) && blended.gte(PASS_MARK);
  requirements.push({ label: 'Global ≥ 50', met: q(recovery).gte(50), value: q(recovery) }, { label: '60% PS + 40% Global ≥ 54,5', met: blended.gte(PASS_MARK), value: blended });
  return { semester: ps, final: pass ? blended : min(ps, 54), pass, direct: false, eligible: true, replaced, reason: pass ? 'passed' : 'global-failed', details, requirements };
}

function context(id, state, scenario) {
  const config = { ...COURSES[id].defaults, ...state.config };
  const groups = modelFor(id, config), allFields = groups.flatMap(g => g.fields);
  const values = {}, errors = [], simulated = [];
  for (const field of [...allFields, { id: 'g', label: COURSES[id].recoveryName, kind: 'grade' }]) {
    if (id === 'physics' && config.justified === field.id) { values[field.id] = null; continue; }
    const cell = state.grades?.[field.id] || {};
    const sim = scenario && String(cell.sim ?? '').trim() !== '';
    const raw = sim ? cell.sim : cell.real;
    const p = field.kind === 'factor' ? parseFactor(raw) : parseGrade(raw);
    values[field.id] = p.value;
    if (p.error) errors.push({ id: field.id, label: field.label, error: p.error });
    if (sim) simulated.push(field.id);
  }
  const issues = [];
  let variants = [{}];
  if (id === 'calculus' && config.controlMode !== 'average' && !['6', '8'].includes(config.controlCount)) {
    issues.push('MAT070 menciona 6 y 8 controles. Confirma el total en AULA o usa el promedio final oficial.');
    variants = [{ controlCount: 6 }, { controlCount: 8 }];
  }
  if (id === 'algebra' && values.attendance === null) {
    issues.push('Falta la asistencia final de laboratorio. Los resultados varían con ese porcentaje.');
    variants = variants.flatMap(v => [{ ...v, attendance: q(0) }, { ...v, attendance: q(100) }]);
  }
  if (id === 'physics') {
    let alpha = ['1', '0.5'].includes(config.alpha) ? q(config.alpha) : null;
    if (!alpha && ['aClass', 'aHelp', 'aLab'].every(k => values[k]?.gte(80))) alpha = q(1);
    if (!alpha) {
      issues.push('Confirma el factor α efectivo con coordinación. Se muestran escenarios con α = 0,5 y α = 1; no se combinan factores de asistencia.');
      variants = variants.flatMap(v => [{ ...v, alpha: q('0.5') }, { ...v, alpha: q(1) }]);
    } else variants = variants.map(v => ({ ...v, alpha }));
    if (config.labRecoveries === '2') issues.push('El laboratorio permite recuperar una experiencia. Si necesitas más, la situación requiere resolución docente.');
  }
  if (id === 'algebra' && config.protectedZero !== 'none' && values[config.protectedZero]?.eq(0)) issues.push('Hay un cero no reemplazable por sanción. Confirma con coordinación el certamen habilitado antes de proyectar el Global.');
  if (id === 'physics' && config.labMode === 'details' && config.labLayout === 'separate') {
    if (config.isCount === '0' || config.inCount === 'unknown' || config.ciCount === 'unknown') issues.push('Indica cuántos informes simples, informes completos y controles de laboratorio habrá en total. Así las notas que faltan no desaparecen del promedio.');
    if (config.inCount === '0' && config.ciCount === '0') issues.push('El promedio de IN + CI necesita al menos una evaluación. Revisa las cantidades del laboratorio.');
  }
  if (id === 'calculus1') {
    if (values.eta === null) issues.push('Falta el factor de laboratorio η. El programa no explica su fórmula; ingresa el factor confirmado o simúlalo.');
    const certs = ['c1', 'c2', 'c3'].map(k => values[k]);
    if (certs.every(x => x !== null)) {
      const lowest = min(...certs); const candidates = certs.map((x,i) => x.eq(lowest) ? 'c' + (i+1) : null).filter(Boolean);
      variants = candidates.map(replacementId => ({ replacementId }));
      if (values.g !== null && candidates.includes('c3') && candidates.length > 1 && !values.g.eq(lowest)) issues.push('Hay empate en la peor nota con ponderaciones distintas. El resultado del Global depende de cuál certamen se reemplace; se muestran ambas posibilidades.');
    }
  }
  const gradeFields = allFields.filter(f => f.kind === 'grade' && !(id === 'physics' && config.justified === f.id));
  const modelIncomplete = id === 'physics' && config.labMode === 'details' && config.labLayout === 'separate' && (config.isCount === '0' || config.inCount === 'unknown' || config.ciCount === 'unknown' || (config.inCount === '0' && config.ciCount === '0'));
  return { config, groups, allFields, gradeFields, values, errors, simulated, issues, variants, modelIncomplete };
}

export function analyze(id, state, scenario = false) {
  const c = context(id, state, scenario);
  const { config, values, variants } = c;
  const known = c.gradeFields.filter(f => values[f.id] !== null), pending = c.gradeFields.filter(f => values[f.id] === null);
  const g = values.g, hasG = g !== null, justified = id === 'physics' && config.justified !== 'none';
  if (id === 'programming' && hasG && config.recoveryAccess === 'no') c.errors.push({ id: 'g', label: 'Recuperativo', error: 'Marcaste que no tienes acceso. Corrige esa condición o retira la nota de recuperativo.' });
  const certs = c.gradeFields.filter(f => f.id.match(/^c\d$/)).map(f => values[f.id]).filter(x => x !== null);
  const observed = certs.length ? mean(certs) : null;
  const canTryRecovery = id !== 'programming' || config.recoveryAccess !== 'no';
  const compute = (variant, fill, recovery) => {
    const needed = modelFor(id, config, variant.controlCount).flatMap(g => g.fields);
    const filled = {};
    for (const f of needed) filled[f.id] = values[f.id] ?? (f.id === 'attendance' && variant.attendance !== undefined ? variant.attendance : fill);
    return evaluate(id, config, filled, { recovery, ...variant });
  };
  const atCurrent = (variant, fill, absenceG) => compute(variant, fill, hasG ? g : justified ? absenceG : null);
  const lows = variants.map(v => atCurrent(v, q(0), q(0)));
  const highs = variants.map(v => atCurrent(v, q(100), q(100)));
  const regularComplete = pending.length === 0;
  const exact = regularComplete && c.issues.length === 0 && (!justified || hasG) ? atCurrent(variants[0], q(0), g) : null;
  const exactBefore = regularComplete && (c.issues.length === 0 || (id === 'calculus1' && values.eta !== null)) && !justified ? compute(variants[0], q(0), null) : null;
  const nonMonotone = id === 'calculus1' && hasG && pending.length > 0;
  const missingFactor = id === 'calculus1' && values.eta === null;
  if (nonMonotone) c.issues.push('Con un Global ya ingresado, completa o simula las notas pendientes de MAT071. El reemplazo puede cambiar de ponderación: una meta única sería engañosa.');
  if (id === 'calculus1' && hasG && exactBefore?.pass) c.errors.push({ id: 'g', label: 'Global recuperativo', error: 'Ya apruebas directamente. El programa reserva este Global a quienes no aprueban con su PS.' });
  const directPossible = !justified && variants.some(v => { const e = compute(v, q(100), hasG ? g : null); return hasG ? e.pass : e.direct; });
  const recoverPossible = !hasG && canTryRecovery && variants.some(v => compute(v, q(100), q(100)).pass);
  const possible = highs.some(x => x.pass) || directPossible || recoverPossible;
  const guaranteed = lows.every(x => x.pass) && c.issues.length === 0 && (!justified || hasG);
  let status = 'progress';
  if (c.errors.length) status = 'invalid';
  else if (!known.length && !hasG) status = 'empty';
  else if (id === 'physics' && certs.filter(x => x.lt(50)).length >= 2) status = 'impossible';
  else if (c.issues.length) status = 'conditional';
  else if (exact?.pass) status = 'approved';
  else if (guaranteed) status = 'secured';
  else if (!possible) status = 'impossible';
  else if (!directPossible && recoverPossible) status = 'recovery';

  // Uniform remaining-grade target: attendance is held to each explicit context variant.
  const uniform = pending.length && !justified && !nonMonotone && !missingFactor && !c.modelIncomplete ? variants.map(v => minimumHundredth(x => compute(v, x, hasG ? g : null).pass)) : [];
  const finiteTargets = uniform.filter(x => x !== null);
  const target = finiteTargets.length ? { low: min(...finiteTargets), high: max(...finiteTargets), partial: finiteTargets.length !== uniform.length, count: pending.length, field: pending.length === 1 ? pending[0].label : null } : null;
  // Never present an unconditional Global minimum while regular grades are still pending.
  const globalTargets = regularComplete && canTryRecovery && !missingFactor && !c.modelIncomplete && !(id === 'calculus1' && exactBefore?.pass) ? variants.map(v => minimumHundredth(x => compute(v, q(0), x).pass)) : [];
  const finiteGlobal = globalTargets.filter(x => x !== null);
  const recoveryTarget = finiteGlobal.length ? { low: min(...finiteGlobal), high: max(...finiteGlobal), partial: finiteGlobal.length !== globalTargets.length } : null;
  let weightKnown = null, pointsKnown = null;
  if (['calculus', 'algebra', 'programming', 'calculus1'].includes(id) && !(id === 'calculus' && c.issues.length)) {
    weightKnown = known.reduce((s, f) => s + (f.weight || 0), 0);
    pointsKnown = known.reduce((s, f) => s + Number(values[f.id]) * (f.weight || 0), 0);
  }
  if (id === 'physics' && !justified) {
    // Only count fixed contributions: a not-yet-dropped control is not assigned a permanent weight.
    weightKnown = certs.length * .2;
    pointsKnown = certs.reduce((s, x) => s + Number(x) * .2, 0);
    const lower = compute(variants[0], q(0), null).details;
    const upper = compute(variants[0], q(100), null).details;
    for (const [key, weight] of [['pco', .08], ['pta', .12], ['nl', .2]]) {
      if (!(key === 'nl' && c.modelIncomplete) && lower[key]?.eq(upper[key])) { weightKnown += weight; pointsKnown += Number(lower[key]) * weight; }
    }
  }
  const semesterBounds = [...lows, ...highs].map(x => x.semester).filter(x => x !== null);
  const finalBounds = [...lows, ...highs].map(x => x.final).filter(x => x !== null);
  const range = semesterBounds.length && !nonMonotone && !missingFactor && !c.modelIncomplete ? { low: min(...semesterBounds), high: max(...semesterBounds) } : null;
  const finalRange = finalBounds.length && !nonMonotone && !missingFactor && !c.modelIncomplete ? { low: min(...finalBounds), high: max(...finalBounds) } : null;
  const dropped = {};
  if (id === 'physics') for (const [name, take] of [['controls', 4], ['tasks', 3]]) {
    const fs = c.groups.find(g => g.id === name).fields;
    if (fs.every(f => values[f.id] !== null)) dropped[name] = [...fs].sort((a, b) => values[b.id].cmp(values[a.id])).slice(take).map(f => f.id);
  }
  return { ...c, id, scenario, knownCount: known.length, totalCount: c.gradeFields.length, pending, observed, hasG, justified, exact, exactBefore, status, possible, guaranteed, directPossible, recoverPossible, target, recoveryTarget, range, finalRange, weightKnown, pointsKnown, dropped, regularComplete, nonMonotone, missingFactor, recoveryConditional: id === 'programming' && config.recoveryAccess === 'unknown' && (!hasG || c.simulated.includes('g')) };
}

export function messageFor(a) {
  const name = COURSES[a.id].recoveryName;
  const isVoluntary = a.id === 'calculus' || a.id === 'algebra';
  const suffix = isVoluntary && !a.hasG ? ' Si rindes el Global voluntario, tu nota podría bajar.' : '';
  const texts = {
    empty: ['Tu próximo paso empieza aquí.', 'Ingresa las notas que ya tienes. Las demás pueden esperar; un espacio vacío nunca cuenta como cero.'],
    invalid: ['Revisemos ese dato.', 'Hay una nota que no se puede interpretar. Corrígela para obtener un resultado confiable.'],
    conditional: ['Falta confirmar un detalle.', 'Puedes seguir ingresando y simulando notas. El resultado queda condicionado a los datos indicados más abajo.'],
    approved: ['¡Estás pasando! Puedes respirar.', 'Con estas notas cumples los requisitos académicos de aprobación.' + suffix],
    secured: ['¡Lo lograste! Puedes bajar un cambio.', 'Incluso con la nota mínima en las evaluaciones pendientes, cumples los requisitos calculados.' + suffix],
    progress: [a.observed?.gte(PASS_MARK) ? 'Vas bien. Sigue a este ritmo.' : 'Paso a paso, todavía puedes.', 'Aún quedan evaluaciones. La meta destacada te muestra qué necesitas; el ramo todavía no está cerrado.'],
    recovery: [isVoluntary ? 'El Global te da otra oportunidad.' : `Tu próximo paso es el ${name}.`, a.id === 'physics' ? 'La aprobación directa no está disponible. Necesitas cumplir los requisitos de presentación y aprobar el Global.' : `La vía disponible pasa por el ${name}. Revisa el mínimo y las condiciones antes de rendirlo.`],
    impossible: ['Estas notas ya no alcanzan.', a.hasG ? 'Con esta nota de recuperación y lo registrado, ni el máximo en las pendientes permite aprobar.' : `Ni el máximo en lo que falta permite cumplir todas las reglas${a.id === 'programming' && a.config.recoveryAccess === 'no' ? ' sin acceso al recuperativo' : ', incluyendo la recuperación cuando corresponde'}. Revisa el detalle para entender qué requisito limita el resultado.`]
  };
  let [title, body] = texts[a.status];
  if (a.id === 'physics' && ['c1', 'c2', 'c3'].filter(k => a.values[k]?.lt(50) && a.config.justified !== k).length >= 2 && !a.errors.length) {
    title = 'Dos certámenes bajo 50 bloquean la aprobación.';
    body = 'Con esta restricción de Física, el Global no permite aprobar aunque el promedio sea alto. Revisa las notas oficiales si alguna está incorrecta.';
  }
  if (a.scenario && a.simulated.length) { title = a.status === 'approved' || a.status === 'secured' ? '¡Con este escenario apruebas!' : title; body = 'En esta simulación: ' + body.charAt(0).toLowerCase() + body.slice(1); }
  if (a.recoveryConditional && a.simulated.includes('g')) body += ' Este escenario supone que estás habilitado/a para rendir el recuperativo.';
  return { title, body };
}
