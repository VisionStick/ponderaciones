import { COURSES, COURSE_IDS, RULE_VERSION, modelFor } from './courses.js';
import { analyze, messageFor } from './engine.js';
import { parseGrade, parseFactor, mean } from './rational.js';
import { buildCases, labProgress } from './scenarios.js';
import { STORAGE_KEY, blankCourse, readState, validateState } from './state.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const paths = {
  curve: '<path d="M3 18h18M5 20V4M6 15c4 0 4-10 8-10s3 8 7 8"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 12h16M12 4v16"/>',
  orbit: '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(35 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="1"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16"/>',
  check: '<path d="m5 12 4 4L19 6"/>', leaf: '<path d="M5 19C-1 3 14 5 20 3c2 13-6 19-15 16Zm0 0L17 7"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>', upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4"/>',
  book: '<path d="M3 5c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2Zm9 2v14"/>',
  chart: '<path d="M4 4v16h17M8 15v-4m5 4V7m5 8V4"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', reset: '<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
  pencil: '<path d="m4 16-1 5 5-1L20 8l-4-4ZM13 7l4 4"/>', flask: '<path d="M9 3h6m-5 0v7L4 20h16l-6-10V3M8 14h8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>', lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  dot: '<circle cx="12" cy="12" r="7"/>', minus: '<path d="M5 12h14"/>', chevron: '<path d="m9 5 7 7-7 7"/>', heart: '<path d="M12 20 3.5 12a5 5 0 0 1 7-7L12 7l1.5-2a5 5 0 0 1 7 7Z"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.dot}</svg>`;
const fmt = (x, digits = 2) => {
  if (x === null || x === undefined) return '—';
  const n = Number(x), rounded = Math.round(n * 10 ** digits) / 10 ** digits;
  for (const limit of [54.5, 49.5, 55, 50]) if (n < limit && rounded >= limit) return '<' + String(limit).replace('.', ',');
  return n.toLocaleString('es-CL', { maximumFractionDigits: digits });
};
const rangeText = r => !r ? '—' : r.low.eq(r.high) ? fmt(r.low) : `${fmt(r.low)}–${fmt(r.high)}`;
let storage;
try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error(); } }; }
const loaded = readState(storage);
let state = loaded.state, saveUnavailable = false, toastTimer, pendingImport = null;
const caseOptions = {}, previousScenarios = {};
let currentCases = null;
const active = () => state.courses[state.activeCourse];
const effective = () => ({ ...active(), config: active().scenario && active().scenarioConfig ? active().scenarioConfig : active().config });
const analysis = () => analyze(state.activeCourse, effective(), active().scenario);
function toast(text) { const el = document.querySelector('#toast'); el.textContent = text; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 5000); }
function save() { try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); saveUnavailable = false; } catch { if (!saveUnavailable) toast('El navegador no permite guardar. Puedes exportar tus notas para conservarlas.'); saveUnavailable = true; } const el = document.querySelector('#save-status'); if (el) el.textContent = saveUnavailable ? 'Guardado no disponible' : 'Guardado en este navegador'; }

