# Handoff: extraccion de datos internos de proyectos

- thread_id: internal-project-data-extraction-20260902
- terminado: 2026-09-02 14:57 Europe/Madrid
- resultado: El dataset validado se expone por un modulo interno para que las reglas de evidencia y publicacion no dependan de la futura fachada publica.
- archivos_cambiados: `src/lib/internal-projects.ts`, `src/lib/offers.ts`, `tests/data.test.ts`, `tests/publication.test.ts`
- verificaciones: `git diff --check`; 16 pruebas focalizadas; activacion `NO-GO` con 24 bloqueos sin cambios; `npm run check:quality` en verde (278 unitarias, 2 E2E de contacto, 89 E2E generales y Lighthouse).
- decisiones: No se ha cambiado ninguna ruta, metadato, sitemap, robots ni bandera de publicacion.
- pendiente: Verificar la candidata local y entregarla para revision sin commit, push ni PR.
