# OBRAXEN — Home y herramientas internas

La Home actual vive en `apps/public-site/`. La antigua aplicación `src/`
fue retirada de esta candidata; los datos y contratos útiles permanecen en
`data/` y `domain/publication/`. La automatización `automation/agents/`
no es una aplicación pública. Ningún estado local acredita producción.

## Empezar y elegir el checkout

Ejecutar `node scripts/checkout-context.mjs` desde la raíz elegida. Registrar
root, controlRoot, checkoutRole, HEAD y cambios reales; consultar designationFile
si existe. `--expected-root=<ruta>` y `--expected-head=<SHA>` comprueban la
expectativa, no sincronizan Git. legacy es null cuando falta la entrada retirada.
Leer [AGENTS.md](AGENTS.md) y comprobar reservas antes de editar.

## Fuentes y recorridos

- [HOMEPAGE.md](HOMEPAGE.md): contenido, interacción, fuentes y pruebas Home.
- [SITE_ARCHITECTURE.md](SITE_ARCHITECTURE.md): mapa actual y planificación histórica.
- [docs/LEGACY_RETIREMENT.md](docs/LEGACY_RETIREMENT.md): inventario y recuperación.
- [docs/COGNITIVE_DEBT.md](docs/COGNITIVE_DEBT.md): cinco mejoras integradas.
- [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md), apartado A: entrega Home.
- [ACTIVATION_GATE.md](ACTIVATION_GATE.md): contrato interno; no autoriza Home.
- [TECHNICAL_AUDIT.md](TECHNICAL_AUDIT.md) y [ROADMAP.md](ROADMAP.md): historial.

## Comandos vigentes

Node 24.18.0 y npm 11.16.0 están fijados. Instalar con `npm ci` cuando esté
autorizado; los assets LFS deben estar materializados antes de construir.
No descargar ni activar servicios por inferencia.

### Preparación de navegadores

`npm ci` no instala los navegadores de Playwright. Para `check:home`,
`test:e2e:home` y el gate actual, preparar Chromium desde la raíz con la CLI
instalada y el runtime fijado, cuando esté autorizada la descarga:

```sh
node automation/agents/runtime.mjs exec -- node node_modules/@playwright/test/cli.js install chromium
```

En Linux se necesitan también sus bibliotecas del sistema: usar `install
--with-deps chromium` en esa misma CLI si está autorizada la instalación de
paquetes del sistema (puede requerir administración). El workflow CI conserva
su preparación explícita. WebKit correspondía a las suites del legado retirado;
no es un requisito del verificador Home actual. Los comandos históricos de las
secciones inferiores no son instrucciones para este checkout.

### Referencia de comandos

| Trabajo | Comando |
|---|---|
| Desarrollar, construir, servir Home | `npm run dev:home`, `build:home`, `start:home` |
| Validar Home y su navegador | `npm run check:home`; `test:e2e:home` requiere build |
| Unitarias por ámbito | `test:home`, `test:tooling`, `test:publication` |
| Todas las unitarias / cobertura | `npm test` / `npm run test:coverage` |
| Lint y tipos internos | `npm run lint` / `npm run typecheck` |
| Gate de entrega | `npm run check:quality`, incluida auditoría externa autorizada |
| Reservas activas registradas | `node automation/agents/operations.mjs status --active` |

`dev`, `build`, `start` y `test:published` son aliases compatibles que
anuncian Home y conservan argumentos y errores. No existen comandos `*:legacy`.
El inventario positivo de unitarias rechaza suites nuevas sin clasificar,
duplicadas u obsoletas. `npm run test:home -- --list` permite consultar su ámbito.
La cobertura mide el dominio interno, no el HTML Home. Seguridad, hooks, CI,
autorizaciones y checks frescos no se sustituyen por una selección parcial.

El gate interno `check:activation` bloquea por revisión legal, aprobación de
Resend y su tratamiento y estado aprobado de las cuatro traducciones. Los
faltantes de identidad, naming y contacto no son bloqueos de ese CLI; esto no
elimina los requisitos humanos de `LEGAL_CHECKLIST.md` y `ACTIVATION_INPUTS.md`.
Su contrato está en [ACTIVATION_GATE.md](ACTIVATION_GATE.md). No autoriza publicar
Home ni evalúa sus rutas; los casos tienen contratos de evidencia independientes.