function shell() {
  const c = COURSES[state.activeCourse];
  document.querySelector('#app').innerHTML = `<div class="layout">
    <aside class="sidebar" aria-label="Asignaturas"><a class="brand" href="#" data-action="home" aria-label="Rumbo, inicio"><img src="./favicon.svg" alt="" width="40" height="40"><div><div class="brand-name">rumbo<span style="color:#9caf86">.</span></div><div class="brand-tag">Tus notas, tu próximo paso.</div></div></a>
      <div class="semester-pill"><span>Mi semestre</span><strong>2026 · 2° ${icon('chevron')}</strong></div>
      <nav><p class="nav-heading">MIS ASIGNATURAS</p><div class="course-nav">${COURSE_IDS.map(id => `<button class="course-button ${id === c.id ? 'active' : ''}" data-course="${id}" ${id === c.id ? 'aria-current="page"' : ''}><span class="course-icon ${COURSES[id].color}">${icon(COURSES[id].icon)}</span><span><span class="course-name">${COURSES[id].short}</span><span class="course-code">${COURSES[id].code}</span></span><span class="nav-dot ${Object.values(state.courses[id].grades).some(g => String(g.real || '').trim()) ? 'has-notes' : ''}" id="nav-dot-${id}"></span></button>`).join('')}</div></nav>
      <div class="sidebar-bottom"><div class="sidebar-note">${icon('leaf')}<strong>Un paso a la vez.</strong>No necesitas tener todas las notas para saber por dónde seguir.</div><button class="nav-footer-button" data-action="help">${icon('help')} ¿Cómo funciona?</button><a class="nav-footer-button" href="https://github.com/VisionStick/ponderaciones" target="_blank" rel="noopener noreferrer">${icon('code')} Código y mejoras</a><p class="sidebar-credit">Hecho para entender tu semestre.</p></div>
    </aside>
    <main class="workspace" id="main"><header class="topbar"><div class="breadcrumb">Mi semestre ${icon('chevron')} <strong>${c.short}</strong></div><div class="toolbar"><span class="save-status" id="save-status">${saveUnavailable ? 'Guardado no disponible' : 'Guardado en este navegador'}</span><button class="icon-button" data-action="export" aria-label="Exportar mis notas" title="Exportar mis notas">${icon('download')}</button><button class="icon-button" data-action="import" aria-label="Importar mis notas" title="Importar mis notas">${icon('upload')}</button><button class="icon-button" data-action="help" aria-label="Cómo funciona" title="Cómo funciona">${icon('help')}</button></div></header>
      <section class="hero hero-compact"><div><div class="eyebrow">TU SEMESTRE, UN POCO MÁS CLARO</div><h1>¿Qué te falta <em>para pasar?</em></h1><p>Agrega las notas que tienes. Exploremos juntos las que vienen.</p></div><button class="example-button" data-action="example">${icon('spark')} Ver un ejemplo</button></section>
      <div class="course-heading"><div class="course-heading-left"><span class="course-icon ${c.color}">${icon(c.icon)}</span><div><h2>${c.name}</h2><p>${c.groups}</p></div></div><button class="outline-button" data-action="rules">${icon('book')} Ver reglamento</button></div>
      <div id="summary"></div><section class="card cases-card" id="cases"></section>
      <div class="content-grid"><div><section class="card"><div class="card-header"><div><h3>Tus notas, a tu ritmo</h3><p>Completa las que conoces. Deja el resto en blanco.</p></div>${icon('pencil')}</div><div class="tabs" aria-label="Modo de cálculo"><button data-mode-tab="real" aria-pressed="${!active().scenario}">${icon('pencil')} Mis notas</button><button class="sim-active" data-mode-tab="sim" aria-pressed="${active().scenario}">${icon('flask')} ¿Y si saco…?</button></div><div class="form-body" id="form"></div></section><details class="card details-card" id="calculation-details"><summary>${icon('chart')} Ver cómo se calculó</summary><div class="details-body" id="calculation"></div></details></div><aside class="right-column" id="results" aria-label="Resultados y próximos pasos"></aside></div>
      <footer class="page-footer"><span>Rumbo · Tus notas se quedan en este navegador. ${icon('lock')}</span><span>Reglas 2026-2 · <a href="https://github.com/VisionStick/ponderaciones" target="_blank" rel="noopener noreferrer">Un proyecto que sigue creciendo ↗</a></span></footer>
    </main></div>`;
  renderForm(); updateResults();
}
const select = (key, label, options) => `<div class="setting-row"><label for="config-${key}">${label}</label><select id="config-${key}" data-config="${key}">${options.map(([v, label]) => `<option value="${v}" ${String(effective().config[key]) === v ? 'selected' : ''}>${label}</option>`).join('')}</select></div>`;
const labCountOptions = (simple = false) => [[simple ? '0' : 'unknown', 'Por confirmar'], ...(!simple ? [['0', 'No hay evaluaciones de este tipo']] : []), ...Array.from({ length: 30 }, (_, i) => [String(i + 1), `${i + 1} en todo el semestre`])];
const numberOptions = () => [['0', 'Promedio final oficial'], ...Array.from({ length: 30 }, (_, i) => [String(i + 1), `${i + 1} evaluaciones en total`])];
function settingsHTML() {
  const id = state.activeCourse, config = effective().config;
  let html = '';
  if (id === 'calculus') html = select('controlMode', '¿Cómo ingresarás los controles?', [['individual', 'Una nota por control'], ['average', 'Promedio final oficial']]) + (config.controlMode === 'individual' ? select('controlCount', 'Total de controles de tu paralelo', [['unknown', 'Todavía no confirmado'], ['6', '6 · confirmado en AULA'], ['8', '8 · confirmado en AULA']]) : '') + '<p class="setting-note">El calendario indica 6 controles; la fórmula menciona 8. Confirma el total o usa el promedio final oficial. Tus notas quedan guardadas al cambiar de modo.</p>';
  if (id === 'algebra') html = select('protectedZero', 'Cero por sanción que no se puede reemplazar', [['none', 'No aplica'], ['c1', 'Certamen 1'], ['c2', 'Certamen 2'], ['c3', 'Certamen 3']]) + '<p class="setting-note">El Global es voluntario, requiere inscripción y reemplaza el peor certamen aunque baje tu nota.</p>';
  if (id === 'physics') html = select('alpha', 'Factor de asistencia confirmado', [['unknown', 'Por confirmar'], ['1', 'Cumplo asistencia · α = 1'], ['0.5', 'Factor confirmado · α = 0,5']]) + '<p class="setting-note">También puedes ingresar tus tres asistencias abajo. Los documentos no explican cómo combinar factores si no cumples todas.</p>' + select('justified', 'Certamen ausente con justificación aceptada', [['none', 'Ninguno'], ['c1', 'Certamen 1'], ['c2', 'Certamen 2'], ['c3', 'Certamen 3']]) + select('labRecoveries', 'Experiencias de laboratorio por recuperar', [['0', 'Ninguna'], ['1', 'Una, justificada'], ['2', 'Más de una']]);
  if (id === 'programming') html = select('efCount', 'Evaluaciones formativas (EF)', numberOptions()) + select('ecaCount', 'Ejercicios autocorregidos (ECA)', numberOptions()) + select('recoveryAccess', 'Acceso al recuperativo', [['unknown', 'Por confirmar con docente'], ['yes', 'Sí, confirmado'], ['no', 'No estoy habilitado/a']]) + '<p class="setting-note">La presentación no fija el total de notas EF/ECA ni los pesos internos de cada tarea. Usa las cantidades confirmadas o los promedios finales oficiales.</p>';
  if (id === 'calculus1') return '';
  const required = id === 'calculus' && config.controlMode === 'individual' && config.controlCount === 'unknown' || id === 'physics' && config.alpha === 'unknown';
  return `<details class="settings" ${required ? 'open' : ''}><summary>Reglas de tu paralelo ${icon('info')}</summary><div class="settings-content">${html}</div></details>`;
}
function fieldHTML(f, solo = false) {
  const g = active().grades[f.id] || {}, sim = active().scenario;
  const absent = state.activeCourse === 'physics' && effective().config.justified === f.id;
  return `<div class="grade-field ${solo ? 'solo' : ''}" data-field="${f.id}"><label for="real-${f.id}">${esc(f.label)}</label><div class="input-box"><input id="real-${f.id}" type="text" inputmode="decimal" maxlength="16" autocomplete="off" data-grade="${f.id}" data-mode="real" value="${esc(g.real)}" placeholder="—" aria-label="${esc(f.label)}, ${f.kind === 'factor' ? 'valor real' : 'nota real'}" aria-describedby="note-${f.id}" ${absent ? 'disabled' : ''}><span class="input-unit">${f.kind === 'attendance' ? '%' : f.kind === 'factor' ? '×' : '/100'}</span></div>${sim && !absent ? `<div class="sim-label">HIPÓTESIS</div><input id="sim-${f.id}" type="text" inputmode="decimal" maxlength="16" autocomplete="off" data-grade="${f.id}" data-mode="sim" value="${esc(g.sim)}" placeholder="¿Y si…?" aria-label="${esc(f.label)}, ${f.kind === 'factor' ? 'valor simulado' : 'nota simulada'}" aria-describedby="note-${f.id}">` : ''}<small id="note-${f.id}" class="field-note">${absent ? 'Se sustituirá por el Global.' : ''}</small></div>`;
}
function renderForm() {
  const groups = modelFor(state.activeCourse, effective().config);
  const groupHTML = g => `<section class="group" data-group="${g.id}"><div class="group-top"><h4>${g.title}</h4><span class="group-average" id="average-${g.id}"></span></div><p class="group-subtitle">${g.subtitle}</p><div class="grade-grid">${g.fields.map(f => fieldHTML(f, g.fields.length === 1)).join('')}</div></section>`;
  document.querySelector('#form').innerHTML = `${active().scenario ? '<div class="sim-notice">✦ Estás simulando. Escribe tus hipótesis en los campos violetas; una casilla simulada vacía conserva la nota real. Tus notas reales siguen intactas.</div>' : ''}${active().scenario && active().scenarioConfig ? '<p class="setting-note">Este ejemplo usa ajustes simulados. Al volver a Mis notas recuperas tu configuración real.</p>' : ''}<div id="issues"></div>${groupHTML(groups[0])}${settingsHTML()}${groups.slice(1).map(g => (state.activeCourse === 'physics' && ['lab', 'simple'].includes(g.id) ? labSettingsHTML() + '<div id="lab-result"></div>' : '') + (g.id === 'attendance' ? '<details class="settings"><summary>Asistencias finales (opcional si confirmaste el factor)</summary>' + groupHTML(g) + '</details>' : groupHTML(g))).join('')}<div class="form-footer"><button class="text-button" data-action="reset">${icon('reset')} Limpiar este ramo</button><button class="example-button" data-action="example">${icon('spark')} Probar un ejemplo</button></div>`;
  document.querySelectorAll('[data-mode-tab]').forEach(b => b.setAttribute('aria-pressed', String(active().scenario === (b.dataset.modeTab === 'sim'))));
}
function metric(label, value, unit, foot, name, progress) { return `<div class="metric"><div class="metric-label">${label}${icon(name)}</div><div class="metric-number">${esc(value)}${unit ? `<span class="unit">${unit}</span>` : ''}</div>${progress !== undefined ? `<div class="mini-track"><span style="width:${Math.min(100, Math.max(0, progress))}%"></span></div>` : ''}<div class="metric-foot">${foot}</div></div>`; }
function goalHTML(a) {
  let headline = 'TU PRÓXIMO OBJETIVO', value = '54,5', unit = 'la meta para aprobar', copy = 'Empieza con tus primeras notas. Aquí verás cuánto necesitas en las evaluaciones que quedan.', helper = 'Un espacio en blanco sigue siendo una evaluación pendiente.';
  const recovery = COURSES[a.id].recoveryName;
  if (a.errors.length) { value = '—'; unit = 'revisa las notas marcadas'; copy = 'No se calcula un mínimo con valores inválidos.'; helper = 'Puedes usar coma o punto decimal, entre 0 y 100.'; }
  else if (a.status === 'approved' || a.status === 'secured') { headline = 'TU RESULTADO'; value = a.exact?.final !== null && a.exact?.final !== undefined ? fmt(a.exact.final) : `≥${fmt(a.finalRange?.low || 54.5)}`; unit = a.scenario ? 'apruebas en este escenario' : 'cumples el mínimo de aprobación'; copy = a.status === 'secured' ? 'Las pendientes ya no pueden bajar tu resultado de 54,5 con las reglas verificadas.' : `Llegaste a la meta. ${a.id === 'physics' ? (a.hasG && !a.exact?.direct ? 'Aprobaste mediante Global.' : 'Cumples las condiciones de aprobación.') : 'Tu nota final está sobre el mínimo o justo en él.'}`; helper = a.hasG ? `Incluye la nota de ${recovery} ingresada.` : ['physics','calculus1'].includes(a.id) ? 'No necesitas rendir Global.' : 'Una evaluación voluntaria posterior puede cambiar este resultado.'; }
  else if (a.status === 'impossible') { value = '—'; unit = 'sin una vía de aprobación calculable'; copy = a.id === 'physics' && ['c1','c2','c3'].filter(k => a.values[k]?.lt(50) && a.config.justified !== k).length >= 2 ? 'Tienes dos certámenes bajo 50. Con esta restricción no puedes aprobar mediante Global.' : a.exact?.reason === 'lab' ? 'El laboratorio está bajo 55. El Global no puede compensar ese requisito.' : a.exact?.reason === 'presentation' ? 'El promedio semestral está bajo 49,5 y no habilita el Global.' : 'Las restricciones y las notas registradas impiden llegar al mínimo, incluso con el máximo en lo que falta.'; helper = 'Revisa los cálculos y las notas oficiales. Las situaciones excepcionales las resuelve coordinación.'; }
  else if ((a.status === 'recovery' || (a.regularComplete && !a.exact?.pass)) && a.recoveryTarget) { headline = `OBJETIVO EN ${recovery.toUpperCase()}`; value = rangeText(a.recoveryTarget); unit = `necesitas en el ${recovery}`; copy = a.issues.length ? 'El mínimo depende de la configuración pendiente. Confirma los datos para obtener una sola meta.' : `Con ${fmt(a.recoveryTarget.high)} en el ${recovery} alcanzas la aprobación según las notas ingresadas.`; helper = `Si solo admiten enteros: ${Math.ceil(Number(a.recoveryTarget.high))}.${a.recoveryConditional ? ' Sujeto a que tengas acceso al recuperativo.' : ''}${a.recoveryTarget.partial ? ' Hay configuraciones en las que ni 100 alcanza.' : ''}`; }
  else if (a.target && a.status !== 'empty') { value = rangeText(a.target); unit = a.target.field ? `necesitas en ${a.target.field.toLowerCase()}` : 'necesitas en cada evaluación pendiente'; copy = a.target.field ? 'Manteniendo las otras notas ingresadas, esta es la menor nota que cumple las condiciones.' : `Si obtienes la misma nota en las ${a.target.count} entradas pendientes, esta es la meta para aprobar${a.hasG ? ' con la recuperación ingresada' : ' sin recuperación'}.`; helper = `${a.issues.length ? 'El rango depende de los datos por confirmar. ' : ''}Calculado hacia arriba a centésimas. ${a.target.partial ? 'En algunas configuraciones no alcanza ni con 100.' : 'Si solo admiten enteros: ' + Math.ceil(Number(a.target.high)) + '.'}`; }
  else if (a.status === 'recovery' || a.justified) { value = 'Global' === recovery ? 'G' : 'R'; unit = `simula lo que falta para calcular el ${recovery}`; copy = a.justified ? 'Tu Global sustituirá primero el certamen justificado. Después se recalculan el promedio y todas las condiciones.' : `La vía disponible pasa por el ${recovery}, pero su mínimo depende de las notas que todavía faltan.`; helper = a.recoveryConditional ? 'El acceso al recuperativo debe confirmarse con tu docente.' : 'No se reemplazan las notas pendientes por ceros.'; }
  else if (a.status === 'conditional') { value = '—'; unit = 'resultado condicionado'; copy = 'Todavía falta confirmar una regla o un dato. Puedes completar las notas conocidas y explorar hipótesis.'; helper = a.issues[0] || 'Revisa “Reglas de tu paralelo”.'; }
  return `<section class="card goal-card"><div class="goal-eyebrow">${headline}${icon('target')}</div><div class="goal-number ${String(value).length > 6 ? 'range' : ''}">${esc(value)}</div><div class="goal-unit">${esc(unit)}</div><p class="goal-copy">${esc(copy)}</p><p class="goal-help">${esc(helper)}</p></section>`;
}
function requirementsHTML(a) {
  const items = a.exact?.requirements || (a.id === 'physics' ? [{ label: 'Como máximo un certamen bajo 50' }, { label: 'Laboratorio ≥ 55' }, { label: 'Cada certamen ≥ 50 (directa)' }, { label: 'Promedio semestral ≥ 54,5 (directa)' }] : a.id === 'programming' ? [{ label: 'Promedio de certámenes ≥ 55' }, { label: 'Promedio ponderado ≥ 54,5' }] : [{ label: 'Nota final ≥ 54,5' }]);
  if (a.id === 'physics' && !a.exact) {
    const lows = ['c1','c2','c3'].filter(k => a.values[k]?.lt(50) && a.config.justified !== k).length;
    if (lows >= 2) Object.assign(items[0], { met: false, value: lows });
  }
  return `<section class="card requirements"><h3>Las condiciones de tu ramo</h3>${items.map(r => `<div class="requirement-row ${r.met === true ? 'met' : r.met === false ? 'failed' : ''}">${icon(r.met === true ? 'check' : r.met === false ? 'minus' : 'dot')}<span>${r.label}</span><b>${r.value === undefined ? 'Pendiente' : esc(fmt(r.value, 4))}</b></div>`).join('')}${a.id === 'physics' ? `<div class="requirement-row ${a.issues.some(x => x.includes('α')) ? '' : 'met'}">${icon(a.issues.some(x => x.includes('α')) ? 'dot' : 'check')}<span>Factor de asistencia</span><b>${a.issues.some(x => x.includes('α')) ? 'Por confirmar' : esc(fmt(a.variants[0].alpha))}</b></div>` : ''}</section>`;
}
function recoveryHTML(a) {
  const c = COURSES[a.id];
  let text = a.id === 'physics' ? 'Se exige laboratorio ≥ 55, PS ≥ 49,5 y no tener dos certámenes bajo 50. El Global debe ser ≥ 50 y la nota final ≥ 54,5.' : a.id === 'programming' ? 'Reemplaza el certamen más bajo, incluso si el resultado empeora. Confirma el acceso con tu docente.' : 'Voluntario. Reemplaza el peor certamen incluso si baja tu nota. No requiere un mínimo de presentación.';
  if (a.id === 'calculus1') text = 'Si tu PS está bajo 54,5, puedes rendir este Global. Reemplaza la peor nota de certamen con su ponderación original.';
  if (a.id === 'algebra') text += ' Debes inscribirte dentro del plazo.';
  if (a.justified) text = 'Por tu ausencia justificada, sustituye primero el certamen no rendido y después recalcula el ramo.';
  if (a.exact?.pass && !a.hasG) text = (['physics', 'calculus1'].includes(a.id) ? 'No necesitas Global.' : `Ya apruebas sin ${c.recoveryName}. ${a.id === 'programming' ? 'Si tienes acceso y lo rindes' : 'Si lo rindes'}, su resultado puede bajar tu nota.`);
  let badge = 'Situación aún por definir';
  if (a.id === 'physics' && ['c1','c2','c3'].filter(k => a.values[k]?.lt(50) && a.config.justified !== k).length >= 2) badge = 'No cumples los requisitos para Global';
  else if (a.issues.length) badge = 'Falta confirmar un requisito';
  else if (a.hasG && a.exact) badge = a.exact.pass ? 'Requisitos de aprobación cumplidos' : 'La nota ingresada no alcanza';
  else if (a.exact?.pass) badge = ['physics', 'calculus1'].includes(a.id) ? 'No necesitas Global' : a.id === 'programming' ? 'Ya apruebas sin recuperativo' : 'Opcional: ya apruebas';
  else if (a.id === 'physics' && a.exact) badge = a.exact.eligible ? 'Debes rendir Global' : 'No cumples los requisitos para Global';
  else if (a.id === 'programming') badge = a.config.recoveryAccess === 'no' ? 'Sin acceso al recuperativo' : a.config.recoveryAccess === 'yes' ? 'Acceso confirmado' : 'Acceso por confirmar con docente';
  else if (a.regularComplete) badge = a.recoveryTarget ? 'Puedes rendirlo para intentar aprobar' : 'Puedes rendirlo, pero ni 100 alcanza';
  return `<section class="card recovery-card"><h3>${icon('spark')}${c.recoveryName}</h3><span class="recovery-badge">${esc(badge)}</span><p>${esc(text)}</p>${a.regularComplete && a.recoveryTarget && !a.errors.length ? `<p class="recovery-reference">${a.hasG ? 'Mínimo necesario para aprobar' : 'Tu meta en esta evaluación'}: <strong>${esc(rangeText(a.recoveryTarget))}</strong>${a.issues.length ? ' (condicionado)' : ''}.</p>` : ''}<div class="grade-grid">${fieldHTML({ id: 'g', label: `Nota de ${c.recoveryName.toLowerCase()}`, kind: 'grade' }, true)}</div>${a.hasG && a.exactBefore?.pass && !a.exact?.pass && a.regularComplete ? '<p style="color:#ac6d53;margin-top:12px">El reemplazo hace bajar tu nota. Sin rendirlo, aprobabas.</p>' : ''}</section>`;
}
function updateResults({ preserveGlobal = false } = {}) {
  const a = analysis(), c = COURSES[a.id], message = messageFor(a);
  const progress = a.totalCount ? a.knownCount / a.totalCount * 100 : 0;
  document.querySelector('#summary').innerHTML = `<div class="main-goal">${goalHTML(a)}</div><section class="status-banner" data-status="${a.status}" role="status" aria-live="polite"><div class="status-symbol">${icon(a.status === 'approved' || a.status === 'secured' ? 'check' : a.status === 'recovery' ? 'spark' : a.status === 'invalid' || a.status === 'impossible' ? 'info' : 'leaf')}</div><div><h3>${message.title}</h3><p>${message.body}${a.recoveryConditional && a.status === 'recovery' ? ' Acceso al recuperativo pendiente de confirmar.' : ''}</p></div>${active().scenario ? '<span class="sim-tag">✦ SIMULACIÓN</span>' : ''}</section><div class="metrics">${metric(a.pointsKnown === null ? 'Certámenes registrados' : 'Aporte acumulado', a.errors.length ? '—' : fmt(a.pointsKnown === null ? a.observed : a.pointsKnown), a.pointsKnown === null ? '/100' : 'pts.', a.pointsKnown === null ? 'Solo los ingresados · no es la nota final' : (a.id === 'calculus1' ? 'Base previa al factor η' : a.id === 'algebra' ? 'Base previa a ω' : a.id === 'physics' ? 'Base previa a α' : 'Aporte ponderado de las notas definidas') + (a.hasG ? ' · antes de recuperación' : ' · no es la nota final'), 'chart')}${metric('Notas registradas', `${a.knownCount}`, `de ${a.totalCount}`, a.weightKnown !== null ? `${fmt(a.weightKnown * 100)}% de la base con nota definida` : 'Cantidad de entradas · el peso puede variar', 'pencil', progress)}${metric(a.exact?.final !== null && a.exact?.final !== undefined ? 'Nota final calculada' : a.id === 'calculus1' && a.hasG && a.regularComplete && a.finalRange ? 'Nota final según el reemplazo' : a.exact ? 'Nota semestral' : 'Rango de nota semestral', a.errors.length || a.status === 'empty' ? '—' : a.exact?.final !== null && a.exact?.final !== undefined ? fmt(a.exact.final) : rangeText(a.id === 'calculus1' && a.hasG && a.regularComplete ? a.finalRange : a.range), '', a.exact ? 'Comparada sin redondear con el mínimo' : a.id === 'calculus1' && a.hasG && a.regularComplete && a.finalRange ? 'Empate en certámenes con pesos distintos · confirma cuál se reemplaza' : 'Pendientes entre 0 y 100 · no es una predicción', 'target')}</div>`;
  document.querySelector('#issues').innerHTML = a.issues.length || a.errors.length ? `<ul class="issue-list">${a.issues.map(x => `<li>${esc(x)}</li>`).join('')}${a.errors.map(x => `<li><a href="#${a.simulated.includes(x.id) ? 'sim' : 'real'}-${esc(x.id)}">${esc(x.label)}</a>: ${esc(x.error)}</li>`).join('')}</ul>` : '';
  const results = document.querySelector('#results');
  if (preserveGlobal && results.querySelector('.recovery-card')) {
    const existing = results.querySelector('.recovery-card');
    const focused = document.activeElement; const selection = focused?.selectionStart;
    const fresh = document.createElement('div'); fresh.innerHTML = recoveryHTML(a);
    existing.querySelector('.recovery-badge').textContent = fresh.querySelector('.recovery-badge').textContent;
    existing.querySelectorAll('p').forEach(p => p.remove());
    for (const p of fresh.querySelectorAll('p')) existing.insertBefore(p, existing.querySelector('.grade-grid'));
    const marker = document.createElement('div'); existing.replaceWith(marker);
    results.innerHTML = requirementsHTML(a) + '<div id="global-slot"></div>' + '<div class="rules-mini"><strong>Tu meta, con contexto.</strong>Un promedio alto no siempre basta. Rumbo revisa también los requisitos específicos de este ramo.</div>';
    results.querySelector('#global-slot').replaceWith(existing);
    if (focused && existing.contains(focused)) { focused.focus({ preventScroll: true }); if (selection !== null) focused.setSelectionRange(selection, selection); }
  } else results.innerHTML = requirementsHTML(a) + recoveryHTML(a) + '<div class="rules-mini"><strong>Tu meta, con contexto.</strong>Un promedio alto no siempre basta. Rumbo revisa también los requisitos específicos de este ramo.</div>';
  updateFieldStates(a); renderCalculation(a); renderCases(a); renderLab(a);
  const dot = document.querySelector('#nav-dot-' + a.id); if (dot) dot.classList.toggle('has-notes', Object.values(active().grades).some(g => String(g.real ?? '').trim()));
  return a;
}
function updateFieldStates(a) {
  const dropped = Object.values(a.dropped).flat();
  for (const field of [...a.allFields, { id: 'g', label: 'Global' }]) {
    const cell = active().grades[field.id] || {}, note = document.querySelector('#note-' + field.id);
    let err = null;
    for (const mode of ['real', 'sim']) { const input = document.querySelector(`#${mode}-${field.id}`); if (!input) continue; const p = field.kind === 'factor' ? parseFactor(cell[mode]) : parseGrade(cell[mode]); input.setAttribute('aria-invalid', String(!!p.error)); if (p.error) err = p.error; }
    if (note && !(a.id === 'physics' && a.config.justified === field.id)) note.textContent = err || (a.simulated.includes(field.id) ? 'Se usa la hipótesis en este escenario.' : '');
    document.querySelector(`[data-field="${field.id}"]`)?.classList.toggle('dropped', dropped.includes(field.id));
  }
  for (const g of a.groups) {
    const excluded = a.dropped[g.id] || [];
    const vals = g.fields.filter(f => f.kind === 'grade' && !excluded.includes(f.id)).map(f => a.values[f.id]).filter(x => x !== null);
    const node = document.querySelector('#average-' + g.id);
    if (node) node.textContent = vals.length ? `${excluded.length ? 'Promedio usado' : 'Ingresadas'}: ${fmt(mean(vals))}` : '';
  }
}
function renderCalculation(a) {
  const c = COURSES[a.id], details = a.exact?.details || {};
  const labels = { nc: 'Promedio de certámenes', nq: 'Promedio de controles', nl: 'Nota de laboratorio', omega: 'Factor ω', pco: 'Cuatro mejores controles', pta: 'Tres mejores tareas', alpha: 'Factor α', ctl: 'Controles de laboratorio', t: 'Tareas', ef: 'Formativas', eca: 'Autocorregidos', base: 'Suma ponderada antes del factor', eta: 'Factor de laboratorio η', pt: 'Nota final de taller' };
  const pending = a.pending.map(f => f.label).join(', ') || 'No quedan notas ordinarias pendientes.';
  document.querySelector('#calculation').innerHTML = `${c.formulas.map(x => `<div class="formula">${esc(x)}</div>`).join('')}${a.weightKnown !== null ? `<p><strong>${fmt(a.weightKnown * 100)}% de la ${a.id === 'calculus1' ? 'base previa a η' : a.id === 'algebra' ? 'base previa a ω' : a.id === 'physics' ? 'base previa a α' : 'ponderación'}</strong> tiene una nota definida. Aporte de esas notas: <strong>${fmt(a.pointsKnown, 4)} puntos</strong>${a.hasG ? ' antes de reemplazos' : ''}.</p>` : '<p>Con descartes y condiciones pendientes, el número de notas registradas no equivale al peso definitivo del ramo.</p>'}<table class="calculation-table"><tbody>${Object.entries(details).filter(([, v]) => v !== null).map(([k, v]) => `<tr><td>${labels[k] || k}</td><td>${esc(fmt(v, 6))}</td></tr>`).join('')}<tr><td>Nota semestral</td><td>${a.errors.length ? '—' : esc(a.exact ? fmt(a.exact.semester, 6) : rangeText(a.range))}</td></tr><tr><td>Nota final</td><td>${a.errors.length ? '—' : esc(a.exact ? fmt(a.exact.final, 6) : 'Pendiente')}</td></tr></tbody></table><p><strong>Pendientes:</strong> ${esc(pending)}</p>${a.exact?.replaced ? `<p>Se reemplazó ${esc(a.exact.replaced.replace('c', 'Certamen '))} por la nota de ${c.recoveryName}.</p>` : ''}${Object.entries(a.dropped).map(([name, keys]) => `<p>Descartes de ${name === 'controls' ? 'controles' : 'tareas'}: ${keys.map(k => k.replace('q', 'Control ').replace('t', 'Tarea ')).join(', ')}.</p>`).join('')}<p>La meta para varias pendientes supone <strong>la misma nota en cada una</strong>, manteniendo las demás notas. No reemplaza los mínimos individuales. Un promedio final consolidado cuenta como una entrada en el progreso.</p><p>Los cálculos usan fracciones exactas. Las decisiones se toman antes de redondear la pantalla. Los mínimos recomendados se elevan a la centésima siguiente; se usa 54,5 para aprobación final y 49,5 para presentación al Global de Física. Los otros mínimos se verifican por separado.</p><button class="text-button" data-action="rules">${icon('book')} Leer reglas y fuentes</button>`;
}
function dialogHTML(html) { document.querySelector('#dialog-content').innerHTML = `<div class="dialog-body">${html}</div>`; document.querySelector('#dialog').showModal(); }
function closeDialog() { document.querySelector('#dialog').close(); pendingImport = null; }
function rulesDialog() {
  const c = COURSES[state.activeCourse];
  dialogHTML(`<h2>Las reglas de ${c.short}</h2><p>Versión ${RULE_VERSION}. Cada asignatura tiene una lógica independiente.</p><ul>${c.rules.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${c.formulas.map(x => `<div class="formula">${esc(x)}</div>`).join('')}<p><strong>Corrección del proyecto (26/10/2026):</strong> por indicación del solicitante, el umbral final es 54,5; el de presentación al Global de Física es 49,5 y dos certámenes bajo 50 bloquean su aprobación. Estas correcciones no aparecen en los PDFs originales. Se mantienen los mínimos adicionales de cada ramo.</p><h3>Documentos utilizados</h3>${c.sources.map(s => `<div class="source-entry"><b>${esc(s.title)} · ${esc(s.pages)}</b>${esc(s.file)}</div>`).join('')}<p>Usa notas en escala 0–100, no puntajes brutos. Esta herramienta interpreta los documentos suministrados; una actualización de coordinación debe incorporarse a la versión correspondiente.</p><div class="dialog-actions"><button class="primary-button" data-action="close">Entendido</button></div>`);
}
function helpDialog() { dialogHTML('<h2>Un poco de claridad para tu semestre.</h2><p>Rumbo revisa cada ramo con sus propias reglas. No necesitas completar todo para empezar.</p><ol><li><strong>Elige tu asignatura.</strong> Confirma los datos de tu paralelo cuando el reglamento tenga una ambigüedad.</li><li><strong>Ingresa tus notas reales.</strong> Un campo vacío queda pendiente; un 0 sí es una nota.</li><li><strong>Mira tu próximo objetivo.</strong> La meta indica qué necesitas y bajo qué condiciones.</li><li><strong>Prueba “¿Y si saco…?”.</strong> Los campos violetas son hipótesis. Al volver a Mis notas, vuelves a tus resultados reales.</li></ol><p>Los promedios oficiales se usan como notas finales de su grupo. Si solo conoces un promedio provisional, simúlalo o desglosa las evaluaciones y deja las futuras vacías.</p><p>Tus datos se guardan en este navegador. Exporta un respaldo para llevarlos a otro equipo. El sitio no envía tus notas a un servidor.</p><p>“Ya puedes respirar” solo aparece cuando las reglas calculadas permiten aprobar. No se promete aprobación con un simple promedio parcial.</p><div class="dialog-actions"><button class="primary-button" data-action="close">Vamos con mis notas</button></div>'); }
function exportState() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'rumbo-mis-notas.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Respaldo exportado. Contiene tus notas reales y tus simulaciones.'); }
function example() {
  const id = state.activeCourse, c = active(); c.scenario = true;
  const config = { ...c.config };
  const data = {};
  if (id === 'calculus') { config.controlMode = 'average'; Object.assign(data, { c1: '50', c2: '60' }); }
  if (id === 'calculus1') Object.assign(data, { c1: '50', c2: '60', eta: '1' });
  if (id === 'algebra') Object.assign(data, { c1: '59', c2: '64', q1: '70', q2: '65', l1: '80', attendance: '100' });
  if (id === 'physics') { config.alpha = '1'; config.labMode = 'details'; config.labLayout = 'separate'; config.isCount = '2'; config.inCount = '1'; config.ciCount = '1'; config.justified = 'none'; Object.assign(data, { c1: '57', c2: '50', is1: '70', is2: '80', in1: '65', ci1: '60', q1: '65', q2: '60', q3: '55', t1: '90', t2: '80', t3: '75' }); }
  if (id === 'programming') { config.efCount = '0'; config.ecaCount = '0'; Object.assign(data, { c1: '50', q1: '75', q2: '80', t1: '70', efMean: '90', ecaMean: '100' }); }
  c.scenarioConfig = config;
  delete previousScenarios[id];
  for (const cell of Object.values(c.grades)) cell.sim = '';
  for (const [key, value] of Object.entries(data)) c.grades[key] = { real: c.grades[key]?.real || '', sim: value };
  save(); shell(); toast('Ejemplo simulado. Sus ajustes son ilustrativos; tus notas reales siguen intactas.');
}
document.addEventListener('click', event => {
  const course = event.target.closest('[data-course]');
  if (course) { state.activeCourse = course.dataset.course; save(); shell(); return; }
  const tab = event.target.closest('[data-mode-tab]');
  if (tab) { active().scenario = tab.dataset.modeTab === 'sim'; save(); renderForm(); updateResults(); return; }
  const button = event.target.closest('[data-action]'); if (!button) return;
  const action = button.dataset.action; event.preventDefault();
  if (action === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
  if (action === 'rules') rulesDialog();
  if (action === 'help') helpDialog();
  if (action === 'close') closeDialog();
  if (action === 'export') exportState();
  if (action === 'import') document.querySelector('#import-file').click();
  if (action === 'example') example();
  if (action === 'try-case') applyCase(Number(button.dataset.row));
  if (action === 'undo-case') undoCase();
  if (action === 'reset') dialogHTML(`<h2>¿Limpiar ${COURSES[state.activeCourse].short}?</h2><p>Se borrarán las notas y simulaciones de este ramo en este navegador. Puedes exportar un respaldo antes.</p><div class="dialog-actions"><button class="secondary-button" data-action="close">Conservar mis notas</button><button class="primary-button" data-action="confirm-reset">Limpiar este ramo</button></div>`);
  if (action === 'confirm-reset') { state.courses[state.activeCourse] = blankCourse(state.activeCourse); delete previousScenarios[state.activeCourse]; delete caseOptions[state.activeCourse]; closeDialog(); save(); shell(); toast('Este ramo quedó limpio. Los demás conservan sus notas.'); }
  if (action === 'confirm-import' && pendingImport) { state = pendingImport; for (const id of COURSE_IDS) { delete previousScenarios[id]; delete caseOptions[id]; } closeDialog(); save(); shell(); toast('Respaldo importado.'); }
});
document.addEventListener('input', event => {
  if (event.target.matches('[data-case-rest]')) { caseOptions[state.activeCourse] ||= {}; caseOptions[state.activeCourse].rest = event.target.value; renderCaseRows(); return; }
  const input = event.target.closest('[data-grade]'); if (!input) return;
  const key = input.dataset.grade, mode = input.dataset.mode;
  active().grades[key] ||= { real: '', sim: '' }; active().grades[key][mode] = input.value;
  save(); updateResults({ preserveGlobal: key === 'g' });
});
document.addEventListener('change', event => {
  if (event.target.matches('[data-case-option]')) { caseOptions[state.activeCourse] ||= {}; caseOptions[state.activeCourse][event.target.dataset.caseOption] = event.target.value; renderCases(analysis()); return; }
  const input = event.target.closest('[data-config]'); if (!input) return;
  const config = active().scenario && active().scenarioConfig ? active().scenarioConfig : active().config;
  config[input.dataset.config] = input.value; save(); renderForm(); updateResults();
});
document.querySelector('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > 500000) throw new Error('El archivo es demasiado grande para ser un respaldo de Rumbo.'); const incoming = validateState(JSON.parse(await file.text())); pendingImport = incoming; dialogHTML('<h2>Tu respaldo está listo.</h2><p>Importarlo reemplazará las notas guardadas de todos los ramos. Puedes cancelar y exportar tus datos actuales primero.</p><div class="dialog-actions"><button class="secondary-button" data-action="close">Cancelar</button><button class="primary-button" data-action="confirm-import">Importar respaldo</button></div>'); }
  catch (e) { toast(e instanceof SyntaxError ? 'El archivo no contiene un respaldo JSON válido.' : e.message); }
  finally { event.target.value = ''; }
});
document.querySelector('#dialog').addEventListener('click', e => { if (e.target === e.currentTarget) closeDialog(); });
shell();
if (loaded.warning) toast(loaded.warning);

