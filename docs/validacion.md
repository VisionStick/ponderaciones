# Validación de la primera versión

Verificada el 25 de octubre de 2026 con las reglas 2026-2.1.

## Comprobaciones automáticas

`npm run check`, `npm test` y `npm run build` finalizaron correctamente. Las 88 pruebas incluyen los cuatro ramos: campos vacíos, ceros reales, valores inválidos, notas parciales, mínimos y máximos, límites exactos, restricciones de aprobación y de recuperación, redondeo, descartes, simulaciones y respaldos.

Los resultados esperados de los casos numéricos están derivados de las fórmulas documentadas, no de la salida del motor. Consulta `tests/academic.test.mjs`, `tests/data.test.mjs` y los ejemplos manuales de `docs/reglas-2026-2.md`.

## Comprobaciones en navegador

Todas las notas siguientes son datos ficticios de prueba.

| Prueba | Resultado comprobado |
| --- | --- |
| MAT070, solo C1=60, modo promedio final de controles | 15 puntos definidos; 25% del peso; meta uniforme 53,34 |
| MAT070, C=20/40/50 y PQ=40 | Global 90 aprueba; 89,99 no aprueba |
| Alternar Mis notas / ¿Y si saco…? | La hipótesis no altera la nota real; se identifica la simulación |
| Recargar la página | Las notas reales se conservan en el navegador |
| Álgebra, C=60, Q=80, L1=L2=asistencia=0 | NF=58,5 y aprobación; laboratorio cero no bloquea |
| Física, C=50, Q=T=45, NL=55, α=1 | PS=50; exige Global 62,5; con esa nota NF=55 |
| Programación, C=20/100 y otros grupos=50 | NF=55 y aprobación; no hay un mínimo individual inventado |
| Programación, C=0/100 y otros grupos=50 | Recuperativo 20 aprueba; 19,99 queda bajo 55 |
| Editar Global dígito a dígito | Conserva foco y actualiza el resultado y su mensaje |
| Pantalla de escritorio y marco móvil de 390px | Navegación y campos utilizables; sin desbordamiento horizontal de la página |

La captura `vista-previa.jpg` muestra un ejemplo simulado. No contiene notas de un estudiante. La importación y exportación se verifican mediante pruebas del formato de datos; no se hizo una prueba de carga/descarga de archivos desde el navegador.

## Publicación

Se verificó `https://visionstick.github.io/ponderaciones/` en un navegador sin sesión de GitHub: carga la aplicación y el ejemplo simulado calcula 47,5 puntos acumulados, 75% del peso definido y una meta de 30 en Certamen 3. Las comprobaciones también finalizaron correctamente en GitHub Actions.
