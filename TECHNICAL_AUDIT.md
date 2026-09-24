# Auditoría técnica histórica del legado

Alcance: mediciones y observaciones de `src/` (aplicación retirada) en la fecha indicada, conservadas
como evidencia histórica; no se han vuelto a ejecutar al delimitar este documento.
No describen la Home actual en `apps/public-site/`, sus rutas ni su cobertura.
Para Home consultar [HOMEPAGE.md](HOMEPAGE.md). Para estado vigente usar checks
del checkout/SHA elegido; CI y producción requieren evidencia independiente.
La automatización interna tampoco queda certificada por estas métricas.

Última verificación: 12 de septiembre de 2026. Stack: Next.js 16.3.5, React 19,
TypeScript 6, Node 24.18.0, npm 11.16.0, Vitest, Playwright y Lighthouse 13.4.1.

## Estado histórico evaluado

- Implementación evaluada: legado Next.js App Router.
- 29 páginas generadas en/de/es/fr: portadas, cuatro hubs sin expedientes
  públicos, legales y contacto. Las portadas y hubs localizados son dinámicos
  por el nonce CSP; los slugs de casos no se generan ni se exponen
  mientras no exista autorización, revisión legal y activo publicable por caso;
  esa medición no incluyó el HTML canónico de la Home recuperada posteriormente.
- Preview cerrada: `noindex,nofollow`, sitemap vacío, dominio configurado y sin
  despliegues Git automáticos.
- Repositorio privado en GitHub Free; `Quality gate` continúa en cada PR y el
  hook versionado bloquea pushes directos a `main`. No se detectan secretos o
  credenciales en los archivos versionados.
- La puerta pública falla por revisión registral/marcaria, revisión legal,
  revisión profesional de los cuatro idiomas, proveedor de captación y soporte
  documental/revisión legal de los seis casos, como está previsto. Los campos de
  identidad y contacto de `data/brand.json` están redactados como `null`; los
  casos conservan datos técnicos internos y declaraciones del responsable, no
  documentos o revisiones profesionales.
- Consentimiento básico implementado: configuración y etiquetas de GA4/Clarity
  permanecen inaccesibles hasta una aceptación expresa; no hay IDs reales. La
  configuración de analítica usa el mismo snapshot de build que el layout;
  el formulario lleva el snapshot inicial y revalida en runtime solo su booleano de
  disponibilidad, sin exponer credenciales ni buzones.

## Resultados históricos

