# Web corporativa — reparación de pavimentos industriales

Web estática (HTML + CSS + GSAP) de reparación de pavimentos industriales.
**Build mínimo sin dependencias**: `src/index.html` + `data/brand.json` →
`dist/` (100% estático) mediante `scripts/build.mjs` (Node puro).

## Estructura

- `src/index.html` — **plantilla** (maquetación y JS); usa placeholders
  `{{brand.*}}` y parciales `{{> …}}`. No contiene el nombre literal.
- `src/partials/` — bloques reutilizables (`logo`, `cta`, `capa-cta`)
- `scripts/build.mjs` — render estático (sin dependencias)
- `css/tokens.css` — **único punto de verdad del color y la tipografía** (OKLCH)
- `data/brand.json` — **único punto de verdad de la identidad de marca**
  (nombre, razón social, claim, dominio, email, teléfono, dirección)
- `img/` — fotografías optimizadas (JPEG progresivo)
- `dist/` — **salida generada** por el build (`index.html` + `css/` + `img/`).
  Es lo único que se sirve; está en `.gitignore` (lo regenera el build).

## Build

```sh
node scripts/build.mjs      # genera dist/ desde src/ + data/ + css/ + img/
```

`<title>`, `meta`, Open Graph y JSON-LD se resuelven **en build**: el HTML servido
es completamente estático (sin fetch ni inyección de marca en runtime).

Como `dist/` es lo único servido (ver `outputDirectory` en `vercel.json`), los
ficheros de trabajo (`src/`, `scripts/`, `data/`, `*.md`) **no se publican**:
devuelven 404. `.vercelignore` complementa esto excluyendo `*.md`/`.gitignore`
del paquete de subida (nunca `src/`/`scripts/`/`data/`: son entradas del build).

## Identidad de marca (punto único de verdad)

- **Renombrar la empresa** → editar solo `data/brand.json` y reconstruir. El
  nombre, el logo, los contactos, el `<title>`, las metaetiquetas y el JSON-LD se
  resuelven en build a partir de ese fichero. El nombre no aparece literalmente en
  ningún otro fichero fuente (`src/` + `data/` → solo `brand.json`).
- **Recolorear o cambiar la tipografía** → editar solo `css/tokens.css`.
- **Navegación** → una única fuente (`NAV` en `scripts/build.mjs`) se renderiza a
  las tres barras (móvil, sticky, hero).
- Los datos aún sin definir usan el marcador `«PENDIENTE»` en `brand.json`.

## Despliegue

Conectado a Vercel con despliegue automático: cada push a `main` ejecuta
`node scripts/build.mjs` (`vercel.json`) y publica la salida estática.

## Pendiente antes de producción

- [ ] Rellenar en `data/brand.json` los campos `«PENDIENTE»` (razón social,
      teléfono, dirección) y confirmar dominio/email definitivos
- [ ] Rellenar placeholders del HTML: años de experiencia (+XX), nombre del
      fundador, secciones ocultas
- [ ] Conectar el formulario de contacto a un backend (p. ej. Formspree)
- [ ] Quitar `noindex` cuando se completen los placeholders (SEO ya es estático)
- [ ] Secciones ocultas (`hidden`): Proyectos, Equipo y Recursos — activar según
      el modelo de contenido (ver ADR-004 en `DECISIONS.md`)

## Decisiones

Ver `DECISIONS.md` (ADR-001 build estático mínimo · ADR-002 hero de vídeo
aplazado · ADR-003 identidad en `brand.json` · ADR-004 modelo-primero).
