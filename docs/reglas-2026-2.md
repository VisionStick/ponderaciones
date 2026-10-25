# Contrato académico · versión 2026-2.1

Fuentes: documentos suministrados por el usuario, leídos completos y contrastados visualmente. Las ecuaciones siguientes usan notas en escala 0–100 y comparaciones exactas. No se presupone redondeo administrativo.

## MAT070 · Introducción al Cálculo

Fuente: Reglamento_Mat070_2026_2.pdf, pp. 1–2.

- Tres certámenes, de 25% cada uno.
- PQ = promedio simple de controles, 25%.
- NP = (C1 + C2 + C3 + PQ)/4.
- Sin Global: NF = NP. Con Global: reemplazar el menor certamen por G, incluso si empeora, y recalcular NP.
- Aprobación: NF ≥ 55. Sin mínimos de certamen/Global ni exigencia de asistencia. Global voluntario para cualquier estudiante.
- Con notas ordinarias completas: G mínimo = max(0, 220 − suma de los otros dos certámenes − PQ). Mayor que100 significa imposible, no falta de acceso.
- Recuperativas justificadas son independientes del Global. Se registra su resultado en la evaluación sustituida.

**Conflicto documentado:** método y calendario describen seis controles; §2.3 describe ocho. El sitio permite confirmar6/8 o usar PQ final oficial. Sin confirmación compara ambos modelos y no presenta aprobación definitiva. Las fechas de recuperación también se contradicen, así que no se automatizan vencimientos ni notas0 por calendario.

## MAT061 · Álgebra Lineal

Fuente: Reglas de la asignatura (1).pdf, pp.4–12. La segunda copia adjunta es idéntica.

- NC = (C1+C2+C3)/3; NQ = (Q1+Q2+Q3)/3.
- NL = 0.30 × asistencia(0–100) + 0.35 × L1 + 0.35 × L2.
- Si NL<55: ω = 0.9+NL/550. Si NL≥55: ω =79/90+NL/450. En NL=55 ambas ramas valen1.
- NS = min((0.75NC+0.25NQ)×ω,100).
- Aprueba con NS≥55. No se exige laboratorio≥55 ni cada certamen≥50.
- Global voluntario, inscripción en plazo, sin mínimo de presentación. Siempre reemplaza el peor certamen. Puede empeorar una aprobación.
- Un cero por sanción no se reemplaza. Como no se detalla inequívocamente qué otro certamen sustituir, ese caso suspende la proyección automática del Global y solicita confirmación docente. El sistema no inventa un reemplazo alternativo.
- G mínimo ordinario = max(0,220/ω−suma de los otros dos certámenes−NQ), con los demás datos completos.

## FIS11125 + FIS111L · Física

Fuentes: Reglas FIS111 2s2026 (1).pdf, pp.2–3; Reglas_FIS111L_08-07-26.pdf, pp.1–2.

- PCe: promedio de3 certámenes; PCo: promedio de los4 mejores de5 controles; PTa: promedio de las3 mejores de5 tareas.
- NL = 0.5×promedio(IS)+0.5×promedio conjunto(IN y CI). El segundo grupo agrupa todas las evaluaciones, no los dos promedios de IN/CI.
- PS = α×(0.60PCe+0.08PCo+0.12PTa+0.20NL).
- Aprobación directa: NL≥55, cada certamen≥50, PS≥55; NF=PS.
- Si NL<55 o PS<50: reprueba y NF=min(PS,54), incluso con Global alto.
- En los demás casos con NL≥55 y PS≥50, corresponde Global. Aprueba solo si G≥50 y0.60PS+0.40G≥55. Si pasa, NF=esa combinación; si falla, NF=min(PS,54).
- G mínimo ordinario = max(50,(55−0.60PS)/0.40), únicamente con PS fijo.
- Con ausencia justificada de un certamen, reemplazarlo primero por G, recalcular PS y volver a aplicar todas las ramas anteriores. Si tras sustituir cumple aprobación directa, NF=PS, sin forzar la combinación60/40. El sitio modela una ausencia; múltiples ausencias requieren información adicional.
- Justificación de certamen: plazo7 días hábiles. Tareas y controles de cátedra no se recuperan. Ausencia no justificada recibe la nota mínima oficial, ingresada por el estudiante.
- Laboratorio: justificación dentro de5 días hábiles, una sola experiencia recuperable. La nota recuperativa sustituye la experiencia ausente. Más de una requiere resolución docente y no permite certificar aprobación en la app.
- No inscribirse en el grupo o entregar tarde implica0 según las reglas. Un IN sin planilla obligatoria descuenta40 puntos. Se ingresan notas ya corregidas; no se duplica el descuento.

**Asistencia:** el reglamento de cátedra define α=1/0.5 por asistencia a clases y ayudantías, sin explicitar el caso mixto. El laboratorio también define un factor1/0.5, pero no explica su combinación con el anterior ni lo incorpora a su fórmula de NL. El sitio nunca multiplica factores por cuenta propia: usa α efectivo confirmado o infiere1 únicamente con las tres asistencias≥80%. Si faltan datos, muestra escenarios condicionados con1/0.5. Esos escenarios no resuelven una excepción institucional ni confirman elegibilidad.

