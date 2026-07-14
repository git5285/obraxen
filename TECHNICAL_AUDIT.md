# Auditoría técnica

Última verificación: 14 de julio de 2026. Entorno: build estático local, portada
Next.js 16.2.10, Lighthouse 13.4.0 y Chromium headless. La Fase 2 ya demuestra
paridad de portada; el hub, casos y legales permanecen en la base estatica hasta
su migracion.

## Resumen

- Problemas críticos pendientes: **0**.
- Problemas de prioridad alta pendientes: **0**.
- Preview deliberadamente cerrada: `noindex,nofollow`, sin dominio y sin
  despliegues Git automáticos.
- Sin recursos de terceros, secretos detectados ni errores de consola en las
  rutas comprobadas; el unico componente cliente propio es la navegacion.

| Página y perfil | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| Portada estática móvil | 99 | 100 | 100 | 66 | 1,8 s | 0 ms | 0 |
| Portada estática escritorio | 100 | 100 | 100 | 66 | 0,5 s | 0 ms | 0 |
| Portada Next móvil | 98 | 100 | 100 | 66 | 2,47 s | 0 ms | 0 |
| Portada Next escritorio | 100 | 100 | 100 | 66 | 0,58 s | 0 ms | 0 |
| Hub móvil | 100 | 100 | 100 | 66 | 1,1 s | 0 ms | 0 |
| Caso Blitz móvil | 100 | 100 | 100 | 66 | 1,0 s | 0 ms | 0 |

El 66 de SEO es intencionado. No debe perseguirse una puntuación de publicación
mientras falten identidad, dominio, revisión legal y autorización expresa.

## Correcciones incorporadas

### Imágenes

- Las 18 evidencias se sirven como WebP, con un máximo de 1.400 px y calidad 82.
- Peso conjunto: 1.702.898 bytes frente a 7.209.017 bytes de las copias previas,
  una reducción del 76 %.
- Se retiraron 18 JPEG redundantes y `img/valoracion.jpg`, que no tenía referencias.
- `dist/img` pasó de 9.308.702 a 2.057.670 bytes, un 77,9 % menos.
- Los originales maestros permanecen fuera del repositorio y se identifican en
  [`PHOTO_AUDIT.md`](PHOTO_AUDIT.md).

### Rendimiento y estructura

- Las fotografías bajo el pliegue ya no usan carga prioritaria. El caso móvil
  pasó de LCP 4,4 s y rendimiento 85 a LCP 1,0 s y rendimiento 100.
- El CSS de portada se trasladó a `css/home.css` y el comportamiento cliente a
  `src/partials/home-script.html`; `src/index.html` bajó de 870 a 312 líneas.
- La separación mantuvo la portada en 99/100 de rendimiento móvil/escritorio y
  mejoró su LCP móvil de 2,0 a 1,8 s.
- La portada Next conserva las ocho secciones y seis casos en Server Components;
  24 imagenes usan imports versionados y variantes responsive. El hero mantiene
  el JPEG original de 107 KiB porque la medicion repetida fue mejor que la ruta
  de optimizacion bajo demanda: 98/100 y LCP 2,47 s en movil.

### Accesibilidad

- La numeración 01–03 usa `--brand-primary-dark`; los casos pasaron de 96 a 100.
- Los seis mosaicos y seis enlaces textuales del hub incluyen ahora su etiqueta
  visible en el nombre accesible. Lighthouse devuelve 100 y
  `label-content-name-mismatch` afecta a 0 elementos.
- El menú móvil conserva foco inicial, trampa de foco, cierre con `Escape` y
  restauración del foco.

## Trabajo pendiente

| Deuda | Riesgo actual | Resolución prevista |
|---|---|---|
| Activos de rutas estaticas sin hash | Medio en visitas repetidas | Sustituirlos al migrar las rutas en Fase 3; portada Next ya usa hashes |
| Imágenes de hub y casos sin variantes responsive | Medio en transferencia | Migrarlas con dimensiones y `sizes` en Fase 3; portada completada |
| `script-src` conserva `unsafe-inline` en Next | Medio para CSP | Definir hashes de build o nonces en Fase 4; `style-src` ya no lo necesita |
| Sin CI ni checks remotos obligatorios | Medio para mantenimiento | Fase 4 del roadmap; TypeScript, lint y tests locales ya completados |
| Minificación CSS pendiente | Bajo; ahorro estimado de 3–5 KiB por ruta | Resolver con el toolchain nuevo, sin añadir ahora una dependencia aislada |
| Reflow de navegación de unos 34 ms | Bajo | Simplificar la isla cliente y volver a perfilar |

La migración a Next.js se justifica por mantenibilidad, tipado, pruebas,
versionado, imágenes, metadatos y consentimiento; no por un problema de velocidad
de la base actual.

## Verificación funcional

- Diez rutas generadas responden 200 y contienen un único `h1`.
- Cero enlaces internos o imágenes rotas.
- Cero overflow horizontal a 390 px y 1.440 px.
- Cero errores de JavaScript, consola, red o recursos.
- Hub y seis casos enlazados en ambas direcciones.
- Las 18 fotografías cargan correctamente al hacer scroll.
- Cabeceras CSP, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy` y `Permissions-Policy` están preparadas para el hosting.
- La portada Next supera ESLint, TypeScript estricto, 17 tests, build de
  produccion y smoke test Chromium en 390 y 1.440 px.
- `/`, `/robots.txt` y una ruta 404 de Next.js responden como se espera, sin
  errores de consola, overflow ni exposicion accidental a indexacion.
- Next y la referencia miden exactamente 13.701 px de alto en movil y 8.117 px
  en escritorio, con 8 secciones, 6 casos y 24 imagenes cargadas correctamente.
- El menu abre, atrapa foco, cierra con `Escape`, restaura el disparador y enfoca
  el destino al navegar; `style-src` excluye `unsafe-inline` sin violaciones CSP.

Comandos de cierre:

```sh
npm run check
npm run check:next
node --check scripts/build.mjs
node --check scripts/check.mjs
git diff --check
```

## Puerta de publicación

Antes de retirar `noindex` deben existir y validarse:

1. nombre comercial, sociedad, CIF y dominio;
2. email y/o teléfono o WhatsApp reales;
3. textos legales revisados profesionalmente;
4. consentimiento previo a GA4 y Clarity;
5. canonical, sitemap, HTTPS, HSTS y cabeceras sobre el hosting real;
6. auditoría final de rutas, formularios, accesibilidad, rendimiento y privacidad;
7. autorización expresa de publicación.

La ejecución por fases está en [`ROADMAP.md`](ROADMAP.md). Las reglas visuales
viven en [`DESIGN.md`](DESIGN.md) y no se duplican en esta auditoría.
