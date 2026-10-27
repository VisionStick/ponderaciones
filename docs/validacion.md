# Validación · reglas 2026-2.2

Actualización verificada el 26 de octubre de 2026 (Chile).

## Pruebas automáticas

`npm run check`, `npm test` y `npm run build` finalizaron correctamente. Las **139 pruebas** cubren los cinco ramos: campos vacíos, ceros, valores inválidos, notas parciales, mínimos y máximos, límites exactos, restricciones de aprobación y recuperación, descartes, simulaciones y respaldos.

Los resultados de referencia están calculados independientemente en `docs/reglas-2026-2.md`. Las pruebas nuevas incluyen:

- Aprobación final en54,5 y rechazo inmediatamente por debajo; mínimos particulares separados.
- Física: presentación49,5; Global62 da54,5; Global61,99 no aprueba. Dos certámenes bajo50 bloquean incluso con Global100. Un50 exacto no cuenta como nota bajo50.
- Laboratorio: IS/IN/CI separados, promedio conjunto de IN y CI, cantidades desconocidas, cero evaluaciones de uno de esos dos tipos y mínimo de la última nota pendiente.
- MAT071: ponderaciones30/30/25/15, factorη obligatorio y distinto de una nota, Global sin mínimo de presentación, reemplazos con distintos pesos, empates, resultado no monótono y acceso reservado a quien no aprueba directamente.
- Casos: cada combinación ofrecida verifica todos los mínimos; hipótesis adicionales visibles; ninguna modificación de notas reales. No se inventa unGlobal0 cuando se aprueba sin rendirlo.
- Migración2026-2.1→2026-2.2: conserva notas e hipótesis y el laboratorio anterior. Los ajustes de ejemplos simulados sobreviven a la recarga sin cambiar la configuración real.

## Pruebas de navegador

Todas las notas usadas fueron ficticias. Se comprobó la versión previa a publicación en escritorio y en un marco de390×844.

| Acción | Resultado observado |
| --- | --- |
| Ejemplo MAT070: C1=50 yC2=60 | Meta uniforme54; casos C3=20/40/60/80/100 con PQ88/68/48/28/8 |
| Probar el caso C3=60,PQ=48 | Mensaje de aprobación simulada yNF54,5; notas reales vacías |
| Deshacer el caso | Regresa a las dos notas de ejemplo y a la tabla de alternativas |
| MAT071: C50/70/50,PT0,η1,G72 | Meta de Global70–74; nota final54–55,1; avisa del empate con distinto peso |
| Física: C1=49,5 yC2=49,99, resto pendiente | Bloqueo por dos certámenes; no cumple requisitos de Global aun con asistencia desconocida |
| Laboratorio: IS50/50,IN40,CI100 yCI pendiente | Necesita40 enCI2; al ingresarlo, NL55 |
| Física: C50/50/50, Q=T=42,5, NL55, α1, G62 | Presentación49,5, final54,5, aprobación por Global |
| Recargar el ejemplo | Conserva notas simuladas y sus ajustes; mantiene la meta54 |
| Marco móvil | Navegación de cinco ramos, tabla de casos y controles utilizables; página sin desbordamiento horizontal |

El cálculo interno de importación/exportación se valida mediante pruebas de su formato. No se realizó una prueba de carga/descarga de archivos desde el navegador en esta actualización. La captura `vista-previa.jpg` solo contiene un ejemplo simulado.

## Mejoras apoyadas en investigación de interfaz

Fuentes consultadas el26 de octubre de2026:

- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/). Aplicación: el objetivo aparece primero, y fórmulas, asistencias opcionales y ajustes secundarios se pueden desplegar cuando hacen falta.
- [W3C WAI: User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/). Aplicación: errores específicos junto a los campos, enlaces desde el resumen de errores y aviso accesible al cambiar el estado del estudiante.

Las fuentes orientan el diseño de la interfaz; ninguna define reglas académicas. Los reglamentos adjuntos y las correcciones explícitas del responsable del proyecto son las fuentes de los cálculos.

## Publicación

El sitio público del proyecto es `https://visionstick.github.io/ponderaciones/`. El repositorio ejecuta estas comprobaciones en GitHub Actions y publica desde `main` mediante GitHub Pages. La verificación de cada despliegue se comprueba contra el commit correspondiente.
