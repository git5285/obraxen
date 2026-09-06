# Handoff: muestra de calentamiento de Lighthouse

- Base revisada: `925fc49c6fd921dc6e2b01c447a93c583f0db40f`.
- Evidencia: los runs `34032680145` y `34033320719` fallaron en la primera
  navegación fría de `/en/` y mejoraron en muestras posteriores; el mismo SHA
  había pasado en el run `34032444406`.
- Decisión: ejecutar una muestra de calentamiento excluida del resultado. La
  primera medición válida conserva los mismos presupuestos; si falla, la puerta
  decide por la mediana de tres mediciones válidas.
- Límite: no se modifica ningún presupuesto ni la activación pública.
