# Validación · Rumbo 2.0 · reglas 2026-2.4

Revisión del 14 de noviembre de 2026 (Chile). El cambio académico se limita a retirar el bloqueo de FIS111 por varios certámenes bajo 50. Los mínimos de laboratorio, presentación, Global, asistencia, ausencias justificadas y las reglas de los otros cuatro ramos se conservan.

## Pruebas automáticas

`npm run check`, `npm test` y `npm run build`: **280 pruebas aprobadas**, sin omisiones. La comprobación de sintaxis incluye todos los módulos de aplicación, editor, scripts y pruebas; también valida el catálogo. El build vuelve a validar sus datos antes de copiar los archivos publicables.

- 18.432 escenarios ordinarios de Física y 648 con ausencia justificada, contrastados con un oráculo independiente de aritmética entera: mínimos, máximos, cero, varios certámenes bajos, α=1/0.5, laboratorio, acceso y resultados del Global.
- Límites exactos: PS49.5 y G62 dan NF54.5; G61.99 falla. NL54.99 y PS49.49 siguen bloqueando. Tres certámenes49, resto100 y G50 dan PS69.4 y NF61.64.
- Regresión de los cinco ramos: notas vacías, parciales, todas mínimas/máximas, datos inválidos, factores, descartes, metas, escenarios, mínimos y recuperación que empeora una aprobación. Se conservan los casos de las versiones anteriores que siguen vigentes.
- Migraciones desde 2026-2.1, 2026-2.2 y 2026-2.3: notas reales y simuladas conservadas; datos históricos de MAT071 no reinterpretados.
- Directorio: filtros combinados, búsqueda sin tildes, oficinas, asignaturas, varios ramos/paralelos por profesor, otros departamentos, semestre diferente, atención por coordinación y profesores sin horario.
- Integridad: IDs, correos, códigos y relaciones duplicados; referencias ausentes; horarios iguales, solapados, consecutivos o inválidos; fecha y formato; rechazo de eliminaciones con dependencias; edición sin mutar el original.
- Carga de datos: respuesta correcta, HTTP404, red no disponible, aborto, JSON inválido, esquema incompatible y tamaño excesivo.
- Transcripción: contraste independiente de oficinas, días y horas de las 49 filas originales, y observaciones particulares. Reimportar el Excel original produce exactamente el catálogo publicado de esta versión: 49 fichas, 56 franjas y 3 coordinaciones.
- Integridad del sitio: archivos e importaciones locales existentes, ausencia de enlaces de interfaz al repositorio y de mensajes que apliquen el bloqueo antiguo de Física.

Los profesores y asignaciones ficticios de las pruebas están separados del catálogo real. Las futuras ediciones manuales no se atribuyen como transcripciones intactas de una fila original.

## Pruebas de navegador

Se revisó el sitio renderizado en escritorio y en un marco móvil de **390 × 844**; no es una prueba en un teléfono físico. Las notas empleadas fueron ficticias.

| Acción | Resultado observado |
| --- | --- |
| Abrir directorio y filtrar Matemáticas | 49 profesores, 12 tarjetas iniciales |
| Mostrar más | 24 tarjetas, sin repetir fichas |
| Buscar “nicolas abar” | Nicolás Abarzúa; martes/jueves09:40–10:50, A-157, aviso por correo el día anterior |
| Seleccionar MAT071 | Aviso explícito de asignaciones pendientes, con acceso al departamento |
| Filtrar domingo o nombre inexistente | Estado vacío y opción de limpiar filtros |
| Modalidad “Coordinar por correo” | Carlos Finat, Eduardo Zapata y Gonzalo Contador; sin inventar horas |
| Modalidad “Sin horario registrado” | Cero en la nómina inicial, sin error |
| Ficha móvil de Gonzalo Contador | Correo, oficina y observación visibles; ancho375px sin desbordamiento |
| Importar ejemplo de Física desde MAT071 y recargar | Ruta y ramo Física conservados, objetivo62 |
| C40/40/70, PCo42.5, PTa42.5, NL55, α1 | PS49.5; exige Global62, sin bloquear por dos certámenes bajos |
| Ingresar G61.99 y luego G62 | No aprueba en el primer caso; NF54.5 y aprobación por Global en el segundo |
| Ejemplo MAT071 y caso C3=60/Q3=24 | Meta uniforme51 antes del caso; NF54.5 como simulación al aplicarlo |
| Ejemplos MAT070, Álgebra y Programación | Objetivos54,32.45 y60; sin campos inválidos |
| Salto “Ir al contenido” con teclado | Enfoca el contenido y conserva la sección de horarios |
| Inspección de controles del directorio | Todos tienen etiquetas; un H1 y ningún botón sin nombre |
| Editor: correo ya registrado | Rechazo y catálogo anterior intacto |
| Editor: guardar docente ficticio y recargar | Borrador recuperado; no se escribe en producción |
| Editor: horario duplicado | Rechazo de duplicado y solapamiento |
| Editor: borrar profesor con horario relacionado | Rechazo por referencia; ficha conservada |
| Editor: descargar y volver a importar catálogo | Archivo válido; confirmación de49 fichas y59 registros |
| Editor: importar archivo incompatible | Error específico, sin sustituir el borrador |
| Ficha de prueba vinculada a MAT070 y MAT071 | Una sola tarjeta; ficha con ambos ramos y sus paralelos |
| Ficha de prueba sin horario | Mensaje explícito de horario pendiente, sin inventar una franja |
| Restaurar publicado tras pruebas | Catálogo real de49 profesores, sin datos ficticios |

La revisión visual detectó y corrigió un error de sintaxis inicial, la pérdida de apertura del filtro de modalidad al cambiarlo, la ruta al importar notas de otro ramo y la navegación del enlace de salto. Las comprobaciones se repitieron tras corregirlos. La captura `horarios-preview.jpg` muestra el directorio final; `vista-previa.jpg` conserva el ejemplo simulado de la calculadora.

## Alcance y mantenimiento

El Excel no incluye asignaturas ni paralelos de los profesores. Los vínculos de docencia de producción permanecen vacíos hasta recibirlos. No se asigna un ramo a todos los docentes por pertenecer al departamento.

No hay base de datos remota: GitHub Pages sirve un catálogo JSON validado. Se comprobó esa carga y el editor de borradores locales. La migración futura a una API autenticada está descrita en `directorio.md`; no se presenta como implementada.

Se mantienen las ambigüedades documentadas de los reglamentos, entre ellas las cantidades de controles de MAT070 y la asistencia de Física. La interfaz distingue resultados condicionados y no inventa decisiones de coordinación.

## Publicación

El sitio público es `https://visionstick.github.io/ponderaciones/`. GitHub Actions comprueba sintaxis, catálogo, pruebas y build. GitHub Pages publica desde `main`; se revisa el estado de ambos workflows contra el commit de la versión. La aplicación no incluye cuentas, analítica ni servicios de seguimiento. Los enlaces directos al repositorio siguen ausentes.
