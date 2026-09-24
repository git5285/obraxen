# Home publicada aprobada

Esta aplicación reproduce la web aprobada en https://obraxen.com. Es la fuente
canónica de la Home dentro del repositorio. Leer `../../HOMEPAGE.md` y respetar
la coordinación y los límites de `../../AGENTS.md` antes de editar.

- Editar `public/index.html` y `public/assets/`; no editar
  `app/generated-home-html.js`, que se regenera desde el HTML.
- Ejecutar los comandos desde la raíz del repositorio: `npm run dev`,
  `npm run build`, `npm run start` y `npm run test:published`.
- La implementación anterior `../../src/` fue retirada; su recuperación está en
  `../../docs/LEGACY_RETIREMENT.md`. No copiar automáticamente sus datos internos,
  diseño, APIs o rutas a esta Home.
- El inventario original está en `../../docs/published-site-source.json` y
  las decisiones de integración en `../../docs/PUBLISHED_SITE_RECOVERY.md`.
- Conservar el diseño, textos, imágenes, traducción ES/EN/DE y comportamiento
  aprobado salvo cambios explícitos. La recuperación no autoriza desplegar.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