| Ruta móvil | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/en/` | 96 | 100 | 100 | 69 | 2.841 ms | 4 ms | 0 |
| `/de/projekte/` | 98 | 100 | 100 | 66 | 2.314 ms | 6 ms | 0 |

El SEO reducido es deliberado mientras la preview siga noindex. Los dos perfiles
superan el presupuesto de rendimiento compuesto 90, accesibilidad y buenas
prácticas 100, LCP de laboratorio 3 s local/3,25 s en CI, TBT 200 ms y CLS 0,1.
El SEO exige 65 mientras el sitio permanezca en preview noindex y sube a 95 en
cuanto `publicar` sea verdadero. El objetivo de campo de LCP sigue siendo inferior
a 2,5 s.

## Verificación automatizada

- `npm run check:quality`: auditoría de producción más ESLint, TypeScript,
  cobertura Vitest, build y los checks frescos de contacto, Playwright y Lighthouse.
- Build: 29 páginas generadas; las fichas publicables mantienen SSG y las rutas
  localizadas de portada/sección son dinámicas por el nonce CSP.
  `/api/analytics-config/` es estática; `/api/contact/` y
  `/api/contact-config/` son dinámicas y fallan cerradas.
- Cobertura Vitest: 96,36 % de statements, 97,03 % de líneas, 97,67 % de
  funciones y 87,31 % de ramas sobre 753 pruebas, en el alcance documentado en
  `vitest.config.ts`.
- Playwright estándar: 139 ejecuciones configuradas; 122 correctas y 17 omisiones
  intencionales en Chromium móvil/escritorio y smoke WebKit. El formulario
  habilitado añade 2 pruebas Chromium en un arnés local fail-closed.
- 24 rutas de contenido localizadas verificadas a 390 × 844 y 1.440 × 1.000,
  más equivalencia de rutas en los cuatro idiomas y reflow de titulares en/de/es/fr
  a 320, 360, 375 y 390 px.
- Las aserciones del navegador no detectan errores de consola o red, imágenes
  rotas u overflow horizontal; el servidor imprime `NoFallbackError` únicamente
  al cubrir rutas 404 intencionadamente no publicables.
- Axe sin hallazgos serios o críticos en las 24 rutas de contenido; contraste del
  selector de idioma corregido a nivel AA.
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
- La página 404 propia no usa estilos inline, mantiene foco visible y ofrece un
  enlace de retorno a la portada.
- `robots.txt` bloquea rastreo y `sitemap.xml` no contiene URLs en preview.
- `/` y las rutas españolas legacy redirigen a sus destinos canónicos localizados.
- El formulario no se renderiza activo y `/api/contact/` responde 503 sin la
  identidad, aprobación y configuración reales.
- `/api/contact-config/` solo devuelve `{ enabled: boolean }`, con `no-store` y
  `noindex`; cualquier fallo de la comprobación runtime deja el formulario cerrado.
- La ruta de contacto prueba 415, 403, 413, las tres causas de 400, 429, 502 y
  202, incluida la forma acotada del envío a Resend y las cabeceras no-cache.
- Canonical y `hreflang` se resuelven contra el dominio configurado; las pruebas
  exigen URLs absolutas y `x-default` para portada, hub y casos cuando estos
  últimos superen su puerta pública.

## Seguridad y privacidad

- CSP: `src/proxy.ts` crea un nonce por petición y lo entrega mediante `x-nonce`
  al render y mediante `Content-Security-Policy` en la respuesta. `script-src`
  y `style-src` no usan `unsafe-inline`; `script-src-attr 'none'`, bloqueo de
  objetos, frames y orígenes no declarados permanecen activos. Solo se permiten
  los hosts técnicos de GA4 y Clarity; no se permiten endpoints publicitarios.
- HSTS de aplicación: `max-age=31536000`; Vercel añade su política de perímetro
  cuando existe una URL servida.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y
  `Permissions-Policy` se prueban en navegador.
- Sin consentimiento no se cargan fuentes, analítica, publicidad o scripts de
  terceros. Los defaults de Consent Mode v2 mantienen siempre denegada la
  publicidad; Clarity usa ConsentV2 y el formulario queda enmascarado.
- La fuente estructurada omite identidad legal, contacto y domicilio mientras la
  información no esté validada y autorizada; no se publica una dirección por
  defecto.
- El plazo de respuesta inicial permanece `null`; no se muestra un SLA hasta que
  exista responsable, buzón y compromiso operativo verificable.
- El informe generado de Impeccable se conserva en `.impeccable/critique/` y se
  ignora por patrón; los artefactos de coordinación no se borran y quedan fuera
  del escaneo de candidatos de `check:diff`.
- La API de contacto limita JSON a 15 KB, valida mismo origen, honeypot y tiempo,
  aplica rate limit efímero sobre IP hasheada, no admite adjuntos y no registra PII.
  En Vercel Preview está publicada una regla WAF para `POST /api/contact`, por IP,
  con 100 solicitudes por ventana fija de 60 segundos y respuesta `429`; la
  variable no sensible `CONTACT_RATE_LIMIT_MODE=vercel-waf` está registrada en
  ese entorno. El límite en memoria sigue siendo la defensa secundaria y no
  acredita por sí solo una protección distribuida para otros entornos.
- `npm run check:security` devuelve 0 vulnerabilidades de producción. La auditoría
  completa del árbol de desarrollo sigue mostrando 28 advisories transitivas del
  CLI de Vercel 59.16.0. Quedan como excepción de tooling documentada: no hay una
  actualización upstream compatible, `npm audit fix --force` propone degradar el
  CLI a una versión incompatible y no se aplican overrides inválidos. Se revisarán
  cuando exista un parche compatible o una sustitución aprobada.

El nonce se adopta para las páginas localizadas: Next exige render dinámico por
petición y el layout `[lang]` lo declara de forma explícita. El coste de render y
CDN queda documentado; API, assets y metadata estática quedan fuera del matcher.

## Evidencia y autorización

Las 18 fotografías WebP que existían en el árbol fueron retiradas como medida
preventiva de privacidad. No quedan assets de proyectos ni referencias públicas;
la auditoría previa de imágenes no constituía una licencia de publicación.

Cada caso registra evidencias discriminadas: `declaracion_responsable`,
`documento_referenciado` y `revision_legal_verificada`. Los niveles no se
convierten entre sí y una revisión debe enlazar un documento del mismo expediente.

Los seis casos conservan únicamente la declaración expresa del responsable del
17 de julio de 2026, con alcance para nombre del cliente y fotografías web y una
referencia interna. No se ha registrado el documento ni una revisión legal
profesional. Los originales se conservan fuera del repositorio. `publicar: true`
La ejecución actual de `npm run check:activation` devuelve 6 bloqueos globales
verificables: revisión legal, proveedor de captación y las cuatro traducciones.
La evaluación completa conserva además 19 advertencias, de las que 12
corresponden a documentación/revisión de los casos; las advertencias de
identidad y naming se mantienen separadas y no se convierten en aprobaciones.

Las fechas de ejecución cuyo año no estaba confirmado se almacenan como `null`;
ya no hay textos del tipo “año pendiente de confirmar” en los datos públicos.
Los campos públicos, alt text y magnitudes tienen estructura completa en/de/es/fr,
pero las cuatro revisiones editoriales siguen `pendiente` y bloquean publicación.

## Decisión de despliegue

Se mantiene el runtime estándar de Next/Vercel. No se usa `output: "export"`
porque la exportación pura no admite las cabeceras definidas en `next.config.ts`.
Las rutas localizadas de portada y sección se renderizan dinámicamente por el
nonce CSP; las fichas que superen la puerta mantienen `generateStaticParams` y
SSG.

`vercel.json` conserva `git.deploymentEnabled: false`. El job remoto de preview
requiere un interruptor explícito y continúa omitido. El bootstrap `production`
autorizado el 12 de septiembre de 2026 dejó un único deployment en estado
`ERROR` (`dpl_EMaJWHNPHWmD91ZhC7JPRL2xjx4Y`) por la incompatibilidad de engines
del primer intento; el reintento con `Node 24.x` y `npm ci --engine-strict=false`
fue rechazado por el límite de contexto del conector antes de crear otro
deployment. No existe un deployment operativo ni se ha promocionado alias o
dominio. El proyecto remoto se corrigió de preset
`Other` con salida `public` a preset `Next.js` con build y salida autodetectados;
`vercel build` generó correctamente `.vercel/output` y el artefacto local se
eliminó después de verificarlo.

La revisión externa posterior detectó siete deployments históricos marcados como
`Production / Ready`, protegidos por Vercel Authentication pero con la antigua web
estática y contacto ficticio. Se retiraron por sus siete IDs exactos el 15 de julio
de 2026. La comprobación actual del proyecto devuelve un único deployment
`production` en estado `ERROR`, sin deployment `READY` ni URL de producción
operativa. No hay dominio personalizado ni promoción de alias. El proyecto
remoto se conserva para un futuro despliegue que pueda verificarse de extremo a
extremo.

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
| CSP sin `unsafe-inline` de script | Implementado con nonce por petición | Mantener `src/proxy.ts` y revisar el coste dinámico en cada actualización de Next |
| Permisos de clientes y fotografías | Assets retirados; declaración interna | Recibir documento y revisión legal antes de reincorporar cada caso |
| Identidad declarada | Campos sensibles redactados | Validar registral, marcaria y legalmente antes de completar datos |
| Aviso legal y privacidad | Borradores | Revisión profesional |
| Traducciones en/de/es/fr | Borradores completos | Revisor profesional y fecha por idioma |
| Captación Resend | Implementada y cerrada | DPA/subencargados, legal, dominio, buzones y aprobación explícita |
| Tooling de desarrollo | Excepción documentada: 28 advisories transitivas en Vercel CLI | Parche upstream compatible o sustitución revisada; no usar `audit fix --force` |
| Dominio y canonical | Configurados con `obraxen.com` | DNS, Search Console y activación autorizada |
| Producción | Bootstrap autorizado fallido; sin deployment operativo ni dominio personalizado | Reintento desde un contexto Vercel con capacidad suficiente, auditoría final y autorización expresa |

## Comandos de cierre

```sh
npm run check
npm run test:e2e
npm run test:coverage
npm run lighthouse:ci
npm run check:quality
npm run check:security
git diff --check
```

Las decisiones viven en [`DECISIONS.md`](DECISIONS.md), la secuencia en
[`ROADMAP.md`](ROADMAP.md) y la exposición pública del código en
[`REPOSITORY_EXPOSURE.md`](REPOSITORY_EXPOSURE.md).
