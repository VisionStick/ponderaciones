import { analyze, evaluate } from './engine.js';
import { COURSES } from './courses.js';
import { q, parseGrade, min, max, minimumHundredth, mean } from './rational.js';

// Real grades are never changed here. Every row states its assumptions explicitly.
export function buildCases(id, state, scenario = false, options = {}) {
  const a = analyze(id, state, scenario);
  const route = options.route || (a.status === 'recovery' || a.justified ? 'recovery' : 'direct');
  const fields = a.pending;
  if (!fields.length && !a.errors.length && !a.issues.length) return { rows: [], fields, route, reason: 'Ya tienes todas las notas de este escenario. Puedes cambiar una hipótesis en ¿Y si saco…? o deshacer el último caso.' };
  if (a.errors.length || a.issues.length || !fields.length || a.status === 'impossible') return { rows: [], fields, route, reason: a.status === 'impossible' ? 'Las restricciones actuales impiden aprobar. Revisa el motivo de arriba.' : 'Completa o confirma los datos indicados para comparar casos sin inventar condiciones.' };
  if (route === 'direct' && a.justified) return { rows: [], fields, route, reason: 'Tu ausencia justificada requiere rendir Global.' };
  const first = fields.find(f => f.id === options.first) || fields[0];
  const second = route === 'recovery' ? { id: 'g', label: COURSES[id].recoveryName } : fields.find(f => f.id === options.second && f.id !== first.id) || fields.find(f => f.id !== first.id);
  if (!second) return { rows: [], fields, route, first, reason: 'Queda una sola evaluación: arriba tienes su mínimo. También puedes explorar la vía de recuperación.' };
  if (route === 'recovery' && a.hasG) return { rows: [], fields, route, first, second, reason: `Ya hay una nota de ${COURSES[id].recoveryName} en este escenario. Elige otra evaluación para calcular lo que falta conservando esa nota. Para comparar casos antes de rendirlo, su casilla debe estar vacía; nunca se elimina una nota real automáticamente.` };
  const rest = fields.filter(f => ![first.id, second.id].includes(f.id));
  const parsed = parseGrade(options.rest ?? '60');
  if (parsed.error || (rest.length && parsed.value === null)) return { rows: [], fields, first, second, rest, route, reason: 'Escribe una hipótesis de 0 a 100 para las otras notas pendientes.' };
  const restValue = parsed.value || q(60);
  const rows = [20, 40, 60, 80, 100].map(fixed => {
    const assumptions = Object.fromEntries(rest.map(f => [f.id, restValue]));
    assumptions[first.id] = q(fixed);
    // A voluntary exam can replace a passing certamen with a lower grade.
    // Its conditional minimum is NOT a required exam when the row already passes.
    const withoutRecovery = route === 'recovery' && !a.justified
      ? a.variants.map(variant => evaluate(id, a.config, { ...a.values, ...assumptions }, { ...variant, recovery: null })) : [];
    if (withoutRecovery.length && withoutRecovery.every(e => e.pass)) {
      return { fixed, required: null, possible: true, noRecoveryNeeded: true, direct: true, final: withoutRecovery[0].final,
        hypotheses: Object.fromEntries(Object.entries(assumptions).map(([k,v]) => [k, Number(v).toFixed(6).replace(/\.?0+$/, '')])) };
    }
    if (route === 'recovery' && id === 'programming' && a.config.recoveryAccess === 'no') return { fixed, required: null, possible: false, hypotheses: null, reason: 'Sin acceso al recuperativo' };
    const solve = (candidate, variant) => {
      const values = { ...a.values, ...assumptions, [second.id]: candidate };
      return evaluate(id, a.config, values, { ...variant, recovery: route === 'recovery' ? candidate : a.hasG ? a.values.g : null });
    };
    const targets = a.variants.map(v => minimumHundredth(x => solve(x, v).pass));
    const valid = targets.filter(x => x !== null);
    const required = valid.length === targets.length ? max(...valid) : null;
    const outcome = required === null ? null : solve(required, a.variants[0]);
    const hypotheses = required === null ? null : Object.fromEntries(Object.entries({ ...assumptions, [second.id]: required }).map(([k,v]) => [k, Number(v).toFixed(6).replace(/\.?0+$/, '')]));
    return { fixed, required, possible: required !== null, final: outcome?.final ?? null, direct: outcome?.direct ?? false, usesRecovery: route === 'recovery' && required !== null, replaced: outcome?.replaced ?? null, hypotheses };
  });
  return { rows, fields, first, second, rest, restValue, route, conditionalAccess: rows.some(row => row.usesRecovery) && a.recoveryConditional };
}

// Apply exactly the context used to calculate the row. Inactive hypotheses and
// example settings must not reappear when switching from real notes to simulation.
export function applyCaseToCourse(course, row) {
  if (!row?.possible || !row.hypotheses) return null;
  const next = structuredClone(course);
  const previous = { scenario: course.scenario, scenarioConfig: structuredClone(course.scenarioConfig ?? null), sims: Object.fromEntries(Object.entries(course.grades).map(([k,v]) => [k,v.sim || ''])) };
  if (!course.scenario) {
    next.scenarioConfig = null;
    for (const cell of Object.values(next.grades)) cell.sim = '';
  }
  next.scenario = true;
  for (const [key,value] of Object.entries(row.hypotheses)) {
    next.grades[key] ||= { real: '', sim: '' };
    next.grades[key].sim = value;
  }
  return { course: next, previous };
}
export function undoCaseForCourse(course, previous) {
  const next = structuredClone(course);
  next.scenario = previous.scenario;
  next.scenarioConfig = structuredClone(previous.scenarioConfig);
  // Keep any real grades entered since the case was applied.
  for (const [key,cell] of Object.entries(next.grades)) cell.sim = previous.sims[key] || '';
  return next;
}

export function labProgress(a) {
  if (a.id !== 'physics') return null;
  const groups = a.config.labMode === 'official' ? ['lab'] : a.config.labLayout === 'separate' ? ['simple', 'reports', 'labControls'] : ['simple', 'complete'];
  const fs = a.groups.filter(g => groups.includes(g.id)).flatMap(g => g.fields);
  const pending = fs.filter(f => a.values[f.id] === null);
  if (a.modelIncomplete || !fs.length) return { confirmed: false, pending, fields: fs };
  const calc = fill => {
    const vals = name => a.groups.find(g => g.id === name)?.fields.map(f => a.values[f.id] ?? fill) || [];
    if (a.config.labMode === 'official') return a.values.nl ?? fill;
    const combined = a.config.labLayout === 'separate' ? [...vals('reports'), ...vals('labControls')] : vals('complete');
    return mean(vals('simple')).add(mean(combined)).div(2);
  };
  const low = calc(q(0)), high = calc(q(100));
  return { confirmed: true, low, high, final: pending.length ? null : low, pending, fields: fs, target: pending.length ? minimumHundredth(x => calc(x).gte(55)) : null, impossible: high.lt(55), secure: low.gte(55) };
}
