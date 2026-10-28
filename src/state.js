import { COURSES, COURSE_IDS, RULE_VERSION, modelFor } from './courses.js';
import { parseGrade, parseFactor, parseLabFactor } from './rational.js';
export const STORAGE_KEY = 'rumbo-grades-v1';
export function blankCourse(id) { return { config: { ...COURSES[id].defaults }, grades: {}, scenario: false, scenarioConfig: null }; }
export function blankState() { return { schemaVersion: 1, ruleVersion: RULE_VERSION, activeCourse: 'calculus', courses: Object.fromEntries(COURSE_IDS.map(id => [id, blankCourse(id)])) }; }
const choices = { mat71LabMode: ['factor', 'confirmedDetails'], controlMode: ['individual', 'average'], controlCount: ['unknown', '6', '8'], protectedZero: ['none', 'c1', 'c2', 'c3'], labMode: ['official', 'details'], labLayout: ['separate', 'combined'], alpha: ['unknown', '1', '0.5'], justified: ['none', 'c1', 'c2', 'c3'], labRecoveries: ['0', '1', '2'], recoveryAccess: ['unknown', 'yes', 'no'] };
const countKeys = ['efCount', 'ecaCount', 'isCount', 'inciCount', 'inCount', 'ciCount'];
function readConfig(input, base) {
  const result = { ...base };
  for (const key of Object.keys(result)) {
    if (input?.[key] === undefined) continue;
    const value = String(input[key]);
    if (countKeys.includes(key) ? !(['inCount', 'ciCount'].includes(key) && value === 'unknown') && (!/^\d{1,2}$/.test(value) || Number(value) > 30) : !choices[key].includes(value)) throw new Error('El respaldo contiene una configuración inválida.');
    result[key] = value;
  }
  return result;
}
export function validateState(data, { allowInvalidDrafts = false } = {}) {
  if (!data || data.schemaVersion !== 1 || ![RULE_VERSION, '2026-2.1', '2026-2.2'].includes(data.ruleVersion) || !data.courses || typeof data.courses !== 'object') throw new Error('Este respaldo no corresponde a la versión actual de Rumbo. Tus datos actuales siguen intactos.');
  const state = blankState();
  if (COURSE_IDS.includes(data.activeCourse)) state.activeCourse = data.activeCourse;
  for (const id of COURSE_IDS) {
    const input = data.courses[id]; if (!input) continue;
    if (typeof input !== 'object' || Array.isArray(input)) throw new Error('Formato de asignatura inválido.');
    const c = state.courses[id];
    if (id === 'physics' && data.ruleVersion === '2026-2.1') c.config.labLayout = 'combined';
    c.config = readConfig(input.config, c.config);
    if (input.scenarioConfig != null) {
      if (typeof input.scenarioConfig !== 'object' || Array.isArray(input.scenarioConfig)) throw new Error('La configuración simulada es inválida.');
      c.scenarioConfig = readConfig(input.scenarioConfig, c.config);
    }
    const allowed = new Set([...modelFor(id, c.config).flatMap(g => g.fields.map(f => f.id)), 'g']);
    // Preserve inactive alternatives across switching counts/modes, while strictly whitelisting keys.
    for (const prefix of ['c', 'q', 'l', 't', 'ef', 'eca', 'is', 'inci', 'in', 'ci']) for (let n = 1; n <= 30; n++) allowed.add(prefix + n);
    for (const key of ['pq', 'nl', 'pt', 'eta', 'labFactor', 'attendance', 'aClass', 'aHelp', 'aLab', 'efMean', 'ecaMean', 'isMean', 'inciMean']) allowed.add(key);
    for (const [key, cell] of Object.entries(input.grades || {})) {
      if (!allowed.has(key) || !cell || typeof cell !== 'object' || Array.isArray(cell)) throw new Error('El respaldo contiene evaluaciones desconocidas.');
      const target = { real: '', sim: '' };
      for (const mode of ['real', 'sim']) {
        const raw = cell[mode] ?? '';
        if (!['string', 'number'].includes(typeof raw) || String(raw).length > 40 || (!allowInvalidDrafts && (key === 'eta' ? parseFactor(raw) : key === 'labFactor' ? parseLabFactor(raw) : parseGrade(raw)).error)) throw new Error('El respaldo contiene una nota inválida.');
        target[mode] = String(raw);
      }
      c.grades[key] = target;
    }
    c.scenario = input.scenario === true;
  }
  return state;
}
export function readState(storage) {
  try { const raw = storage.getItem(STORAGE_KEY); const data = raw ? JSON.parse(raw) : null; return { state: data ? validateState(data, { allowInvalidDrafts: true }) : blankState(), warning: data && data.ruleVersion !== RULE_VERSION ? 'Actualizamos MAT071 con el reglamento correcto. Tus notas se conservaron; el taller y el factor η anteriores ya no participan. Completa sus controles y el nuevo laboratorio.' : null }; }
  catch { return { state: blankState(), warning: 'No pudimos abrir el guardado anterior. No lo sobrescribimos automáticamente; puedes importar un respaldo.' }; }
}
