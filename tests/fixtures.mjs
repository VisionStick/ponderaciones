import { COURSES, modelFor } from '../src/courses.js';
import { blankCourse } from '../src/state.js';
export function cfg(id, overrides = {}) { return { ...COURSES[id].defaults, ...(id === 'physics' ? { labMode: 'official', labLayout: 'combined' } : {}), ...overrides }; }
export function full(id, value = 55, config = cfg(id)) { return Object.fromEntries(modelFor(id, config).flatMap(g => g.fields.map(f => [f.id, f.kind === 'factor' ? 1 : value]))); }
export function stateFor(id, values = {}, config = {}) { const s = blankCourse(id); Object.assign(s.config, cfg(id, config)); for (const [k, v] of Object.entries(values)) if (v !== null) s.grades[k] = { real: String(v), sim: '' }; return s; }
export function setGroup(values, prefix, n, value) { for (let i = 1; i <= n; i++) values[prefix + i] = value; return values; }
