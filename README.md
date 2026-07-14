# Web corporativa — reparación de pavimentos industriales

Web estática (HTML + CSS + JavaScript nativo) de reparación de pavimentos industriales.
**Build mínimo sin dependencias**: `src/index.html` + `data/brand.json` →
`dist/` (100% estático) mediante `scripts/build.mjs` (Node puro).

> **Identidad pendiente:** “RemainOn” es únicamente una referencia interna
> temporal heredada del nombre de la carpeta. No es la marca, no es una opción
> definitiva y el build impide utilizarla como nombre público. La empresa aún no
> está constituida; la forma jurídica prevista es una sociedad limitada. El
> naming y la constitución están **aplazados por decisión de los socios**.

## Estructura

- `src/index.html` — **plantilla** (maquetación y JS); usa placeholders
  `{{brand.*}}` y parciales `{{> …}}`. No contiene el nombre literal.
- `src/partials/` — bloques reutilizables (`logo`, `cta`, `capa-cta`)
- `scripts/build.mjs` — render estático (sin dependencias)
- `css/tokens.css` — **único punto de verdad del color y la tipografía** (OKLCH)
- `data/brand.json` — **único punto de verdad de la identidad de marca**
  (nombre, razón social, claim, dominio, contactos, fundador y estado de publicación)
- `data/proyectos.json` — seis proyectos ejecutados con magnitudes confirmadas y
  reportaje fotográfico publicable
- `data/proyectos.borrador.json` — extracción detallada de presupuestos y registro
  interno de confirmaciones; no se sirve públicamente
- `data/proyectos.schema.json` — contrato de datos multiidioma de cada proyecto
- `src/legal/` — borradores de aviso legal y privacidad; se generan como rutas
  estáticas y permanecen `noindex` mientras el sitio esté en preview
- `img/` — fotografías optimizadas para web; los originales se mantienen fuera del repo
- `dist/` — **salida generada** por el build (`index.html` + `css/` + `img/`).
  Es lo único que se sirve; está en `.gitignore` (lo regenera el build).

## Build

```sh
npm run build      # genera dist/ desde src/ + data/ + css/ + img/
npm run check      # build + validación de datos, SEO, scripts, anclas y activos
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
- Los datos aún sin definir usan `null` y no se renderizan. `publicar: true`
  activa la validación estricta y exige identidad legal, contacto, políticas y
  confirmación expresa de revisión legal (`legalRevisionAprobada`).
- **Proyectos** → se publican automáticamente al añadir casos válidos a
  `data/proyectos.json`; la navegación aparece solo cuando la colección tiene datos.

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

## Pendiente antes de producción

**Aplazado por decisión de los socios:**

- [ ] Elegir el nombre comercial definitivo
- [ ] Constituir la sociedad limitada e incorporar razón social, CIF y, cuando
      corresponda, datos registrales

**Resto del cierre de producción:**

- [ ] Completar fundador, dominio, email, teléfono/WhatsApp y URLs legales
- [x] Incorporar domicilio y más de 10 años de experiencia acumulada del equipo
- [x] Incorporar cobertura en toda la UE, mercados principales, horario de lunes a
      viernes de 9:00 a 18:00,
      primera respuesta inferior a 48 h y equipos propios
- [x] Sustituir afirmaciones absolutas por formulaciones condicionadas y verificables
- [x] Eliminar dependencias externas de Google Fonts, GSAP y cdnjs; la preview usa
      tipografías del sistema y animación CSS/JavaScript nativo
- [x] Incorporar seis proyectos ejecutados a `data/proyectos.json`
- [x] Confirmar ejecución, unidades principales, ubicación de obra y permiso para
      identificar clientes
- [ ] Obtener resultados operativos verificables —plazo real, continuidad, problema
      resuelto o indicador de cierre— antes de publicar esas afirmaciones
- [ ] Activar el formulario cuando exista un email; hasta entonces muestra un estado
      de preparación sin campos ni enlaces ficticios
- [x] Mientras no exista ningún canal de contacto, los CTA llevan a los proyectos
      reales; al confirmar email, teléfono o WhatsApp cambian automáticamente a
      «Pide una evaluación» y enlazan con Contacto
- [ ] Completar y someter a revisión profesional `aviso-legal` y `privacidad`;
      después establecer `legalRevisionAprobada: true`
- [ ] Cambiar `publicar` a `true` únicamente después de completar los puntos anteriores;
      el build sustituirá `noindex,nofollow` por `index,follow`

## Decisiones

Ver `DECISIONS.md` (ADR-001 build estático mínimo · ADR-002 hero de vídeo
aplazado · ADR-003 identidad en `brand.json` · ADR-004 modelo-primero).