## Archivo histórico de la implementación retirada

Lo que sigue conserva la descripción anterior para trazabilidad. Sus rutas,
comandos, estado de servicios y cifras no son instrucciones ni evidencia vigente.
Para ejecutar o entregar esta candidata usar exclusivamente las secciones
anteriores y el apartado A del runbook. No se reintroduce ninguna función por
estar descrita aquí.

## Referencia de la implementación anterior

Los apartados marcados «Legado» describen exclusivamente `src/` y sus datos.
Sus estados de publicación, identidad y contacto no representan la Home actual.

El legado es un sitio técnico construido con Next.js 16 App Router, TypeScript y
React Server Components. Su build incluye las rutas localizadas de portada,
hubs, legales y contacto, además de los recorridos internos de preview y QA. Las
portadas y hubs localizados se renderizan dinámicamente para poder aplicar la CSP
nonce; los casos no generan fichas públicas mientras no superen su puerta de
evidencia. Navegación, consentimiento y formulario son las únicas interacciones
cliente propias del legado.

El legado sigue configurado como preview cerrada: `noindex,nofollow`, con `obraxen.com` declarado
pero sin formulario habilitado ni despliegues Git de Vercel. El repositorio es
privado y esa privacidad tampoco autoriza publicar o desplegar el sitio.

> **Identidad declarada:** `Obraxen` es el nombre comercial seleccionado y vive en
> `data/brand.json`. El identificador temporal anterior está retirado de la
> configuración operativa. Los campos de identidad legal y contacto están
> redactados como `null`; el dominio permanece declarado, pero no hay buzón,
> formulario ni publicación autorizados. La activación pública continúa en
> NO-GO. Véase
> `NAMING_CLEARANCE.md`.

## Legado: arquitectura

- `src/app/` — rutas App Router, metadata, robots y sitemap.
- `src/components/` — secciones de portada, proyectos, navegación, consentimiento
  y páginas legales.
- `src/lib/` — carga tipada de identidad, proyectos y ofertas, diccionarios
  en/de/es/fr, rutas localizadas, imports de imágenes y puertas de publicación.
- `data/brand.json` — fuente de identidad y publicación del legado.
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

La Home pública recuperada también usa Next.js: tres Route Handlers sirven
el documento canónico de `apps/public-site/public/index.html`. El build y
arranque por defecto seleccionan esa aplicación; la versión anterior permanece
aislada como legado. La configuración remota de Vercel no se ha modificado.

Los layouts, páginas y metadata se mantienen en el servidor por defecto. Las
directivas `"use client"` se limitan a controles que necesitan estado, eventos o
APIs del navegador (navegación móvil, consentimiento y formulario); las páginas
resuelven los datos y dejan los componentes de presentación en el grafo servidor.
En Next.js 16, los segmentos dinámicos reciben `params` como `Promise`; las
páginas, layouts y funciones de metadata los esperan y usan los helpers globales
`PageProps` y `LayoutProps`. El proyecto no activa `cacheComponents`: conserva el
modelo de caché documentado para Next 16, con la configuración de analítica
estática (`force-static`) y las APIs de contacto dinámicas (`force-dynamic`).

Las imágenes locales se importan desde `img/` y se renderizan con los helpers de
imagen de Next.js, con dimensiones y `sizes` explícitos; no hay patrones de
imágenes remotas. La tipografía usa pilas del sistema y no descarga fuentes de
terceros.

## Rutas de la implementación anterior

| Ruta | Estado |
|---|---|
| `/` | Redirección permanente a `/es/` |
| `/en/`, `/de/`, `/es/`, `/fr/` | Cuatro portadas renderizadas en servidor con CSP nonce |
| `/{lang}/{projects}/` | Cuatro hubs sin expedientes públicos mientras la puerta siga cerrada |
| `/{lang}/{projects}/{slug}/` | No se generan fichas; las rutas devuelven 404 hasta que cada caso sea publicable |
| Rutas legales localizadas | 12 borradores incompletos, no aptos para publicación |
| Rutas de contacto localizadas | UI preparada; formulario cerrado hasta aprobación |
| `/api/analytics-config/` | Configuración del entorno, consultada solo tras aceptar |
| `/api/contact/` | Entrega Resend fail-closed; 503 mientras falten condiciones |
| `/api/contact-config/` | Solo disponibilidad pública runtime; `no-store` y sin secretos |
| `/robots.txt` | Bloquea rastreo mientras la preview esté cerrada |
| `/sitemap.xml` | Vacío en preview; se completa solo al superar la puerta pública |
| `/soluciones/` | 404 mientras no existan ofertas publicables |

