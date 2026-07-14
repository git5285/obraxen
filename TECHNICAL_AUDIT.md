# Auditoría técnica

Última verificación: 14 de julio de 2026. Entorno: build estático local,
Lighthouse 13.4.0 y Chromium headless. Es una fotografía de la base previa a
Next.js; no sustituye las pruebas que deberán repetirse durante la migración.

## Resumen

- Problemas críticos pendientes: **0**.
- Problemas de prioridad alta pendientes: **0**.
- Preview deliberadamente cerrada: `noindex,nofollow`, sin dominio y sin
  despliegues Git automáticos.
- Sin dependencias cliente, recursos de terceros, secretos detectados ni errores
  de consola en las rutas comprobadas.

| Página y perfil | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| Portada móvil | 99 | 100 | 100 | 66 | 1,8 s | 0 ms | 0 |
| Portada escritorio | 100 | 100 | 100 | 66 | 0,5 s | 0 ms | 0 |
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
| Activos sin nombres versionados ni caché larga | Medio en visitas repetidas | Hashes del build de Next.js y cabeceras verificadas en Vercel |
| Imágenes sin variantes responsive | Medio en transferencia | `next/image` con dimensiones y `sizes` por composición |
| JavaScript de portada todavía inline | Medio para CSP | Isla cliente externa en la Fase 2; retirar `unsafe-inline` después |
| Sin TypeScript, lint, tests ni CI | Medio para mantenimiento | Fases 1 y 4 del roadmap |
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

Comandos de cierre:

```sh
npm run check
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
