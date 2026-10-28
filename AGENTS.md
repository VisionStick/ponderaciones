# Working on Rumbo

This repository is a static Spanish-language academic calculator. Preserve per-course rules and do not copy requirements across subjects. The academic contract and unresolved ambiguities are in `docs/reglas-2026-2.md`.

- Read source rules before changing academic behavior.
- Use exact rational arithmetic for grading thresholds; display rounding must never decide pass/fail.
- Missing grades are `null`, not zero. Real and simulated grades must stay distinct.
- Do not invent eligibility, counts, attendance combination, penalties, or rounding policies.
- Keep relative URLs so both domain-root hosting and GitHub Pages `/ponderaciones/` work.
- Never commit student grades, credentials, browser storage exports, or QA-only pages.
- Run `npm run check`, `npm test`, and `npm run build` after meaningful implementation changes.
- Add independent numerical fixtures when adding or changing academic rules. Preserve existing edge cases.
- Read `docs/agregar-asignaturas.md` before adding courses or migrating saved state.

- User corrections are explicitly attributed in the academic contract; do not silently revert54.5/49.5 or apply them to separate minimum requirements.
- MAT071 now uses three equally weighted certámenes and three controles (75%/25%), a bounded lab factor and a voluntary Global. The 2018 program was explicitly superseded by the user on 2026-10-27. Never reapply its old weights or eligibility.
- One new lab screenshot is labeled MAT061: use its grade breakdown only in the explicitly confirmed mode; otherwise use MAT071’s official L factor.
- Keep migrations explicit and preserve both real and simulated notes, including legacy combined Physics lab inputs.
