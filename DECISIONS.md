# Decisiones de arquitectura (ADR)

> Registro corto de decisiones: **contexto / decisión / consecuencias**.
> Formato ligero. Fecha de referencia: 2026-07-14.
> Estados: `Aceptada` · `Abierta` (aún sin decidir) · `Sustituida`.

---

## ADR-001 — HTML estático sin build

**Estado:** Aceptada · **actualizada 2026-07-14 (disparador 3 ejecutado)**

> **Actualización (2026-07-14).** Se ejecutó el **disparador 3** (SEO real): se
> añadió un **build estático mínimo sin dependencias** (`scripts/build.mjs`) que
> renderiza `dist/` (index.html estático + `css/` + `img/`) desde `src/index.html`
> + `data/brand.json`; Vercel sirve solo `dist/` (`outputDirectory`). `<title>`,
> `meta`, Open Graph y JSON-LD se resuelven **en build** (HTML 100% estático, sin
> fetch ni inyección en runtime). No se adoptó framework: sigue siendo HTML/CSS/JS
> servido, ahora con un paso de render de ~120 líneas de Node puro. Vercel ejecuta
> `node scripts/build.mjs` (`vercel.json`). La decisión original («sin framework»)
> se mantiene; lo que cambia es que ya **sí hay un paso de build**. Disparadores 1
> (colecciones) y 2 (i18n) siguen pendientes → ver [ADR-004](#adr-004--modelo-de-contenido-antes-que-páginas).

**Contexto.** El sitio es una sola página (`index.html`) con estilos y JS
embebidos; los tokens viven en `css/tokens.css` y la identidad en
`data/brand.json`. El alcance actual (un landing con hero, servicios, proceso,
FAQ y contacto) no justifica tooling: no hay rutas, ni colecciones, ni i18n
activo. El despliegue es un push a `main` → Vercel.

**Decisión.** No introducir build ni framework. Mantener HTML/CSS/JS servidos tal
cual, sin dependencias de compilación.

**Consecuencias.**
- (+) Cero mantenimiento de toolchain; edición y despliegue triviales.
- (+) Sin superficie de fallo de build; el fichero servido es el fichero fuente.
- (−→✓) ~~La identidad se inyecta en runtime por JS~~ → **resuelto** por el build
  (ver actualización arriba y ADR-003): cabecera estática.
- (−→✓) ~~Bloques repetidos (nav ×3, etc.) se mantienen a mano~~ → **resuelto**:
  nav, logotipo, CTA y contacto viven como parciales/constantes en `src/`.

**Disparador para migrar** (a generador estático, p. ej. Astro) — basta **uno**:
1. Activar secciones que hoy están `hidden` con contenido real (Proyectos,
   Equipo, Recursos) → aparecen colecciones repetibles.
2. Necesidad de **i18n** para operar en Europa.
3. **SEO real**: antes de quitar el `noindex`, servir las etiquetas de cabecera
   en HTML (build/SSR) en lugar de por JS.

Relacionada con [ADR-004](#adr-004--modelo-de-contenido-antes-que-páginas).

---

## ADR-002 — Hero de vídeo aplazado hasta tener metraje propio de obra

**Estado:** Aceptada

**Contexto.** Un hero en vídeo refuerza el mensaje («tu planta no se detiene»),
pero solo funciona con metraje **propio y real de obra**. El material de stock
contradiría el posicionamiento de oficio («conocemos los suelos porque los hemos
construido») y resta credibilidad en un contexto B2B técnico.

**Decisión.** Aplazar el hero de vídeo. Mantener el hero actual con **fotografía
fija** (`img/hero-nave.jpg`) + gradiente *aurora* animado, hasta disponer de
grabación propia (ver guía de grabación).

**Consecuencias.**
- (+) El hero carga rápido (imagen con `preload`/`fetchpriority`) y no depende de
  producción audiovisual pendiente.
- (+) Coherencia con la regla «solo obra propia».
- (−) Menos impacto que un vídeo.
- El listón para revisar esta decisión es **tener metraje propio de obra**
  aprobado; entonces se evalúa sustituir el fondo del hero.

---

## ADR-003 — Identidad de marca aislada en `brand.json`

**Estado:** Aceptada · **consecuencia negativa (SEO) resuelta 2026-07-14**

**Contexto.** El **nombre comercial está pendiente de decisión** (podría cambiar).
Antes, el nombre, el dominio y los contactos estaban hardcodeados en ~18 puntos
del HTML (título, meta, JSON-LD, logo, footer, formulario…). Renombrar habría
sido una edición dispersa y propensa a error.

**Decisión.** Aislar toda la identidad en un único punto de verdad,
`data/brand.json` (`nombre`, `nombreLegal`, `claim`, `dominio`, `email`,
`telefono`, `direccion`). El nombre no aparece **literalmente en ningún otro
fichero fuente** (`src/` + `data/` → solo `brand.json`). Recolorear = editar solo
`tokens.css`; renombrar = editar solo `brand.json`. La resolución pasó de runtime
(JS) a **build** (`scripts/build.mjs`) al ejecutarse el disparador 3 de ADR-001.

**Consecuencias.**
- (+) Renombrar la empresa es cambiar un fichero (verificado en build: sustitución
  de prueba propagó título, logo, contactos y JSON-LD a la vez).
- (+) Los datos aún no decididos se marcan `«PENDIENTE»` de forma visible.
- (✓ **resuelto 2026-07-14**) ~~Inyección por JS ⇒ crawlers/scrapers sin JS no ven
  el nombre en cabecera~~ → el nombre, `<title>`, `meta`, `og` y JSON-LD se
  resuelven **en build** y viven en el HTML estático servido. Ejecutado el
  **disparador 3 de [ADR-001](#adr-001--html-estático-sin-build)**.
- (✓ **resuelto**) ~~Breve *flash* hasta que resuelve el `fetch`~~ → sin fetch: el
  contenido ya está en el HTML.
- (−) Excepción conocida que persiste: el color del favicon (`%23EA580C`,
  data-URI) no puede leer variables CSS; queda como único literal de color admitido.

---

## ADR-004 — Modelo de contenido antes que páginas

**Estado:** **Aceptada** (cerrada 2026-07-14 · «modelo-primero»)

**Contexto.** Las secciones Proyectos, Equipo y Recursos existen como plantillas
`hidden` con marcadores. La tentación es «rellenar y publicar» página a página.
Pero esas secciones son **colecciones** (N proyectos, N personas, N artículos) y,
con la vocación europea, previsiblemente **multi-idioma**. Maquetar páginas antes
de definir la forma del contenido suele generar reescrituras.

**Decisión.** **Modelo-primero (Opción A).** Antes de construir Proyectos/Equipo/
Recursos, se define el **esquema** de cada colección (p. ej. Proyecto = título,
sector, m², ubicación, problema, solución, resultado, fotos) y las claves **i18n**;
el contenido se renderiza desde datos, no se maqueta a mano. El build introducido
en [ADR-001](#adr-001--html-estático-sin-build) es la base natural: hoy ya
renderiza la navegación desde una única fuente de datos (`NAV` en
`scripts/build.mjs`) y la identidad desde `data/brand.json`; las colecciones
seguirán el mismo patrón (`data/*.json` → plantilla).

*Motivo de cerrarla ahora:* el build ya existe y demuestra el patrón datos→plantilla;
comprometerse con «modelo-primero» evita crear páginas a mano que habría que
rehacer al activar i18n.

**Consecuencias.**
- (+) Cada colección tendrá un esquema explícito y una única fuente de datos.
- (+) i18n encaja desde el principio (claves por idioma), alineado con la vocación europea.
- (−) Activar Proyectos/Equipo/Recursos exige **primero** diseñar el esquema
  (más trabajo inicial que maquetar una página suelta).
- Proyectos/Equipo/Recursos permanecen `hidden` hasta que exista su esquema + datos.

**Siguiente paso concreto:** definir el esquema de la colección **Proyecto** (la de
mayor valor comercial) y su fuente `data/proyectos.json`, y renderizarla con el
build actual.
