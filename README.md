# Rumbo · Tus notas, tu próximo paso

Calculadora y simulador de notas para cuatro asignaturas USM, semestre 2026-2. Puedes ingresar solo las notas conocidas y ver requisitos, objetivos y alternativas de recuperación. Las notas se guardan exclusivamente en el navegador.

![Rumbo con datos simulados de ejemplo](docs/vista-previa.jpg)

## Asignaturas

- Introducción al Cálculo — MAT070.
- Álgebra Lineal — MAT061.
- Física General Mecánica — FIS11125, con laboratorio FIS111L.
- Introducción a la Programación.

Cada asignatura tiene reglas independientes. La app distingue notas reales y simuladas, campos vacíos y ceros, aprobación directa y recuperación, y resultados definitivos y condicionados.

## Abrir y desarrollar

El sitio es estático, sin dependencias de producción ni instalación de paquetes. Requiere JavaScript moderno con `BigInt` y módulos ES. No se debe abrir con `file://`: usa un servidor HTTP local.

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000`. Para validar y preparar los archivos de publicación (Node.js 22 o superior):

```bash
npm run check
npm test
npm run build
```

`dist/` contiene el sitio publicable. El contenido fuente de la raíz también funciona directamente, con rutas relativas compatibles con `/ponderaciones/`.

## GitHub Pages

En este repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → /(root) → Save**.

El sitio no requiere Jekyll ni una etapa de compilación para esta modalidad. `.nojekyll` lo indica explícitamente. Tras la activación inicial, los cambios en `main` se publican por GitHub Pages. La activación de Pages requiere permisos de administración; no se deben incluir tokens en el repositorio ni pedirlos en un chat.

El workflow de comprobaciones ejecuta las verificaciones de sintaxis, las pruebas y la preparación de `dist/` en cada cambio. No activa Pages ni modifica la visibilidad del repositorio.

## Estructura

| Archivo | Responsabilidad |
| --- | --- |
| `src/courses.js` | Catálogo, campos, parámetros, textos y fuentes |
| `src/engine.js` | Reglas académicas, escenarios, límites y mensajes |
| `src/rational.js` | Fracciones exactas y validación decimal |
| `src/state.js` | Datos, versión, importación y almacenamiento |
| `src/app.js` | Interfaz y comportamiento |
| `styles.css` | Diseño responsive y accesibilidad visual |
| `tests/academic.test.mjs` | Casos numéricos y restricciones por ramo |
| `tests/data.test.mjs` | Valores inválidos, precisión y respaldos |
| `docs/reglas-2026-2.md` | Contrato académico y decisiones documentadas |
| `docs/agregar-asignaturas.md` | Cómo extender o actualizar el sitio |

## Precisión y límites conocidos

- Las decisiones comparan fracciones exactas. No se convierte 54,99 en aprobación por redondeo visual.
- El mínimo sugerido se eleva a centésimas y se muestra también el entero suficiente. No se inventa redondeo administrativo de la universidad.
- MAT070 menciona **6 y 8 controles** en secciones diferentes. El estudiante confirma el total en AULA o ingresa el promedio final oficial; hasta entonces el resultado es condicionado.
- Física presenta factores de asistencia de cátedra y laboratorio sin explicar su combinación. Se usa el factor efectivo confirmado, o α=1 cuando las tres asistencias alcanzan el 80%. Los factores no se multiplican entre sí automáticamente.
- FIS111L no especifica cantidades de experiencias; EF/ECA de Programación tampoco detallan todas sus notas. Se pueden configurar cantidades previstas o ingresar promedios **finales** oficiales. Un promedio provisional se debe simular, no registrar como final.
- En Álgebra, un cero sancionado bloquea la proyección automática del reemplazo hasta aclarar el certamen habilitado.
- En Física se modela una ausencia justificada a certamen. El reglamento no define inequívocamente múltiples ausencias; esos casos requieren coordinación.
- Las situaciones excepcionales, sanciones y autorizaciones institucionales no se inventan ni sustituyen mediante el cálculo.

## Privacidad

Sin cuentas, analítica, cookies de seguimiento ni llamadas a servicios externos desde la aplicación. Las notas se guardan en `localStorage`. Los respaldos JSON incluyen notas reales, simuladas y configuración; el usuario elige cuándo descargarlos o importarlos. No se suben al repositorio ni al servidor.

Los documentos fuente se identifican por título, páginas y huella SHA-256 en la documentación. No se publican copias de documentos adjuntos ni datos personales del estudiante.