## Desarrollo y calidad

Requiere Node `24.18.0` y npm `11.16.0`, fijados en `.nvmrc` y
`package.json`. Los scripts seleccionan ese runtime antes de ejecutar sus
herramientas; instala el árbol bloqueado con `npm ci` antes de usarlos.

```sh
git lfs pull         # recupera el vídeo original antes de construir la Home
npm ci
npm run check:agent-runtime # comprueba Node, npm y el árbol bloqueado
npm run lint          # ESLint con las reglas de Next.js
npm run typecheck:legacy # genera tipos Next del legado y comprueba TypeScript
npm run dev          # Home aprobada en http://127.0.0.1:4387
npm run build        # build de la Home aprobada en apps/public-site
npm run start        # sirve ese build, mismo puerto
npm run test:published # tres idiomas, escritorio/móvil e interacciones de la Home
npm run dev:legacy   # implementación anterior conservada en src/
npm run build:legacy # construcción explícita del legado
npm run start:legacy # arranque explícito del legado
npm run test         # pruebas unitarias y de render
npm run test:coverage # todas las unitarias; umbrales solo sobre src/lib
npm run check:diff   # valida el cambio y el worktree desde origin/main
npm run check:diff -- --base-ref origin/main --head HEAD # valida solo el commit
npm run check:activation # evalúa la puerta de publicación basada en datos del legado
npm run test:e2e:contact # formulario real habilitado en arnés local seguro
npm run test:e2e     # rutas, responsive, accesibilidad, foco y cabeceras
npm run lighthouse:legacy # construye y mide el legado
npm run check        # lint + tipos + unitarias + build y navegador de Home
npm run check:security # audit de dependencias de producción
npm run check:quality # gate completo local
```

Tras lint, tipos, cobertura y build, el gate comprueba la Home aprobada con `test:published`. Conserva
también las comprobaciones del legado: Vitest, el formulario habilitado en un arnés que no existe en
Vercel, la suite Playwright cerrada en Chromium móvil/escritorio y smoke WebKit,
y Lighthouse sobre un build cerrado. Playwright y Lighthouse seleccionan puertos
locales libres y no reutilizan servidores preexistentes. Incluye reflow
multilingüe entre 320 y 390 px, ramas de seguridad de la API de contacto y
metadata con dominio inyectado, además de presupuestos Lighthouse en portada,
hub y caso localizados. Los informes se conservan como artefactos durante 14 días.
`check:diff` sin argumentos inspecciona también los archivos no rastreados que
pueden formar parte de la candidata. Excluye el plano de control de
`.coordination/` y los informes locales generados por Impeccable, que se
conservan fuera de la candidata; los diffs rastreados siguen pasando la
comprobación de whitespace. Para una revisión de commit usa la variante
explícita con `--head`.
En el legado, `check:activation` devuelve `NO-GO` y código distinto de cero mientras falte una
aprobación de publicación; ese resultado es el comportamiento esperado del gate
cerrado, no un fallo de compilación.

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

## Legado: renderizado y Vercel

Se usa el runtime estándar de Next/Vercel; no se usa `output: "export"`. La
exportación pura no admite `headers`, mientras que esta arquitectura conserva
CSP, HSTS y las demás cabeceras. Las rutas de contenido que no dependen de la
petición mantienen su prerenderizado/SSG; el árbol localizado de portada y
secciones se sirve dinámicamente porque la CSP usa un nonce por petición.

`vercel.json` mantiene únicamente `git.deploymentEnabled: false`. El framework,
build y salida se detectan como Next.js. El job de preview también está apagado:
requiere entorno protegido, secretos, `ENABLE_VERCEL_PREVIEWS=true` y
autorización expresa.

