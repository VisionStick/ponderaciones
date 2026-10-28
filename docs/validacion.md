# Validación · reglas 2026-2.3

Actualización verificada el 27 de octubre de 2026 (Chile). Las cuatro capturas nuevas sustituyen el programa anterior de MAT071. La discrepancia del encabezado del laboratorio queda documentada en el contrato académico y visible en el formulario.

## Pruebas automáticas

`npm run check`, `npm test` y `npm run build` finalizaron correctamente. Las **161 pruebas** cubren los cinco ramos: campos vacíos, ceros, valores inválidos, notas parciales, mínimos y máximos, límites exactos, restricciones de aprobación y recuperación, descartes, simulaciones y respaldos.

Los resultados de referencia están calculados independientemente en `docs/reglas-2026-2.md`. La actualización incluye:

- MAT071: tres certámenes igualmente ponderados (75%) y tres controles (25%), factor L obligatorio entre 0,9 y 1,1 y tope final de 100.
- Aprobación desde 54,5 y rechazo inmediatamente por debajo. No se trasladan a MAT071 los mínimos particulares de otros ramos.
- Global voluntario de MAT071 incluso para quien ya aprueba, sin mínimo propio ni de presentación. Siempre sustituye el peor certamen, aunque empeore. Los empates producen el mismo resultado porque los tres pesos son iguales.
- Laboratorio MAT071: factor oficial por defecto; desglose únicamente tras seleccionar expresamente que la pauta adjunta corresponde al paralelo. Se prueban las dos ramas del factor, la asistencia pendiente y el mínimo del último control.
- Casos: cada combinación propuesta verifica la aprobación completa. Las hipótesis adicionales son visibles y aplicar un caso no modifica las notas reales.
- Migración de 2026-2.1 y 2026-2.2: conserva notas reales y simuladas de todos los ramos. Taller y η antiguos se archivan sin reutilizarlos como controles o factor L.
- Interfaz: ausencia de enlaces al repositorio en el menú lateral y el pie de página.

Se mantienen las comprobaciones de Física (presentación 49,5; dos certámenes bajo 50 bloquean; laboratorio y Global conservan sus mínimos propios), MAT070, Álgebra y Programación.

## Pruebas de navegador

Todas las notas usadas fueron ficticias. Se comprobó la versión previa a publicación en escritorio y en un marco de 390 × 844.

| Acción | Resultado observado |
| --- | --- |
| Abrir MAT071 | Tres certámenes y tres controles; factor oficial L por defecto |
| C1 = 50, C2 = 60, Q1 = Q2 = 60 y L = 1; C3 y Q3 pendientes | Meta uniforme 51; alternativas concretas para C3 y Q3 |
| Probar C3 = 60 y Q3 = 24 | NF = 54,5; aprobación simulada; notas reales vacías |
| Añadir Global simulado 0 a ese caso | NF baja a 42; la nota se acepta y se advierte que el Global puede empeorar el resultado |
| Introducir L = 1,100001 | Error junto al campo; no se calcula una aprobación con el factor inválido |
| Elegir “Mi paralelo usa la pauta adjunta” e introducir ambos controles y asistencia en 55 | NL = 55 y L = 1; se recupera NF = 54,5 sin Global |
| Restaurar el ejemplo | Regresa a las cuatro notas de ejemplo, L = 1 y meta 51 |
| Revisar los enlaces de la página | Solo navegación interna; no hay enlace al repositorio |
| Marco móvil | El contenido ocupa 375 px sin desbordamiento horizontal; objetivo y formularios utilizables |

El formato de importación/exportación y las migraciones se validan mediante pruebas automáticas. No se realizó una carga/descarga de archivos desde el navegador en esta actualización. La captura `vista-previa.jpg` contiene únicamente un ejemplo simulado.

## Criterios de interfaz ya incorporados

Fuentes consultadas durante la mejora anterior, el 26 de octubre de 2026:

- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/). El objetivo aparece primero; las fórmulas y los ajustes secundarios se pueden desplegar cuando hacen falta.
- [W3C WAI: User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/). Errores específicos junto a los campos, enlaces desde el resumen de errores y aviso accesible cuando cambia el estado del estudiante.

Estas fuentes orientan la interfaz. Los cálculos académicos proceden de los reglamentos adjuntos y las correcciones explícitas del responsable del proyecto.

## Publicación

El sitio público es `https://visionstick.github.io/ponderaciones/`. GitHub Actions ejecuta las comprobaciones y GitHub Pages publica desde `main`. El estado de cada despliegue se verifica contra su commit.

Retirar los enlaces de la interfaz no cambia la visibilidad pública del repositorio ni incorpora control de acceso al sitio.
