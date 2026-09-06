# Web corporativa — reparación de pavimentos industriales

Sitio técnico construido con Next.js 16 App Router, TypeScript y React Server
Components. El build cerrado actual genera 28 páginas estáticas en inglés,
alemán, español y francés: cuatro portadas, cuatro hubs, rutas legales y
contacto. Los casos no generan fichas públicas mientras no superen su puerta de
evidencia. Navegación, consentimiento y formulario son las únicas interacciones
cliente propias.

La web sigue en preview cerrada: `noindex,nofollow`, con `obraxen.com` y el correo
configurados pero sin DNS web, formulario ni despliegues Git de Vercel. El
repositorio es privado y esa privacidad tampoco autoriza publicar o desplegar el
sitio.

> **Identidad declarada:** `Obraxen` es el nombre comercial seleccionado y vive en
> `data/brand.json`. El identificador temporal anterior está retirado de la
> configuración operativa. `obraxen.com`, `info@obraxen.com` y
> `privacy@obraxen.com` están verificados e integrados. La fuente estructurada
> declara `OBRAXEN SURFACE S.L.`, NIF `B93963841`, Calle Federico García Lorca 22
> y el teléfono temporal `+34 653 916 970`. Estas declaraciones no sustituyen
> comprobaciones registrales, marcarias o legales; la activación pública continúa
> en NO-GO. Véase
> `NAMING_CLEARANCE.md`.

## Arquitectura

- `src/app/` — rutas App Router, metadata, robots y sitemap.
- `src/components/` — secciones de portada, proyectos, navegación, consentimiento
  y páginas legales.
- `src/lib/` — carga tipada de identidad, proyectos y ofertas, diccionarios
  en/de/es/fr, rutas localizadas, imports de imágenes y puertas de publicación.
- `data/brand.json` — única fuente de identidad y estado de publicación.
- `data/proyectos.json` — casos ejecutados, evidencia, datos confirmados y
  trazabilidad de autorización.
- `data/proyectos.schema.json` — contrato JSON equivalente para los casos.
- `data/ofertas.json` — ofertas internas; solo `estadoPublicacion: publicable`
  permite crear una ruta futura.
- `css/` — tokens y estilos existentes consumidos por Next.
- `img/` — activos optimizados e importados por el build.
- `tests/` — Vitest y Playwright.
- `.github/workflows/quality.yml` — gate remoto de GitHub Actions para cada PR.
- `.githooks/pre-push` — bloquea pushes directos a `main` y ejecuta el gate local.

El generador Node y las plantillas HTML anteriores se retiraron tras alcanzar
paridad. `npm run build`, CI y Vercel tienen ahora una sola implementación:
Next.js.

## Rutas actuales

| Ruta | Estado |
|---|---|
| `/` | Redirección permanente a `/en/` |
| `/en/`, `/de/`, `/es/`, `/fr/` | Cuatro portadas prerenderizadas |
| `/{lang}/{projects}/` | Cuatro hubs sin expedientes públicos mientras la puerta siga cerrada |
| `/{lang}/{projects}/{slug}/` | No se generan fichas; las rutas devuelven 404 hasta que cada caso sea publicable |
| Rutas legales localizadas | 12 borradores incompletos, no aptos para publicación |
| Rutas de contacto localizadas | UI preparada; formulario cerrado hasta aprobación |
| `/api/analytics-config/` | Configuración del entorno, consultada solo tras aceptar |
| `/api/contact/` | Entrega Resend fail-closed; 503 mientras falten condiciones |
| `/robots.txt` | Bloquea rastreo mientras la preview esté cerrada |
| `/sitemap.xml` | Vacío en preview; se completa solo al superar la puerta pública |
| `/soluciones/` | 404 mientras no existan ofertas publicables |

## Desarrollo y calidad

Requiere Node `24.x`, fijado en `.nvmrc` y `package.json`.

