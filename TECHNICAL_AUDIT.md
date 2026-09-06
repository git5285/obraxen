# Auditoría técnica

Última verificación: 6 de septiembre de 2026. Stack: Next.js 16.3.4, React 19,
TypeScript 6, Node 24.18.0, npm 11.16.0, Vitest, Playwright y Lighthouse 13.4.0.

## Estado

- Implementación única: Next.js App Router.
- 28 páginas estáticas en/de/es/fr: portadas, cuatro hubs sin expedientes
  públicos, legales y contacto. Los slugs de casos no se generan ni se exponen
  mientras no exista autorización, revisión legal y activo publicable por caso;
  no queda builder o plantilla HTML legacy.
- Preview cerrada: `noindex,nofollow`, sitemap vacío, dominio configurado y sin
  despliegues Git automáticos.
- Repositorio privado en GitHub Free; `Quality gate` continúa en cada PR y el
  hook versionado bloquea pushes directos a `main`. No se detectan secretos o
  credenciales en los archivos versionados.
- La puerta pública falla por revisión registral/marcaria, revisión legal,
  revisión profesional de los cuatro idiomas, proveedor de captación y soporte
  documental/revisión legal de los seis casos, como está previsto. La identidad,
  sociedad, domicilio y teléfono temporal ya están declarados en `data/brand.json`;
  los casos conservan declaraciones del responsable, no documentos o revisiones
  profesionales.
- Consentimiento básico implementado: configuración y etiquetas de GA4/Clarity
  permanecen inaccesibles hasta una aceptación expresa; no hay IDs reales.

## Resultados actuales

