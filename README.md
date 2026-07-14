# Web corporativa — reparación de pavimentos industriales

Web estática (HTML + CSS + JavaScript nativo) de reparación de pavimentos industriales.
**Build mínimo sin dependencias**: plantillas `src/` + datos `data/` →
`dist/` (100% estático) mediante `scripts/build.mjs` (Node puro).

La base actual es la referencia funcional y visual. Las Fases 1 y 2 ya incorporan
una portada paralela con Next.js App Router, Server Components, TypeScript,
validacion Zod, ESLint y Vitest. La migracion por fases, sus puertas de calidad y
el modelo de consentimiento se detallan en [`ROADMAP.md`](ROADMAP.md). Hasta que
proyectos y legales alcancen paridad, el build estatico sigue siendo la salida
principal y no se despliega la base Next.js.

> **Identidad pendiente:** “RemainOn” es únicamente una referencia interna
> temporal heredada del nombre de la carpeta. No es la marca, no es una opción
> definitiva y el build impide utilizarla como nombre público. La empresa aún no
> está constituida; la forma jurídica prevista es una sociedad limitada. El
> análisis de naming puede continuar como investigación, pero la selección,
> integración y constitución siguen pendientes de decisión expresa.

## Estructura

- `src/index.html` — **plantilla** de la portada; usa placeholders
  `{{brand.*}}` y parciales `{{> …}}`. No contiene el nombre literal.
- `src/projects.html` — plantilla del archivo `/proyectos/`; presenta cada obra
  como un expediente de evidencia generado desde datos
- `src/project.html` — plantilla común de los seis casos individuales
- `src/partials/` — bloques reutilizables (`logo`, `cta`, `capa-cta`) y el
  comportamiento cliente aislado de la portada (`home-script`)
- `scripts/build.mjs` — render estático (sin dependencias)
- `src/app/` — App Router, metadata, robots y portada migrada con paridad visual
- `src/components/` — secciones servidoras de portada y una unica isla cliente
  para menu movil y navegacion sticky
- `src/lib/` — carga tipada de identidad, proyectos, ofertas y estado de
  publicacion, ademas del modelo de portada e imports responsive de imagen
- `tests/` — reglas de datos, publicacion, portada y rutas Next.js
- `css/tokens.css` — **único punto de verdad del color y la tipografía** (OKLCH)
- `css/home.css` — estilos propios de la portada, separados de su estructura HTML
- `css/projects.css` — estilos propios del hub técnico de proyectos
- `data/brand.json` — **único punto de verdad de la identidad de marca**
  (nombre, razón social, claim, dominio, contactos, fundador y estado de publicación)
- `data/proyectos.json` — seis proyectos ejecutados con magnitudes confirmadas y
  reportaje fotográfico publicable
- `data/proyectos.borrador.json` — extracción detallada de presupuestos y registro
  interno de confirmaciones; no se sirve públicamente
- `data/proyectos.schema.json` — contrato de datos multiidioma de cada proyecto
- `data/ofertas.json` — borradores internos de oferta y sus condiciones de salida;
  existir en este fichero no vuelve una oferta publicable
- `src/legal/` — borradores de aviso legal y privacidad; se generan como rutas
  estáticas y permanecen `noindex` mientras el sitio esté en preview
- `img/` — fotografias optimizadas para web; los originales se mantienen fuera
  del repo. Las copias JPEG redundantes de los proyectos se retiraron despues de
  validar los 18 WebP publicables.
- `dist/` — **salida generada** por el build (portada, hub, seis casos, legales y activos).
  Es lo único que se sirve; está en `.gitignore` (lo regenera el build).

## Build

```sh
npm run build      # genera dist/ desde src/ + data/ + css/ + img/
npm run check      # build + validación de datos, SEO, scripts, anclas y activos
npm run check:next # lint + tipos + tests + build de la fundacion Next.js
npm run check:all  # valida en conjunto la base estatica y la fundacion Next.js
```

