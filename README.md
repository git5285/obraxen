# Web corporativa — reparación de pavimentos industriales

Sitio técnico construido con Next.js 16 App Router, TypeScript y React Server
Components. La portada, el hub, seis fichas de proyecto y los tres borradores
legales se prerenderizan en build; navegación y consentimiento son las dos islas
cliente propias.

La web sigue en preview cerrada: `noindex,nofollow`, sin dominio, sin contacto y
con los despliegues Git de Vercel desactivados. La visibilidad pública del
repositorio no autoriza publicar o desplegar el sitio.

> **Identidad pendiente:** “RemainOn” es solo una referencia interna heredada de
> la carpeta. No es una marca seleccionada. La empresa todavía no está
> constituida y nombre, razón social, CIF, dominio, domicilio y canales de
> contacto permanecen en `null` hasta disponer de datos reales.

## Arquitectura

- `src/app/` — rutas App Router, metadata, robots y sitemap.
- `src/components/` — secciones de portada, proyectos, navegación, consentimiento
  y páginas legales.
- `src/lib/` — carga tipada de identidad, proyectos y ofertas, imports de
  imágenes y puertas de publicación.
- `data/brand.json` — única fuente de identidad y estado de publicación.
- `data/proyectos.json` — casos ejecutados, evidencia, datos confirmados y
  trazabilidad de autorización.
- `data/proyectos.schema.json` — contrato JSON equivalente para los casos.
- `data/ofertas.json` — ofertas internas; solo `estadoPublicacion: publicable`
  permite crear una ruta futura.
- `css/` — tokens y estilos existentes consumidos por Next.
- `img/` — activos optimizados e importados por el build.
- `tests/` — Vitest y Playwright.
- `.github/workflows/quality.yml` — gate obligatorio de GitHub Actions.

El generador Node y las plantillas HTML anteriores se retiraron tras alcanzar
paridad. `npm run build`, CI y Vercel tienen ahora una sola implementación:
Next.js.

## Rutas actuales

| Ruta | Estado |
|---|---|
| `/` | Portada prerenderizada |
| `/proyectos/` | Hub de seis expedientes |
| `/proyectos/{slug}/` | Seis fichas SSG mediante `generateStaticParams` |
| `/aviso-legal/` | Borrador incompleto, no apto para publicación |
| `/privacidad/` | Borrador incompleto, no apto para publicación |
| `/cookies/` | Borrador técnico de cookies y almacenamiento |
| `/api/analytics-config/` | Configuración del entorno, consultada solo tras aceptar |
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
npm run test:e2e     # rutas, responsive, accesibilidad, foco y cabeceras
npm run lighthouse:ci
npm run check        # lint + tipos + unitarias + build
npm run check:quality # gate completo local
```

El gate remoto ejecuta el mismo `npm run check`, 46 pruebas Playwright y
presupuestos Lighthouse móviles en portada, hub y un caso. Los informes se
conservan como artefactos durante 14 días.

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

## Datos y puerta de publicación

Los valores desconocidos se representan como `null` y no se completan con
estimaciones. `publicar: true` falla si falta cualquiera de estos controles:

- nombre comercial distinto del identificador temporal;
- sociedad constituida, razón social, CIF y domicilio validado;
- dominio, email y teléfono o WhatsApp reales;
- aviso legal, privacidad y cookies revisados profesionalmente;
- autorización documentada de cada caso para nombre y fotografías;
- referencia verificable y revisión legal aprobada por caso.

La situación actual de los seis casos es `confirmada_internamente`: existe una
declaración del equipo para identificar al cliente, pero falta soporte documental,
alcance para fotografías y revisión legal. Esto mantiene la publicación cerrada.

Canonical, URLs e imágenes sociales absolutas solo aparecen cuando existe un
dominio real. El sitemap permanece vacío hasta que toda la puerta pública se
complete.

## Repositorio público

La revisión vigente está en
[`REPOSITORY_EXPOSURE.md`](REPOSITORY_EXPOSURE.md). No se detectaron secretos o
credenciales versionados. Sí son visibles la estrategia, la coordinación y los
datos de casos; cambiar la visibilidad o reescribir el historial requiere una
decisión separada.

## Fuentes de verdad

| Tema | Documento |
|---|---|
| Empresa, mercado y oferta | `STRATEGY.md` |
| Copy y evidencia | `CONTENT_AUDIT.md` |
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

La base técnica de Fase 5 está terminada. Configurar IDs reales requiere aprobar
proveedores, textos y entornos; canonical, sitemap público, Search Console y datos
estructurados finales requieren el dominio definitivo. Naming, sociedad,
contacto, permisos, revisión legal, indexación y despliegue continúan bloqueados
por decisiones y evidencia reales.