function labSettingsHTML() {
  const c = effective().config;
  let html = select('labMode', '¿Cómo calculamos tu laboratorio?', [['details','Con mis informes y controles'],['official','Ya tengo la nota final oficial']]);
  if (c.labMode === 'details') {
    html += select('labLayout','Detalle de las evaluaciones',[['separate','Separar IS, IN y controles'],['combined','Usar el desglose anterior IN + CI']]);
    html += c.labLayout === 'separate'
      ? select('isCount','Total de informes simples · IS',labCountOptions(true)) + select('inCount','Total de informes completos · IN',labCountOptions()) + select('ciCount','Total de controles de laboratorio · CI',labCountOptions())
      : select('isCount','Informes simples previstos',numberOptions()) + select('inciCount','Informes completos + controles previstos',numberOptions());
  }
  return `<section class="lab-settings"><h3>${icon('flask')} Tu laboratorio, paso a paso</h3><p>Cuenta también las evaluaciones que aún no rindes. Sus notas quedan vacías.</p>${html}<p class="setting-note">Los informes completos y los controles de laboratorio forman un único promedio. Usa las notas oficiales con los descuentos ya aplicados.</p></section>`;
}
function renderLab(a) {
  const target = document.querySelector('#lab-result'); if (!target) return;
  const lab = labProgress(a);
  let value = '—', text = 'Confirma arriba la cantidad total de cada tipo de evaluación.', stateName = 'pending';
  if (lab?.confirmed) {
    value = lab.final !== null ? fmt(lab.final) : rangeText(lab);
    if (a.errors.some(e => lab.fields.some(f => f.id === e.id))) { value = '—'; text = 'Corrige las notas de laboratorio marcadas.'; }
    else if (lab.impossible) { text = 'Ni con 100 en las pendientes el laboratorio llega a 55. Este requisito impide aprobar el ramo.'; stateName = 'bad'; }
    else if (lab.secure) { text = lab.pending.length ? 'El mínimo de laboratorio ya está asegurado con estas notas.' : 'Cumples el mínimo de laboratorio: 55. Falta revisar el resto del ramo.'; stateName = 'good'; }
    else if (lab.target) text = `Necesitas ${fmt(lab.target)}${lab.pending.length === 1 ? ' en ' + lab.pending[0].label.toLowerCase() : ' en cada evaluación de laboratorio pendiente'} para llegar a 55.`;
    else text = 'Tu laboratorio está bajo el mínimo de 55.';
  }
  target.innerHTML = `<div class="lab-result ${stateName}"><div><span>Tu nota de laboratorio ${lab?.final === null ? '(rango posible)' : ''}</span><strong>${esc(value)}</strong></div><p>${esc(text)}</p><small>50% promedio de IS + 50% promedio conjunto de IN y CI.</small></div>`;
}
function renderCases(a) {
  const host = document.querySelector('#cases'); if (!host) return;
  currentCases = buildCases(a.id, effective(), active().scenario, caseOptions[a.id]);
  const p = currentCases;
  const options = (selected, excluded) => p.fields.filter(f => f.id !== excluded).map(f => `<option value="${f.id}" ${selected === f.id ? 'selected' : ''}>${esc(f.label)}</option>`).join('');
  host.innerHTML = `<div class="case-heading"><div><span class="eyebrow">HAY MÁS DE UN CAMINO</span><h3>¿Y si te va mejor en otra evaluación?</h3><p>Compara combinaciones y elige una para simular.</p></div>${icon('flask')}</div>${previousScenarios[a.id] ? '<button class="text-button undo-case" data-action="undo-case">↶ Deshacer el último caso</button>' : ''}${p.first && !p.second ? `<div class="case-controls"><div><label for="case-route">Explorar otra vía</label><select id="case-route" data-case-option="route"><option value="direct">Aprobación sin recuperación</option><option value="recovery">${esc(COURSES[a.id].recoveryName)}</option></select></div></div>` : ''}${p.first && p.second ? `<div class="case-controls"><div><label for="case-first">Si en…</label><select id="case-first" data-case-option="first">${options(p.first.id)}</select></div><div><label for="case-route">Quiero calcular…</label><select id="case-route" data-case-option="route"><option value="direct" ${p.route === 'direct' ? 'selected' : ''}>Otra nota pendiente</option><option value="recovery" ${p.route === 'recovery' ? 'selected' : ''}>${esc(COURSES[a.id].recoveryName)}</option></select></div>${p.route === 'direct' ? `<div><label for="case-second">Cuánto necesito en…</label><select id="case-second" data-case-option="second">${options(p.second.id,p.first.id)}</select></div>` : ''}</div>${p.rest?.length ? `<div class="case-assumption"><label for="case-rest">Para las otras ${p.rest.length} pendientes, supongamos:</label><input id="case-rest" data-case-rest type="text" inputmode="decimal" maxlength="16" value="${esc(caseOptions[a.id]?.rest ?? '60')}" aria-describedby="case-rest-help"><span>en cada una</span><details><summary>Ver cuáles</summary><p>${esc(p.rest.map(f=>f.label).join(', '))}</p></details><small id="case-rest-help">Es una hipótesis editable, no una nota real ni un promedio exigido.</small></div>` : '<p class="case-assumption">Se mantienen las otras notas ingresadas. No se añaden supuestos ocultos.</p>'}` : ''}<div id="case-table"></div>`;
  renderCaseRows();
}
function renderCaseRows() {
  currentCases = buildCases(state.activeCourse, effective(), active().scenario, caseOptions[state.activeCourse]);
  const p = currentCases, target = document.querySelector('#case-table'); if (!target) return;
  if (!p.rows.length) { target.innerHTML = `<p class="case-empty">${esc(p.reason || 'Ingresa una nota para empezar a comparar tus alternativas.')}</p>`; return; }
  target.innerHTML = `${p.conditionalAccess ? '<p class="setting-note">Estos casos suponen que tu docente te permite rendir el recuperativo.</p>' : ''}<div class="case-table-scroll"><table class="cases-table"><caption>Combinaciones para cumplir todas las condiciones de aprobación</caption><thead><tr><th scope="col">Si sacas en<br>${esc(p.first.label)}</th><th scope="col">Necesitas en<br>${esc(p.second.label)}</th><th scope="col">Con ese resultado</th><th scope="col">Simular</th></tr></thead><tbody>${p.rows.map((row,i)=>`<tr class="${row.possible?'possible':'not-possible'}"><td><strong>${row.fixed}</strong></td><td><strong>${row.noRecoveryNeeded ? 'Sin Global' : row.possible?esc(fmt(row.required)):'No alcanza'}</strong>${row.noRecoveryNeeded ? '<small>apruebas directamente</small>' : row.possible?'<small>mínimo suficiente</small>':'<small>ni con 100</small>'}</td><td>${row.possible ? row.direct || p.route === 'direct' ? 'Cumples las reglas' : 'Apruebas por recuperación' : 'Prueba otro caso'}</td><td>${row.possible?`<button class="case-button" data-action="try-case" data-row="${i}" aria-label="Probar caso con ${row.fixed} en ${esc(p.first.label)}">Probar ${icon('arrow')}</button>`:'—'}</td></tr>`).join('')}</tbody></table></div><p class="case-footnote">Cada fila es una alternativa. Verificamos también mínimos, descartes y acceso al Global; no basta con sumar el promedio.</p>`;
}
function applyCase(index) {
  const row = currentCases?.rows[index]; if (!row?.hypotheses) return;
  const c = active(); previousScenarios[state.activeCourse] = { scenario: c.scenario, sims: Object.fromEntries(Object.entries(c.grades).map(([k,v])=>[k,v.sim || ''])) };
  c.scenario = true;
  for (const [key,value] of Object.entries(row.hypotheses)) { c.grades[key] ||= { real:'', sim:'' }; c.grades[key].sim = value; }
  save(); renderForm(); updateResults(); toast('Caso aplicado como simulación. Tus notas reales siguen intactas.');
}
function undoCase() {
  const prev = previousScenarios[state.activeCourse]; if (!prev) return;
  const c = active(); c.scenario = prev.scenario;
  for (const [key,cell] of Object.entries(c.grades)) cell.sim = prev.sims[key] || '';
  delete previousScenarios[state.activeCourse]; save(); renderForm(); updateResults(); toast('Volviste a la simulación anterior.');
}
