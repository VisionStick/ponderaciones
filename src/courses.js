export const RULE_VERSION = '2026-2.1';
export const COURSES = {
  calculus: {
    id: 'calculus', code: 'MAT070', name: 'Introducción al Cálculo', short: 'Cálculo', icon: 'curve', color: 'coral',
    intro: 'Cada nota cuenta. Veamos qué necesitas para llegar a 55.', recoveryName: 'Global',
    groups: '3 certámenes · controles · Global voluntario',
    formulas: ['PQ = promedio simple de controles', 'NP = 0,25 × (C1 + C2 + C3 + PQ)', 'Sin Global: NF = NP', 'Con Global: reemplaza el certamen más bajo, incluso si baja la nota.'],
    rules: ['Apruebas con NF ≥ 55. No hay mínimo individual de certamen ni exigencia de asistencia.', 'Cualquier estudiante puede rendir Global. No tiene nota mínima propia.', 'El documento dice 6 controles en el calendario y 8 en la fórmula. Confirma el total en AULA o ingresa el promedio final oficial.', 'Las recuperativas justificadas son distintas del Global. Ingresa su resultado en la evaluación que reemplazan.', 'Las fechas de recuperativas también se contradicen: revísalas en AULA.'],
    sources: [{ title: 'Reglamento MAT070 · 2026-2', pages: 'pp. 1–2', file: 'Reglamento_Mat070_2026_2.pdf' }],
    defaults: { controlMode: 'individual', controlCount: 'unknown' }
  },
  algebra: {
    id: 'algebra', code: 'MAT061', name: 'Álgebra Lineal', short: 'Álgebra', icon: 'grid', color: 'lavender',
    intro: 'Tus certámenes, controles y laboratorio, en una sola mirada.', recoveryName: 'Global',
    groups: '3 certámenes · 3 controles · laboratorio',
    formulas: ['NC = (C1 + C2 + C3) / 3; NQ = (Q1 + Q2 + Q3) / 3', 'NL = 0,30 × asistencia (%) + 0,35 × L1 + 0,35 × L2', 'Si NL < 55: ω = 0,9 + NL/550; si NL ≥ 55: ω = 79/90 + NL/450', 'NS = mínimo((0,75 × NC + 0,25 × NQ) × ω, 100)', 'Global: reemplaza el peor certamen en todo caso y se recalcula NS.'],
    rules: ['Apruebas con NS ≥ 55. El laboratorio modifica el resultado: no es una ponderación adicional.', 'No hay mínimo obligatorio de laboratorio ni de cada certamen.', 'Global voluntario para quienes se inscriban a tiempo. Puede bajar tu nota, incluso si ya aprobaste.', 'Un cero por sanción académica no puede ser reemplazado por Global.', 'Las recuperativas por ausencia justificada reemplazan la evaluación original.'],
    sources: [{ title: 'Reglas MAT061 · 2026-2', pages: 'pp. 4–12', file: 'Reglas de la asignatura (1).pdf' }],
    defaults: { protectedZero: 'none' }
  },
  physics: {
    id: 'physics', code: 'FIS11125', name: 'Física General Mecánica', short: 'Física', icon: 'orbit', color: 'mint',
    intro: 'El promedio importa. Los mínimos de cada parte también.', recoveryName: 'Global',
    groups: '3 certámenes · 5 controles · 5 tareas · laboratorio',
    formulas: ['PCe = promedio de 3 certámenes', 'PCo = promedio de los 4 mejores controles; PTa = promedio de las 3 mejores tareas', 'NL = 0,50 × promedio(IS) + 0,50 × promedio conjunto(IN y CI)', 'PS = α × (0,60 × PCe + 0,08 × PCo + 0,12 × PTa + 0,20 × NL)', 'Global: G ≥ 50 y 0,60 × PS + 0,40 × G ≥ 55', 'Si repruebas: NF = mínimo(PS, 54). Con ausencia justificada, sustituir primero el certamen por G y recalcular todas las reglas.'],
    rules: ['Aprobación directa: NL ≥ 55, cada certamen ≥ 50 y PS ≥ 55.', 'Global: NL ≥ 55 y PS ≥ 50, cuando no se cumple la aprobación directa.', 'NL < 55 o PS < 50 impiden aprobar por la vía ordinaria del Global.', 'Los reglamentos no explican cómo combinar la asistencia de cátedra y laboratorio. Usa el factor efectivo confirmado por coordinación. Nunca multiplicamos dos factores por nuestra cuenta.', 'En laboratorio se puede recuperar una sola experiencia, con justificación aceptada (plazo: 5 días hábiles). Más de una requiere revisión docente.', 'Un informe completo sin planilla obligatoria descuenta 40 puntos. Ingresa la nota oficial ya corregida: no duplicamos descuentos.', 'Tareas y controles de cátedra no se recuperan. Una ausencia justificada a certamen se sustituye con la nota del Global.'],
    sources: [{ title: 'Reglas FIS11125 · 2026-2', pages: 'pp. 2–3', file: 'Reglas FIS111 2s2026 (1).pdf' }, { title: 'Reglas FIS111L · 2026', pages: 'pp. 1–2', file: 'Reglas_FIS111L_08-07-26.pdf' }],
    defaults: { labMode: 'official', isCount: '0', inciCount: '0', alpha: 'unknown', justified: 'none', labRecoveries: '0' }
  },
  programming: {
    id: 'programming', code: 'PROGRAMACIÓN', name: 'Introducción a la Programación', short: 'Programación', icon: 'code', color: 'peach',
    intro: 'Una condición clave: promedio de certámenes de al menos 55.', recoveryName: 'Recuperativo',
    groups: '2 certámenes · 8 controles · 4 tareas · EF y ECA',
    formulas: ['C = (C1 + C2) / 2', 'P = 0,50 × C + 0,20 × CTL + 0,20 × T + 0,05 × EF + 0,05 × ECA', 'Si C ≥ 55: NF = P. Si C < 55: NF = mínimo(C, 54)', 'Apruebas solo si C ≥ 55 y P ≥ 55.', 'El recuperativo siempre reemplaza el menor de los dos certámenes.'],
    rules: ['No hay mínimo individual de certamen; el requisito es sobre su promedio.', 'Cada categoría usa el promedio aritmético de sus evaluaciones.', 'Las 4 notas de tareas son sus resultados finales: la presentación no fija los pesos de entregas, quiz o interrogación.', 'EF y ECA admiten promedio final oficial o desglose con la cantidad prevista confirmada en AULA.', 'Las condiciones de acceso al recuperativo no están detalladas. Sus escenarios se indican como condicionales hasta confirmar acceso.', 'Ausentarse de un control implica 0; ausentarse de una parte de tarea implica 0 en esa parte. Usa las notas oficiales.'],
    sources: [{ title: 'Descripción de Programación · 2026-2', pages: 'diapositivas 4–11', file: 'Presentación_de_la_Asignatura__2026_2_.pdf' }],
    defaults: { efCount: '0', ecaCount: '0', recoveryAccess: 'unknown' }
  }
};
export const COURSE_IDS = Object.keys(COURSES);
const fields = (prefix, n, title, weight = null, kind = 'grade') => Array.from({ length: n }, (_, i) => ({ id: prefix + (i + 1), label: `${title} ${i + 1}`, weight: weight === null ? null : weight / n, kind }));
const single = (id, label, weight = null, kind = 'grade') => [{ id, label, weight, kind }];
const group = (id, title, subtitle, inputs) => ({ id, title, subtitle, fields: inputs });
export function count(v) { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 30 ? n : 0; }
export function modelFor(id, config = {}, overrideCount) {
  const c = { ...COURSES[id].defaults, ...config };
  const cs = group('certs', 'Certámenes', id === 'physics' ? '60% del promedio antes de asistencia · mínimo 50 en cada uno para aprobación directa' : id === 'programming' ? '50% del ramo · su promedio debe llegar a 55' : '75% de la base · 25% cada uno', fields('c', id === 'programming' ? 2 : 3, 'Certamen', id === 'physics' ? .6 : id === 'programming' ? .5 : .75));
  if (id === 'calculus') return [cs, group('controls', 'Controles', '25% del ramo · promedio simple', c.controlMode === 'average' ? single('pq', 'Promedio FINAL oficial de controles', .25) : fields('q', overrideCount || (c.controlCount === '6' ? 6 : 8), 'Control', .25))];
  if (id === 'algebra') return [cs, group('controls', 'Controles de ayudantía', '25% de la base · cuentan los tres', fields('q', 3, 'Control', .25)), group('lab', 'Laboratorio', 'Determina el factor ω, entre 0,9 y 1,1', [...fields('l', 2, 'Control de laboratorio'), ...single('attendance', 'Asistencia final al laboratorio (%)', null, 'attendance')])];
  if (id === 'programming') return [cs, group('controls', 'Controles de laboratorio', '20% · un control por cada una de las 8 unidades', fields('q', 8, 'Control', .2)), group('tasks', 'Tareas', '20% · ingresa la nota final de cada tarea', fields('t', 4, 'Tarea', .2)), group('ef', 'Evaluaciones formativas', '5% · promedio aritmético', count(c.efCount) ? fields('ef', count(c.efCount), 'Formativa', .05) : single('efMean', 'Promedio FINAL oficial de formativas', .05)), group('eca', 'Ejercicios autocorregidos', '5% · usa las notas consolidadas publicadas en AULA', count(c.ecaCount) ? fields('eca', count(c.ecaCount), 'Evaluación ECA', .05) : single('ecaMean', 'Promedio FINAL oficial de ECA', .05))];
  const lab = c.labMode === 'official' ? [group('lab', 'Laboratorio', '20% · mínimo obligatorio 55', single('nl', 'Nota FINAL oficial de laboratorio', .2))] : [group('simple', 'Informes simples · IS', '50% del laboratorio', count(c.isCount) ? fields('is', count(c.isCount), 'Informe simple') : single('isMean', 'Promedio FINAL de informes simples')), group('complete', 'Informes completos y controles · IN + CI', '50% del laboratorio · todas estas notas se promedian juntas', count(c.inciCount) ? fields('inci', count(c.inciCount), 'Informe o control individual') : single('inciMean', 'Promedio FINAL conjunto de IN + CI'))];
  return [cs, group('controls', 'Controles', '8% · se elimina el más bajo de los 5', fields('q', 5, 'Control')), group('tasks', 'Tareas', '12% · se eliminan las dos más bajas de las 5', fields('t', 5, 'Tarea')), ...lab, group('attendance', 'Asistencia', 'Opcional si ya confirmaste el factor α efectivo. Usa porcentajes finales o simula.', [...single('aClass', 'Asistencia a clases (%)', null, 'attendance'), ...single('aHelp', 'Asistencia a ayudantías (%)', null, 'attendance'), ...single('aLab', 'Asistencia a laboratorio (%)', null, 'attendance')])];
}
