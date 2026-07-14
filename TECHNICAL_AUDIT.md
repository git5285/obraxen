# Auditoría técnica integral

Fecha: 14 de julio de 2026. Entorno medido: build estático local servido por
HTTP, Lighthouse 13.4.0 y Google Chrome headless. No se realizó ningún despliegue.

## Resultado

| Página y perfil | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---:|---:|---:|---:|
| Portada móvil | 99 | 100 | 100 | 66 |
| Portada escritorio | 100 | 100 | 100 | 66 |
| Caso móvil, antes | 85 | 96 | 100 | 66 |
| Caso móvil, después | 100 | 100 | 100 | 66 |
| Caso escritorio, después | 100 | 100 | 100 | 66 |

El 66 de SEO es deliberado: la preview permanece en `noindex,nofollow`,
`robots.txt` bloquea rastreo y todavía no existe dominio para generar canonical o
sitemap. No debe corregirse hasta completar la identidad, la revisión legal y la
autorización expresa de publicación.

## Problemas críticos

No se detectaron problemas críticos.

## Prioridad alta — corregida

### Rendimiento: fotografía bajo el pliegue con prioridad alta

- **Impacto:** el primer caso precargaba una fotografía situada a 1.287 px del
  inicio. En móvil competía con los estilos y retrasaba el H1, que era el LCP.
- **Medición inicial:** LCP 4,4 s; rendimiento 85.
- **Corrección:** retirada de `preload`, `loading="eager"` y
  `fetchpriority="high"` en las fotografías de los casos. Todas cargan al
  aproximarse al viewport.
- **Resultado:** LCP 1,0 s; rendimiento 100; TBT 0 ms; CLS 0.

### Accesibilidad: contraste de los números 01–03

- **Impacto:** el naranja principal sobre blanco ofrecía 3,55:1 para texto de
  16 px, por debajo de WCAG AA.
- **Corrección:** uso de `--brand-primary-dark` en la numeración narrativa.
- **Resultado:** accesibilidad Lighthouse de los casos 96 → 100.

## Prioridad media — optimizada

### Entrega de imágenes

- Se generaron 18 derivados WebP con un máximo de 1.400 × 1.400 px y calidad 82.
- Peso conjunto publicado: 7.209.017 → 1.702.898 bytes, reducción del 76 %.
- Los JPEG originales se conservan intactos como fuente; el HTML sirve WebP.
- El build comprueba que todos los casos publicados referencien WebP.

## Prioridad media — pendiente de publicación

- **Caché:** el servidor local no aplica una política de caché larga. Debe
  definirse con versionado de activos para evitar servir archivos obsoletos.
- **CSP:** la política ya bloquea objetos, iframes externos y orígenes no
  autorizados, pero mantiene `'unsafe-inline'` porque portada, CSS crítico y
  JavaScript siguen embebidos. Puede eliminarse al externalizar esos bloques.
- **HTTPS/HSTS:** solo puede verificarse cuando exista dominio y despliegue
  autorizado.
- **CSS:** Lighthouse estima un ahorro de 3–5 KiB por minificación. No se introduce
  una dependencia de build para un ahorro marginal mientras el sitio siga en preview.
- **SEO público:** canonical, sitemap e indexación continúan bloqueados por diseño.

## Accesibilidad y funcionamiento manual

- Enlace «Saltar al contenido» operativo.
- Menú móvil accesible por teclado, con foco inicial, trampa de foco, cierre con
  `Escape` y restauración del foco al disparador.
- El foco pasa a la sección elegida al cerrar el menú.
- Jerarquía de encabezados y nombres accesibles de enlaces correctos.
- Seis rutas de casos operativas; tres fotografías por caso.
- Las 18 fotografías WebP cargan correctamente al hacer scroll.
- Sin desbordamiento horizontal en 390 px ni 1.440 px.
- Sin errores de consola, JavaScript, red ni recursos rotos.

## SEO y semántica

- Un único `h1` por página revisada.
- Títulos únicos para portada, seis casos y dos borradores legales.
- Descripciones y Open Graph presentes en portada y casos.
- FAQ estructurada como `FAQPage`; `LocalBusiness` solo se generará cuando exista
  un nombre definitivo.
- Breadcrumbs preparados para JSON-LD cuando exista dominio.
- Ningún caso queda huérfano: todos reciben enlace desde la portada.

## Seguridad y privacidad

- Sin librerías cliente ni recursos de terceros.
- CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y
  `Permissions-Policy` configurados para el futuro hosting.
- Formulario y bloque de captación ausentes mientras no exista canal real.
- Naming temporal, sociedad, dominio y contactos continúan fuera del HTML.
- No se publican fichas, ensayos, garantías ni afirmaciones de fabricantes como
  si pertenecieran a la futura empresa.

## Puerta de publicación pendiente

Antes de quitar `noindex` deben existir y validarse: nombre comercial, sociedad,
CIF, dominio, canales de contacto, revisión legal, canonical, sitemap, HTTPS,
HSTS y una prueba final contra el hosting real.