| Ruta móvil | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/en/` | 98 | 100 | 100 | 69 | 2.360 ms | 26 ms | 0 |
| `/de/projekte/` | 99 | 100 | 100 | 66 | 2.210 ms | 51 ms | 0 |

El SEO reducido es deliberado mientras la preview siga noindex. Los dos perfiles
superan el presupuesto de rendimiento compuesto 90, accesibilidad y buenas
prácticas 100, LCP de laboratorio 3 s local/3,25 s en CI, TBT 200 ms y CLS 0,1.
El SEO exige 65 mientras el sitio permanezca en preview noindex y sube a 95 en
cuanto `publicar` sea verdadero. El objetivo de campo de LCP sigue siendo inferior
a 2,5 s.

## Verificación automatizada

- `npm run check`: ESLint, TypeScript, 294 pruebas Vitest y build de producción.
- Build: 28 páginas estáticas generadas; todas las rutas de contenido públicas
  son estáticas o SSG.
  `/api/analytics-config/` y `/api/contact/` son dinámicas y fallan cerradas.
- Playwright estándar: 89 ejecuciones configuradas; 81 correctas y 8 omisiones
  intencionales en Chromium móvil/escritorio y smoke WebKit. El formulario
  habilitado añade 2 pruebas Chromium en un arnés local fail-closed.
- 28 rutas de contenido representativas verificadas a 390 × 844 y 1.440 × 1.000,
  más equivalencia de rutas en los cuatro idiomas y reflow de titulares en/de/es/fr
  a 320, 360, 375 y 390 px.
- Cero errores de consola o red, imágenes rotas u overflow horizontal.
- Axe sin hallazgos serios o críticos en las cuatro portadas y los cuatro hubs;
  contraste del selector de idioma corregido a nivel AA.
- WCAG 2.5.3 comprobado expresamente con `label-content-name-mismatch`: cero
  violaciones en los seis enlaces de casos de la portada.
- Menú móvil con foco inicial, trampa de foco, cierre con `Escape`, restauración
  del disparador y foco en la sección de destino.
- Panel de privacidad con trampa y restauración de foco; aceptar y rechazar tienen
  la misma jerarquía y targets mínimos de 44 px.
- Rechazar y volver con una preferencia denegada genera cero solicitudes al
  endpoint interno, Google Analytics, Google Tag Manager, Clarity o Bing.
- Aceptar carga únicamente los dos scripts simulados por el test; retirar envía
  denegación, elimina etiquetas y deja la visita siguiente sin requests externos.
- `/soluciones/` y slugs desconocidos responden 404.
- `robots.txt` bloquea rastreo y `sitemap.xml` no contiene URLs en preview.
- `/` y las rutas españolas legacy redirigen a sus destinos canónicos localizados.
- El formulario no se renderiza activo y `/api/contact/` responde 503 sin la
  identidad, aprobación y configuración reales.
- La ruta de contacto prueba 415, 403, 413, las tres causas de 400, 429, 502 y
  202, incluida la forma acotada del envío a Resend y las cabeceras no-cache.
- Canonical y `hreflang` se resuelven contra el dominio configurado; las pruebas
  exigen URLs absolutas y `x-default` para portada, hub y casos cuando estos
  últimos superen su puerta pública.

## Seguridad y privacidad

- CSP: `style-src 'self'`, `script-src-attr 'none'`, bloqueo de objetos, frames y
  orígenes no declarados. `script-src` mantiene `unsafe-inline` para el bootstrap
  de App Router y permite solo los hosts técnicos de GA4 y Clarity; no se permiten
  endpoints publicitarios.
- HSTS de aplicación: `max-age=31536000`; Vercel añade su política de perímetro
  cuando existe una URL servida.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y
  `Permissions-Policy` se prueban en navegador.
- Sin consentimiento no se cargan fuentes, analítica, publicidad o scripts de
  terceros. Los defaults de Consent Mode v2 mantienen siempre denegada la
  publicidad; Clarity usa ConsentV2 y el formulario queda enmascarado.
- La fuente estructurada declara Calle Federico García Lorca 22 como domicilio
  fiscal; esta declaración no equivale a revisión legal aprobada.
- El plazo de respuesta inicial permanece `null`; no se muestra un SLA hasta que
  exista responsable, buzón y compromiso operativo verificable.
- Los informes locales y auditorías externas están ignorados.
- La API de contacto limita JSON a 15 KB, valida mismo origen, honeypot y tiempo,
  aplica rate limit efímero sobre IP hasheada, no admite adjuntos y no registra PII.
- `npm audit --omit=dev --audit-level=moderate` devuelve 0 vulnerabilidades de
  producción.

Los nonces no se adoptan: Next exige render dinámico por petición, desactiva la
optimización estática y aumenta coste y latencia. La alternativa SRI continúa
experimental. La decisión se revisará si el framework estabiliza ese soporte o
si la aplicación llega a manejar datos sensibles en runtime.

## Evidencia y autorización

Las 18 fotografías WebP carecen de metadatos sensibles y usan dimensiones y
`sizes` explícitos. La auditoría técnica de imágenes no constituye una licencia
de publicación.

Cada caso registra evidencias discriminadas: `declaracion_responsable`,
`documento_referenciado` y `revision_legal_verificada`. Los niveles no se
convierten entre sí y una revisión debe enlazar un documento del mismo expediente.

Los seis casos conservan únicamente la declaración expresa del responsable del
17 de julio de 2026, con alcance para nombre del cliente y fotografías web y una
referencia interna. No se ha registrado el documento ni una revisión legal
profesional. Los originales se conservan fuera del repositorio. `publicar: true`
sigue fallando cerrado por 19 entradas: 7 de naming, legal/proveedor e idiomas
y 12 de documento/revisión de los casos.

Las fechas de ejecución cuyo año no estaba confirmado se almacenan como `null`;
ya no hay textos del tipo “año pendiente de confirmar” en los datos públicos.
Los campos públicos, alt text y magnitudes tienen estructura completa en/de/es/fr,
pero las cuatro revisiones editoriales siguen `pendiente` y bloquean publicación.

## Decisión de despliegue

Se mantiene el runtime estándar de Next/Vercel con prerenderizado. No se usa
`output: "export"` porque la exportación pura no admite las cabeceras definidas
en `next.config.ts`. Esto no introduce SSR: las rutas actuales continúan
generándose en build.

`vercel.json` conserva `git.deploymentEnabled: false`. El job remoto de preview
requiere un interruptor explícito y continúa omitido. No se ha realizado ningún
despliegue durante la consolidación. El proyecto remoto se corrigió de preset
`Other` con salida `public` a preset `Next.js` con build y salida autodetectados;
`vercel build` generó correctamente `.vercel/output` y el artefacto local se
eliminó después de verificarlo.

La revisión externa posterior detectó siete deployments históricos marcados como
`Production / Ready`, protegidos por Vercel Authentication pero con la antigua web
estática y contacto ficticio. Se retiraron por sus siete IDs exactos el 15 de julio
de 2026. La comprobación posterior devuelve cero deployments, cero dominios, ningún
`Latest Production URL` y HTTP 404 en las siete URLs y los tres alias conocidos.
El proyecto remoto se conserva para un futuro despliegue expresamente autorizado.

La exposición del repositorio se cerró el 15 de julio mediante visibilidad
privada. El plan gratuito no conserva la protección remota de ramas privadas, por
lo que ADR-009 adopta tres guardas: `npm run check:quality` antes de cada push,
bloqueo local absoluto de pushes a `main` y fusión exclusiva de PRs cuyo check
remoto esté verde. El control es suficiente para el único colaborador actual y
debe revisarse antes de conceder nuevos permisos de escritura.

## Deuda y bloqueos

| Elemento | Estado | Siguiente condición |
|---|---|---|
| Consentimiento | Implementado y probado | Mantener antes de GA4 o Clarity |
| IDs de GA4 y Clarity | Sin dato | Proveedores, textos y entornos aprobados |
| CSP sin `unsafe-inline` de script | Aplazado | SRI estable o cambio justificado a render dinámico |
| Permisos de clientes y fotografías | Declaración recibida | Recibir documento y revisión legal por caso |
| Identidad declarada | Completa en datos | Validar registral, marcaria y legalmente |
| Aviso legal y privacidad | Borradores | Revisión profesional |
| Traducciones en/de/es/fr | Borradores completos | Revisor profesional y fecha por idioma |
| Captación Resend | Implementada y cerrada | DPA/subencargados, legal, dominio, buzones y aprobación explícita |
| Dominio y canonical | Configurados con `obraxen.com` | DNS, Search Console y activación autorizada |
| Producción | Sin deployments ni dominios | Auditoría final y autorización expresa |

## Comandos de cierre

```sh
npm run check
npm run test:e2e
npm run lighthouse:ci
npm run check:quality
npm audit --audit-level=moderate
git diff --check
```

Las decisiones viven en [`DECISIONS.md`](DECISIONS.md), la secuencia en
[`ROADMAP.md`](ROADMAP.md) y la exposición pública del código en
[`REPOSITORY_EXPOSURE.md`](REPOSITORY_EXPOSURE.md).
