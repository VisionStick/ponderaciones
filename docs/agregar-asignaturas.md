# Agregar o actualizar una asignatura

1. Leer el reglamento completo y registrar título, semestre, páginas, fórmula, mínimos, excepciones y ambigüedades. No copiar reglas de otro curso por semejanza.
2. Añadir una entrada con identificador estable en `COURSES` (`src/courses.js`). Definir textos, grupos, configuración y fuentes. Separar notas individuales de promedios finales oficiales.
3. Añadir su esquema de campos en `modelFor`. Un campo vacío representa `null`; nunca representa cero ni ausencia sin justificación.
4. Añadir su evaluación exacta en `evaluate` (`src/engine.js`), incluyendo el orden de las reglas. No decidir con promedios redondeados.
5. Definir las variantes necesarias ante requisitos desconocidos. No convertir una interpretación en una regla definitiva sin evidencia. El simulador debe declarar las condiciones.
6. Revisar el buscador de mínimos: supone que la condición de aprobación es monótona al aumentar la nota buscada. Si una asignatura no cumple esa propiedad, usar un método específico y probarlo.
7. Añadir pruebas con resultados esperados derivados independientemente: vacío, una nota, notas parciales, todas mínimas/máximas, límites exactos, Global permitido/no permitido, reemplazos que empeoran y entradas inválidas.
8. Revisar interfaz real y simulada, teclado, teléfono, persistencia, importación/exportación y textos de aprobación. La interfaz compartida debe conservar los casos existentes.
9. Ejecutar `npm run check`, `npm test` y `npm run build`.

## Versiones y cambios de reglas

El identificador de regla actual es `2026-2.3`. Un cambio académico que altera resultados debe cambiar `RULE_VERSION` y documentarse. La importación admite la versión actual y migraciones explícitas desde 2026-2.1 y 2026-2.2: conserva notas e hipótesis, mantiene el laboratorio combinado anterior de Física y conserva taller/η de MAT071 como datos históricos, sin reinterpretarlos como controles/factor L. Al cargar desde almacenamiento se avisa del cambio de reglas. Las demás versiones se rechazan. Agregar una migración explícita con pruebas si se desea conservar datos entre versiones. Mantener los identificadores de evaluaciones estables dentro de una versión.

Los cambios de diseño o mensajes que no modifican reglas pueden conservar la versión académica. Nunca almacenar credenciales ni notas personales de usuarios en el código, fixtures, issues o capturas del proyecto.

## Mensajes

- “Puedes respirar” exige aprobación real confirmada o garantizada en el peor caso calculable, con los requisitos verificados.
- Con hipótesis visibles: “En este escenario…”. Nunca presentar una simulación como resultado real.
- La necesidad de Global no equivale a elegibilidad confirmada. Mostrar las condiciones que faltan.
- En Global voluntario, advertir que rendirlo puede reducir una nota que ya aprobaba.
- No asignar probabilidades (“probablemente”) ni umbrales de “crítico” que el reglamento no contiene.

## Combinaciones y factores

`src/scenarios.js` genera casos sin escribir notas reales. Cada hipótesis adicional debe ser visible; toda fila ofrecida debe volver a pasar las reglas del motor. El factor L de MAT071 usa un validador propio de 0,9 a 1,1: no es una nota 0–100. No usar 1 como valor implícito. El validador positivo sin tope se conserva únicamente para el campo η histórico.

El programa anterior de MAT071 fue reemplazado por el usuario. La versión actual tiene certámenes de igual peso, por lo que ya no tiene la discontinuidad por cambio de ponderación del reemplazo. Las pruebas deben seguir las fuentes vigentes; conservar el historial de reglas en Git, sin dejar fixtures de fuentes descartadas como expectativas actuales. La pauta de laboratorio con encabezado MAT061 requiere elección explícita del modo confirmado.
