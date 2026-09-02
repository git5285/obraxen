# Handoff: base de activacion publica fail-closed

- thread_id: public-activation-foundation-20260902
- resultado: el manifiesto publico arranca con `approved=false` y sin evidencia. Su validador exige `decisionId`, digest SHA-256 y fecha UTC cuando se solicite indexacion publica.
- integracion: `getPublicPublicationState` y `buildPublicRobotsPolicy` aplican el manifiesto sin importar los datos internos de proyectos. Las rutas de layout, robots y sitemap se entregaran en una candidata posterior.
- verificaciones: 2 pruebas focalizadas PASS; npm run typecheck PASS; npm run check:quality PASS con 280 unitarias, build, 2 E2E de contacto, 89 E2E generales (8 omitidas por entorno) y Lighthouse en /en/, /de/projekte/ y /fr/projets/blitz-bremen/. npm run check:activation conserva NO-GO con 24 bloqueos y publicacion desautorizada.
- decision: la ausencia de una aprobacion externa mantiene `noindex,nofollow` y bloquea indexacion aunque los datos de marca fueran completos.
