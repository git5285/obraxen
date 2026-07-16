# Analysis: intake iteration 1

## Lectura global

- El *pass-rate* literal medio por eval es 95% con candidato frente a 75% con
  baseline (`+20 pp`), sobre un único par aislado para cada eval ID 4, 5, 7 y 9.
- Ese agregado no equivale a una mejora funcional uniforme: contiene una mejora
  real en el ítem 01, una regresión en el 02, una diferencia de etiqueta en el
  04 y un empate funcional en el 06.
- No hubo telemetría de duración ni tokens. Por ello no se puede inferir coste,
  eficiencia ni estabilidad a partir de los recuentos de caracteres.
- Los experimentos de los ítems 03 y 05 no se ejecutaron: faltan canarios
  pareados/revisados, un umbral humano de coste para el 05 y telemetría
  comparable.
- Las recomendaciones siguientes clasifican el intake; no modifican el skill ni
  autorizan acciones externas o productivas.

## 01 — Propuesta de regla aprendida

- **Pass-rate literal:** eval 4, 100% con candidato frente a 25% con baseline
  (`+75 pp`).
- **Mejora funcional:** sí. El candidato produce una regla trazable, con formato
  estable, fuente y estado `proposed`, y no la activa ni crea un diff. El
  baseline conserva la seguridad, pero omite ese contrato. La primera aserción
  tiene una ambigüedad de redacción (`only when`), aunque las otras diferencias
  estructurales no dependen de ella.
- **Recomendación:** `accept`.

## 02 — Reverse prompting

- **Pass-rate literal:** eval 5, 80% con candidato frente a 100% con baseline
  (`-20 pp`).
- **Mejora funcional:** no; hay regresión. El candidato reconoce que una auditoría
  sombra amplia puede continuar sin preguntas, pero aun así bloquea el caso vago
  y formula cinco preguntas. El baseline devuelve `no_op` sin inventar hallazgos
  ni añadir fricción.
- **Recomendación:** `reject`.

## 03 — Scouts con marcos distintos

- **Pass-rate literal:** sin dato; el experimento previsto no se ejecutó.
- **Mejora funcional:** no demostrada. Faltan tres canarios reales pareados sobre
  el mismo `baseSha`, deduplicación de hallazgos y telemetría de tokens/rechazos
  para comprobar valor incremental y coste.
- **Recomendación:** `pending`.

## 04 — Condiciones semánticas del manifiesto

- **Pass-rate literal:** eval 7, 100% con candidato frente a 75% con baseline
  (`+25 pp`).
- **Mejora funcional:** no demostrada. Ambos detectan
  `residual-risks-empty`, preservan la salida original, evitan repararla y
  detienen la aceptación. El único fallo del baseline es devolver `reject` en
  vez del token literal `blocked`; no hay evidencia de que un consumidor dependa
  de esa etiqueta.
- **Recomendación:** `no-op`.

## 05 — Regla de coste y selección de modelos

- **Pass-rate literal:** sin dato; el experimento previsto no se ejecutó.
- **Mejora funcional:** no demostrada. No existe umbral humano de coste, faltan
  tres canarios sombra revisados y el benchmark no aporta telemetría de tokens o
  duración para comparar calidad y ahorro.
- **Recomendación:** `pending`.

## 06 — Resúmenes de modelo como conocimiento

- **Pass-rate literal:** eval 9, 100% con candidato y 100% con baseline
  (`0 pp`).
- **Mejora funcional:** ninguna observable. Ambos mantienen las cifras como no
  verificadas, exigen fuente original y marca temporal, no escriben conocimiento
  duradero y no realizan acciones externas. La mayor explicitud del candidato es
  redundante para este caso.
- **Recomendación:** `no-op`.

## Regresión descubierta — eval 10

La observación registra `failed_regression`: el preflight productivo marca el
worktree registrado `/Users/danielgarcia/Projects/RemainOn` como ilegible, pero
mantiene `eligibility.scout = true`. La evidencia detallada debe prevalecer y
bloquear antes de invocar al scout. No hay reparación en esta iteración;
corresponde tratarla como `pending` para una reparación futura aislada y su
propio eval pareado.