La CSP se genera por petición en `src/proxy.ts`: crea un nonce, lo entrega al
render mediante `x-nonce` y lo publica también en la respuesta. Así
`script-src` y `style-src` no necesitan `unsafe-inline`; `script-src-attr
'none'` bloquea manejadores inline. La configuración `force-dynamic` del layout
localizado asume el coste de renderizar esas páginas por petición, tal como
requiere el modelo de nonces de Next.js 16. El Proxy excluye API, assets y
metadata estática del matcher.
Los orígenes de GA4 y Clarity están declarados de forma explícita en `script-src`,
`connect-src` e `img-src`; la allowlist no carga recursos por sí sola y excluye
los endpoints publicitarios de Google.

## Legado: consentimiento y analítica

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

## Legado: idiomas y captación

ADR-010 documenta la decisión histórica de usar inglés como entrada. La
configuración vigente del legado redirige `/` a `/es/` en `next.config.ts`.
Los segmentos de proyectos, legal y contacto se localizan; los slugs de casos permanecen
estables. El selector conserva la página equivalente. Canonical, `hreflang`,
`x-default` ya se resuelven contra `obraxen.com`; el sitemap público espera a la
apertura formal.

ADR-011 selecciona Resend como adaptador inicial sin base de leads ni adjuntos.
El endpoint valida origen, tamaño, campos, honeypot, tiempo y un límite efímero de
defensa; no registra contenido personal. La activación exige además una regla
externa distribuida para `/api/contact/` y
`CONTACT_RATE_LIMIT_MODE=vercel-waf`. En Vercel Preview la regla WAF y esta
variable ya están configuradas, pero la UI queda desactivada hasta reunir
identidad legal, textos legales, DPA/proveedor aprobado, dominio, buzones y el
resto de variables reales. Las traducciones
actuales también requieren revisor profesional y fecha por cada idioma antes de
publicar.

## Legado: datos y puerta de publicación

Los valores desconocidos se representan como `null` y no se completan con
estimaciones. `publicar: true` bloquea la activación global si falta cualquiera
de estos controles:

- nombre comercial distinto del identificador temporal;
- sociedad constituida, razón social, CIF y domicilio validado;
- dominio, email público, email de privacidad y teléfono o WhatsApp reales;
- aviso legal, privacidad y cookies revisados profesionalmente;
- traducciones en/de/es/fr con revisor y fecha de aprobación;
- proveedor de captación, DPA y tratamiento aprobados;

La autorización documentada de cada caso es una puerta independiente de
contenido: `publicProjects` solo incluye casos con documento, revisión legal
aprobada y activos públicos completos. Mientras un caso no cumpla esas
condiciones, queda fuera de la Home, los hubs, sus rutas, el sitemap y el
JSON-LD; su falta se conserva como advertencia operativa y no abre la
publicación por sí sola.

Los seis casos conservan una declaración expresa del responsable del 17 de julio
de 2026 sobre el nombre del cliente y las fotografías web. Esa evidencia interna
no equivale al documento de autorización ni a su revisión legal; ambas capas
siguen pendientes para cada caso. Los originales permanecen fuera del
repositorio. `npm run check:activation` mantiene el recuento canónico de los
bloqueos globales y la publicación cerrada mientras exista cualquiera de ellos.

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
| Home publicada aprobada: fuente, arranque y límites | `HOMEPAGE.md` |
| Recuperación del despliegue y trazabilidad por hash | `docs/PUBLISHED_SITE_RECOVERY.md` |
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

## Legado: próximo hito

Las fases técnicas 6.1–6.6 están terminadas. Solo queda 6.7: dictamen registral y
marcario, revisión profesional de en/de/es/fr, documentos y revisión legal de los
casos, legal general y DPA/proveedor. La razón social, NIF, domicilio, teléfono y
buzones siguen sin autorizarse y permanecen `null` en `data/brand.json`; el dominio
está declarado, pero no hay contacto público autorizado. Después se audita una
URL candidata y se decide expresamente si publicar.
Indexación, analítica real, formulario y un despliegue operativo continúan
bloqueados; el bootstrap autorizado de `production` quedó en `ERROR` y no se
promocionó ningún dominio.