```sh
npm ci
npm run dev          # servidor de desarrollo
npm run build        # build de producción Next.js
npm run start        # sirve el build ya generado
npm run test         # pruebas unitarias y de render
npm run check:diff   # valida todo el cambio desde la base revisada
npm run test:e2e:contact # formulario real habilitado en arnés local seguro
npm run test:e2e     # rutas, responsive, accesibilidad, foco y cabeceras
npm run lighthouse:ci
npm run check        # lint + tipos + unitarias + build
npm run check:quality # gate completo local
```

El gate ejecuta Vitest, el formulario habilitado en un arnés que no existe en
Vercel, la suite Playwright cerrada en Chromium móvil/escritorio y smoke WebKit,
y Lighthouse sobre un build cerrado. Playwright y Lighthouse seleccionan puertos
locales libres y no reutilizan servidores preexistentes. Incluye reflow
multilingüe entre 320 y 390 px, ramas de seguridad de la API de contacto y
metadata con dominio inyectado, además de presupuestos Lighthouse en portada,
hub y caso localizados. Los informes se conservan como artefactos durante 14 días.

## Gobernanza Git gratuita

GitHub Free no permite exigir checks desde el servidor en un repositorio privado.
Por eso el proyecto combina pull requests, CI visible y un hook versionado. Cada
clon debe activarlo una vez:

```sh
git config core.hooksPath .githooks
```

El hook rechaza cualquier push directo a `main`, valida con `check:diff` el rango
completo desde la base de `main` hasta el SHA que se intenta subir y ejecuta
`npm run check:quality`. Una PR solo puede fusionarse cuando el `Quality gate` del
SHA actual esté verde; `--no-verify` no forma parte del flujo permitido. Si se
incorporan más colaboradores, se reevaluará GitHub Pro o un forge que imponga la
misma política en servidor.

## Renderizado y Vercel

Se usa el runtime estándar de Next/Vercel con rutas prerenderizadas; no se usa
`output: "export"`. La exportación pura no admite `headers`, mientras que esta
arquitectura conserva CSP, HSTS y las demás cabeceras sin convertir las páginas
en render dinámico.

`vercel.json` mantiene únicamente `git.deploymentEnabled: false`. El framework,
build y salida se detectan como Next.js. El job de preview también está apagado:
requiere entorno protegido, secretos, `ENABLE_VERCEL_PREVIEWS=true` y
autorización expresa.

La CSP mantiene `unsafe-inline` solo en `script-src` para el bootstrap generado
por App Router. `script-src-attr 'none'` bloquea manejadores inline y
`style-src` no permite estilos inline. Los nonces no se adoptan porque exigirían
render dinámico; SRI se reevaluará cuando deje de ser experimental en Next.
Los orígenes de GA4 y Clarity están declarados de forma explícita en `script-src`,
`connect-src` e `img-src`; la allowlist no carga recursos por sí sola y excluye
los endpoints publicitarios de Google.

## Consentimiento y analítica

La web usa consentimiento básico: no descarga GA4 o Clarity, no consulta sus IDs
y no envía pings cookieless antes de aceptar. La preferencia se guarda durante
180 días en `localStorage`, puede modificarse desde un control permanente y se
invalida si cambia su versión o caduca.

Los IDs se configuran por entorno como `GA_MEASUREMENT_ID` y
`CLARITY_PROJECT_ID`; `.env.example` documenta las claves sin incorporar valores.
La ruta interna valida el formato y devuelve `null` cuando faltan. No hay IDs
reales configurados en el repositorio ni autorización para activarlos.

Consent Mode v2 mantiene publicidad, personalización y datos publicitarios
denegados incluso al aceptar analítica. Clarity usa ConsentV2, no recibe IDs
personalizados y los formularios quedan enmascarados. Al retirar una aceptación
se deniega el estado, se limpian cookies detectables y se reinicia la página si
las etiquetas ya estaban ejecutándose.