El entorno reproducible de la fundacion usa Node `24.x` (`.nvmrc`).
`npm run dev:next` abre el App Router localmente y `npm run build:next` lo compila
sin cambiar `vercel.json` ni sustituir la salida `dist/`.

La portada Next replica las ocho secciones y seis casos de la referencia, usa 24
imagenes reales y conserva `data/brand.json` como puerta de identidad y contacto.
La CSP ya elimina `unsafe-inline` de estilos; `script-src` lo mantiene de forma
temporal por el bootstrap estatico de App Router y se resolvera junto con la
politica de hashes o nonces de la Fase 4.

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
- Los datos aún sin definir usan `null` y no se renderizan. `publicar: true`
  activa la validación estricta y exige identidad legal, contacto, políticas y
  confirmación expresa de revisión legal (`legalRevisionAprobada`).
- **Proyectos** → se publican automáticamente al añadir casos válidos a
  `data/proyectos.json`; cada registro genera su resumen en portada, su expediente
  en `/proyectos/` y su ruta `/proyectos/{slug}/` con breadcrumbs y navegación
  entre casos. Mientras no haya contacto, navegación y CTA apuntan al hub.

### Retomar la identidad cuando esté decidida

No hay que modificar plantillas ni buscar textos repartidos por el proyecto. El
proceso queda dividido en tres cambios sobre `data/brand.json`:

1. **Nombre acordado:** completar `nombre`; después podrán definirse `dominio`,
   `email`, `telefono` y/o `whatsapp`.
2. **SL constituida:** completar `nombreLegal` y `cif`, y cambiar
   `empresaConstituida` a `true`.
3. **Publicación aprobada:** tras revisar los textos legales, cambiar
   `legalRevisionAprobada` y `publicar` a `true` y ejecutar `npm run check`.

El build bloqueará la publicación si falta cualquiera de esos datos, si se intenta
usar “RemainOn” como nombre o si la sociedad continúa sin constituir.

## Despliegue

El proyecto permanece conectado a Vercel, pero los despliegues Git automáticos
están desactivados en `vercel.json` mientras `brand.publicar` sea `false`. La
versión pública antigua fue retirada el 14 de julio de 2026. Cuando se complete
la identidad y se apruebe la publicación, el despliegue se reactivará de forma
expresa después de ejecutar `npm run check`.

## Documentación

Cada tema tiene una única autoridad; los demás documentos enlazan en lugar de
copiarla:

| Tema | Fuente |
|---|---|
| Dirección de empresa, mercado y oferta | `STRATEGY.md` |
| Copy permitido y evidencia pendiente | `CONTENT_AUDIT.md` |
| Rutas y crecimiento del sitio | `SITE_ARCHITECTURE.md` |
| Sistema visual | `DESIGN.md` |
| Decisiones técnicas | `DECISIONS.md` |
| Estado técnico medido | `TECHNICAL_AUDIT.md` |
| Migración y entrega | `ROADMAP.md` |
| Publicación legal | `LEGAL_CHECKLIST.md` |
| Selección y límites fotográficos | `PHOTO_AUDIT.md` |

`AGENTS.md`, `COORDINATION.md` y `.coordination/` son documentación operativa de
las tareas; no definen producto ni contenido público.

## Pendiente antes de producción

La lista operativa completa vive en [`LEGAL_CHECKLIST.md`](LEGAL_CHECKLIST.md) y
la secuencia técnica en [`ROADMAP.md`](ROADMAP.md). La publicación continúa
bloqueada hasta completar, como mínimo:

- nombre, sociedad, CIF y dominio;
- canales de contacto reales;
- revisión profesional de aviso legal y privacidad;
- consentimiento antes de GA4 o Clarity;
- resultados y afirmaciones respaldados por evidencia aplicable;
- auditoría final y autorización expresa para publicar.

## Decisiones

Ver [`DECISIONS.md`](DECISIONS.md): base estática, hero con evidencia propia,
identidad centralizada, modelo de contenido y migración progresiva a Next.js.
