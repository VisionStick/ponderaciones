# Directorio de consultas · esquema 1

El directorio tiene un único catálogo: `data/directory.json`. La calculadora y sus notas permanecen separadas. La carga HTTP, validación, búsquedas y edición están en `src/directory.js`; la vista consume ese contrato y no conoce archivos Excel ni bases de datos.

## Datos recibidos y límites

Nómina de Matemáticas, San Joaquín, semestre 2026-2, recibida el 14/11/2026. Hoja “Atención Alumnos SJ 2026-2”, filas 4–52. Importación inicial: 49 profesores, 56 franjas semanales y 3 registros de coordinación por correo. Huella SHA-256: `50e8b6809e5c753d37fbeda0546bdb105668994fb80e7d6e62c8e06b28151ee6`.

El archivo informa nombre, atención, correo y oficina. **No incluye asignaturas ni paralelos**: `teachings` se inicia vacío. La búsqueda por ramo está implementada y probada con datos ficticios separados; no muestra relaciones inventadas en producción. Las asignaturas MAT070, MAT061 y MAT071 se vinculan a sus calculadoras existentes, no a docentes por inferencia.

Las oficinas, rangos continuos y observaciones se conservan literalmente en su significado. La ficha de Erwin Hernández mantiene F-551 y la referencia “4TO.PISO EDIFICIO F” del documento; no se corrige esa aparente discrepancia por suposición. Matías Sasso conserva 15:15–16:40. Nicolás Abarzúa mantiene el aviso previo por correo. José Rosales mantiene el correo de dominio usach.cl. No se envían correos automáticamente.

## Modelo normalizado

| Colección | Identidad y relaciones |
| --- | --- |
| `departments` | Un departamento por ID estable |
| `professors` | Una ficha por persona: nombre, departamento, correo, oficina y observaciones |
| `subjects` | Un código por asignatura, departamento y `calculatorId` opcional |
| `teachings` | Profesor + asignatura + semestre + paralelo opcional; varios vínculos comparten la misma ficha |
| `officeHours` | Profesor + semestre + campus; modalidad, día, inicio, término y lugar opcional |
| `periods` | Semestres, sin reutilizar automáticamente horarios anteriores |
| `campuses` | Campus identificados sin duplicar su nombre en cada ficha |
| `sources` | Documento, hoja, fecha y huella cuando se conocen |

`defaultPeriodId` elige el semestre inicial; `updatedAt` registra la incorporación de cambios, no garantiza que un horario siga vigente. Las horas son locales de Santiago de Chile. Un profesor sin horario continúa teniendo ficha. Una atención `appointment` no tiene día ni horas ficticias. El lugar vacío utiliza la oficina de la ficha; cambiar esa oficina actualiza la presentación en todos sus horarios que no tengan una ubicación particular.

La validación rechaza IDs/correos/códigos duplicados, referencias inexistentes, intervalos inválidos, horarios duplicados o solapados para la misma persona, vínculos repetidos y eliminación de registros utilizados. Horarios consecutivos son válidos. Los resultados por asignatura no duplican al profesor por sus distintos paralelos.

## Actualizar sin editar varios archivos

1. Abrir `admin.html`. Carga el catálogo publicado y recupera, si existe, el borrador guardado en ese navegador.
2. Crear departamentos, campus, semestres y asignaturas necesarios. Seleccionar el semestre inicial en el control correspondiente.
3. Registrar cada profesor una sola vez. En “Docencia por semestre”, relacionarlo con sus ramos y paralelos confirmados.
4. Añadir sus franjas en “Horarios de consulta”. Elegir “Coordinar por correo” cuando no exista un horario fijo.
5. Guardar cada registro en el borrador. Los errores no modifican el catálogo anterior. Hay deshacer, importación, exportación y restauración desde el publicado.
6. Descargar el catálogo validado y sustituir únicamente `data/directory.json` en el repositorio. Ejecutar `npm run check`, `npm test` y `npm run build`; revisar los cambios antes de publicarlos.

**Guardar en el editor no publica.** El borrador usa `rumbo-directory-draft-v1` en `localStorage`; nunca mezcla notas del estudiante. El editor no tiene token ni permiso para escribir en producción. `noindex` evita sugerir su indexación, pero no es autenticación. El control de publicación es el permiso de escritura del repositorio.

Una edición manual retira la atribución de transcripción exacta de esa fila. Los datos originales se conservan en el historial Git. No incluir datos de prueba en el catálogo publicado. Añadir una asignatura al directorio no crea una calculadora: su reglamento se revisa según `agregar-asignaturas.md`.

`scripts/import-math-schedule.py` reproduce la importación del Excel original y rechaza formatos de horario desconocidos. No debe sobrescribir un catálogo ya ampliado sin revisar y fusionar los cambios. El Excel original no se publica.

## Evolución a una base de datos

Esta versión usa alojamiento estático compatible con GitHub Pages, sin dependencias ni servidor de aplicación. No hay conexión a una base de datos remota que probar. Se prueban la carga HTTP del catálogo, el esquema, errores de red, JSON inválido, tamaño máximo, edición local y persistencia.

Cuando exista un servicio institucional, las colecciones se trasladan a tablas con esos mismos IDs, claves externas y restricciones únicas. `loadDirectory` puede consumir un endpoint de lectura que entregue el contrato del catálogo; las vistas y reglas de cálculo se conservan. Las escrituras deben pasar por un servicio autenticado con roles, validación de servidor, historial de cambios y publicación explícita. Esos servicios y credenciales deben vivir fuera del código público. No presentar un editor local como administración compartida.

Antes de cada semestre: confirmar docencia, campus, salas, franjas y condiciones; crear el nuevo período; cargar sus vínculos y horarios; cambiar `defaultPeriodId` tras revisar. Conservar el semestre anterior como historial, sin copiar su vigencia por defecto.