## Idiomas y captación

ADR-010 fija inglés como entrada y prefijo para todos los idiomas. Los segmentos
de proyectos, legal y contacto se localizan; los slugs de casos permanecen
estables. El selector conserva la página equivalente. Canonical, `hreflang`,
`x-default` ya se resuelven contra `obraxen.com`; el sitemap público espera a la
apertura formal.

ADR-011 selecciona Resend como adaptador inicial sin base de leads ni adjuntos.
El endpoint valida origen, tamaño, campos, honeypot, tiempo y un límite efímero de
defensa; no registra contenido personal. La activación exige además una regla
externa distribuida para `/api/contact/` y
`CONTACT_RATE_LIMIT_MODE=vercel-waf`. La UI queda desactivada hasta reunir
identidad legal, textos legales, DPA/proveedor aprobado, esa regla y variables
reales; dominio y buzón coincidente ya están preparados. Las traducciones
actuales también requieren revisor profesional y fecha por cada idioma antes de
publicar.

## Datos y puerta de publicación

Los valores desconocidos se representan como `null` y no se completan con
estimaciones. `publicar: true` falla si falta cualquiera de estos controles:

- nombre comercial distinto del identificador temporal;
- sociedad constituida, razón social, CIF y domicilio validado;
- dominio, email público, email de privacidad y teléfono o WhatsApp reales;
- aviso legal, privacidad y cookies revisados profesionalmente;
- traducciones en/de/es/fr con revisor y fecha de aprobación;
- proveedor de captación, DPA y tratamiento aprobados;
- autorización documentada de cada caso para nombre y fotografías;
- referencia verificable y revisión legal aprobada por caso.

Los seis casos conservan una declaración expresa del responsable del 17 de julio
de 2026 sobre el nombre del cliente y las fotografías web. Esa evidencia interna
no equivale al documento de autorización ni a su revisión legal; ambas capas
siguen pendientes para cada caso. Los originales permanecen fuera del
repositorio. `npm run check:activation` mantiene el recuento canónico y la
publicación cerrada mientras exista cualquier bloqueo.

Canonical, URLs e imágenes sociales absolutas ya se generan contra el dominio
real en los artefactos locales. El sitemap permanece vacío hasta que toda la
puerta pública se complete.

## Repositorio privado

La revisión vigente está en
[`REPOSITORY_EXPOSURE.md`](REPOSITORY_EXPOSURE.md). No se detectaron secretos o
credenciales versionados. La estrategia, la coordinación y los datos de casos
estuvieron accesibles mientras el repositorio fue público; privatizarlo evita
nuevas consultas, pero no revoca copias realizadas durante ese periodo.

## Fuentes de verdad

| Tema | Documento |
|---|---|
| Empresa, mercado, oferta, copy y evidencia | `STRATEGY.md` |
| Rutas | `SITE_ARCHITECTURE.md` |
| Sistema visual | `DESIGN.md` |
| Decisiones técnicas | `DECISIONS.md` |
| Estado medido | `TECHNICAL_AUDIT.md` |
| Fases | `ROADMAP.md` |
| Publicación legal | `LEGAL_CHECKLIST.md` |
| Fotografías | `PHOTO_AUDIT.md` |
| Exposición del repositorio | `REPOSITORY_EXPOSURE.md` |

`AGENTS.md`, `COORDINATION.md` y `.coordination/` gobiernan la colaboración entre
tareas; no son contenido público del sitio.

## Próximo hito

Las fases técnicas 6.1–6.6 están terminadas. Solo queda 6.7: dictamen registral y
marcario, revisión profesional de en/de/es/fr, documentos y revisión legal de los
casos, legal general y DPA/proveedor. Razón social, NIF, domicilio y teléfono
temporal ya están declarados; después se audita una URL candidata y se decide
expresamente si publicar.
Indexación, analítica real, formulario y despliegue continúan bloqueados.