**Experiencias:** no hay cantidades en el reglamento. Se admiten cantidades previstas explícitas para IS y para IN+CI, o sus promedios finales oficiales. No se confunde una media parcial con la final.

## Introducción a la Programación

Fuente: Presentación_de_la_Asignatura__2026_2_.pdf, diapositivas4–11.

- Dos certámenes; C=(C1+C2)/2.
- CTL: ocho controles (uno por unidad); T: cuatro tareas con nota final consolidada.
- P =0.50C+0.20CTL+0.20T+0.05EF+0.05ECA, cada componente promedio aritmético.
- Si C≥55: NF=P. Si C<55: NF=min(C,54), literalmente; no sustituir C por P en esta rama.
- Aprueba si C≥55 y P≥55. No hay mínimo de cada certamen.
- Recuperativo reemplaza siempre el menor certamen, incluso si empeora.
- No se describe un Global ni una combinación60/40. Tampoco se detallan condiciones de acceso al recuperativo. Los escenarios se condicionan al acceso confirmado.
- Si A=0.20CTL+0.20T+0.05EF+0.05ECA y M es el mayor certamen, R mínimo=max(0,110−M,220−4A−M).
- Cantidades EF/ECA y pesos de las partes de cada tarea no están detallados: usar promedios finales oficiales o cantidades confirmadas; nunca asignar pesos arbitrarios a subtareas.

## Datos incompletos y estados

- Vacío → `null`, nunca0. Las notas reales y simuladas se almacenan separadas; una simulada vacía conserva el valor real.
- Los intervalos calculan extremos de las pendientes, no probabilidades ni notas pronosticadas.
- La meta uniforme supone la misma nota en todas las entradas académicas pendientes, conservando asistencia/configuración y datos conocidos.
- Con varias reglas posibles, se muestran metas/rangos condicionados. Los criterios discretos (mínimo de cada certamen, laboratorio, elegibilidad) siempre se verifican.
- Para “aprobación asegurada” deben cumplirse todas las reglas en el peor caso. En Global voluntario la garantía presupone no tomar después una recuperación que empeore la nota.
- Un cero sancionado, autorizaciones no documentadas, más de una recuperación de laboratorio o múltiples ausencias no se resuelven con reglas inventadas.
- “Peso definido” cuenta contribuciones fijas. En Física, una nota de control no recibe peso permanente hasta conocer qué notas se descartan o comprobar que el grupo ya no puede variar.

## Casos de referencia derivados manualmente

| Caso | Resultado esperado |
| --- | --- |
| MAT070: C1=60, demás pendientes | Aporte15, peso25%, NP entre15 y90; meta uniforme53.34 |
| MAT070: certámenes45,45,45, seis controles100 | Con6 controles58.75; si son8 y los otros dos0,52.5 |
| MAT070: C20,40,50; PQ40; G90 | NF55; G89.99 da54.9975 y reprueba |
| MAT070: C50,80,80; PQ60; G0 | NF55, sin mínimo propio de Global |
| Álgebra: NC60, NQ80, NL0 | ω0.9; NS58.5, aprobado |
| Álgebra: todas las notas100 | NS100 por tope |
| Física: IS40,80; IN100; CI60,20 | NL60, porque IN/CI se agrupan juntos |
| Física: medias lab54.99 y55, resto100 | NL54.995, PS90.999; reprueba por laboratorio, NF54 |
| Física: C50 cada uno, PCo45, PTa45, NL55, α1 | PS50; G62.5 daNF55; G62.49 reprueba y NF50 |
| Física: C49,60,71; resto60; α1; G49 | Ponderado55.6 pero reprueba por G<50, NF54 |
| Física: componentes100, α0.5 | PS50; Global62.5 permite aprobar |
| Física: C60,60 y ausente justificado, resto60, α1, G50 | PS58 tras reemplazo; NF58 (no54.8) |
| Física: C30,30 y ausente justificado, resto60, α1, G70 | PS50; NF58; conG69.99 PS49.998 impide aprobar |
| Programación: C1=50,C2=59.99, resto100 | C54.995, P77.4975, NF54 |
| Programación: C1=10,C2=100, resto55 | C55, P55, aprueba |
| Programación: certámenes100, resto0 | P50, ni recuperativo100 alcanza |

Las pruebas automatizadas reproducen estos resultados esperados, además de validaciones, persistencia y separación de simulaciones. No contienen notas personales del usuario.

## Huellas de los documentos revisados

- Reglamento_Mat070_2026_2.pdf: `15d513e9ab6c8d1aa9b0f105928c24061ea10767559faff92e7dd4af742a50ed`
- Reglas de la asignatura (1).pdf: `f5d743ae42172a08dedaeb16cd11e285ba85235c9ae085bd8ed51abd3076fd16`
- Reglas FIS111 2s2026 (1).pdf: `da7199a0835e5935f035a5b65c09dcad1e89cdbc820d09198a452915f2b59bde`
- Reglas_FIS111L_08-07-26.pdf: `7107118acafc4a3dfd3cc6a4cea9044b9ac0f706505fa285d6feec8c8337515e`
- Presentación_de_la_Asignatura__2026_2_.pdf: `a6a4ac457e99eea5cd21e66e8c2b676e94df40c6dc1aa29786b3e5f87f548d8f`
