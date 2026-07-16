# Decisiones de arquitectura (ADR)

> Registro corto de decisiones: **contexto / decisión / consecuencias**.
> Formato ligero. Fecha de referencia: 2026-07-16.
> Estados: `Aceptada` · `Abierta` (aún sin decidir) · `Sustituida`.

---

## ADR-001 — Generador estático mínimo sin framework

**Estado:** Sustituida por ADR-007 · **fecha de sustitución 2026-07-14**

> **Cierre (2026-07-14).** Esta decisión documenta la línea base histórica. El
> generador, el checker y las plantillas HTML se retiraron después de verificar
> la paridad completa de Next.js. No debe reactivarse una segunda implementación.

**Contexto.** La web necesita HTML estático, una colección de proyectos y varias
rutas, pero no necesita runtime, base de datos ni framework cliente. Los tokens
viven en `css/tokens.css`, la identidad en `data/brand.json` y los casos en
`data/proyectos.json`.

**Decisión histórica.** Mantener temporalmente un generador estático pequeño en
Node puro, sin dependencias de compilación, hasta alcanzar la paridad de Next.js.

**Consecuencias.**
- (+) Cero mantenimiento de framework o toolchain externo.
- (+) Un solo modelo genera el resumen y el detalle de cada proyecto.
- (−→✓) ~~La identidad se inyecta en runtime por JS~~ → **resuelto** por el build
  (ver actualización arriba y ADR-003): cabecera estática.
- (−→✓) ~~Bloques repetidos (nav ×3, etc.) se mantienen a mano~~ → **resuelto**:
  nav, logotipo, CTA y contacto viven como parciales/constantes en `src/`.

La base cumplió su función de referencia y fue retirada al completar la Fase 4.5.
El resultado se formaliza en [ADR-007](#adr-007--cutover-a-nextjs-como-implementación-única).

Relacionada con [ADR-004](#adr-004--modelo-de-contenido-antes-que-páginas).

---

## ADR-002 — Hero de vídeo aplazado hasta tener metraje propio de obra

**Estado:** Aceptada

**Contexto.** Un hero en vídeo puede reforzar el mensaje de intervención por fases,
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

**Contexto.** `Obraxen` fue seleccionado expresamente como nombre comercial el
15 de julio de 2026. El identificador interno temporal anterior no puede
publicarse y fue retirado de `data/brand.json` al completar la migración
operativa a Obraxen. La empresa todavía no está constituida y la
selección no acredita disponibilidad registral o marcaria; la forma jurídica
prevista es una sociedad limitada.
Antes, el nombre, el dominio y los contactos estaban hardcodeados en ~18 puntos
del HTML (título, meta, JSON-LD, logo, footer, formulario…). Renombrar habría
sido una edición dispersa y propensa a error.

> **Actualización 2026-07-14:** la investigación de nombres se ha reabierto, pero
> no existe una selección. Ningún candidato se integra y no se simulan datos
> societarios mientras la decisión y la constitución sigan pendientes.

> **Actualización 2026-07-15:** el usuario selecciona `Obraxen` y autoriza su
> integración como nombre comercial. Razón social, CIF y domicilio siguen `null`
> hasta la constitución. El RDAP no devolvió un objeto para el dominio propuesto
> y no existían DNS/MX, pero una comprobación comercial separada lo marcó como no
> disponible. Sin titularidad ni disponibilidad acreditadas, dominio y correo no
> se integran todavía.

> **Actualización 2026-07-16:** el registro y control de `obraxen.com` quedan
> verificados mediante RDAP, sesión administrativa de Cloudflare y respuesta de
> los DNS autoritativos. Google Workspace publica MX/SPF, autentica el envío con
> DKIM y dispone de `info@obraxen.com`, `privacy@obraxen.com` y
> `dmarc@obraxen.com`; DMARC queda inicialmente en observación. Dominio y correos
> se integran en `brand.json`, sin conectar la web ni autorizar publicación.

**Decisión.** Aislar toda la identidad en un único punto de verdad,
`data/brand.json` (`nombre`, `nombreLegal`, `claim`, `dominio`, `email`,
`emailPrivacidad`, `telefono`, `direccion`). El nombre no aparece **literalmente en ningún otro
fichero fuente** (`src/` + `data/` → solo `brand.json`). Recolorear = editar solo
`tokens.css`; renombrar = editar solo `brand.json`. La resolución pasó de runtime
a build y ahora se realiza en los Server Components y metadatos de Next.js.

**Consecuencias.**
- (+) Renombrar la empresa es cambiar un fichero (verificado en build: sustitución
  de prueba propagó título, logo, contactos y JSON-LD a la vez).
- (+) Los datos aún no decididos usan `null` y no se renderizan; el modo
  `publicar: true` exige identidad legal, contacto y URLs legales.
- (+) El nombre, dominio y correos verificados se resuelven desde la fuente
  estructurada. Canonical y Open Graph absolutos ya pueden construirse, pero el
  sitemap sigue vacío, `publicar` continúa en `false` y el formulario no se
  habilita hasta completar identidad, legal y proveedor.
- (✓ **resuelto 2026-07-14**) ~~Inyección por JS ⇒ crawlers/scrapers sin JS no ven
  el nombre en cabecera~~ → el nombre, `<title>`, `meta`, `og` y JSON-LD se
  resuelven **en build** y viven en el HTML estático servido. Ejecutado el
  **disparador 3 de
  [ADR-001](#adr-001--generador-estático-mínimo-sin-framework)**.
- (✓ **resuelto**) ~~Breve *flash* hasta que resuelve el `fetch`~~ → sin fetch: el
  contenido ya está en el HTML.
- (−) Excepción conocida que persiste: el color del favicon (`%23EA580C`,
  data-URI) no puede leer variables CSS; queda como único literal de color admitido.

---

## ADR-004 — Modelo de contenido antes que páginas

**Estado:** **Aceptada** (cerrada 2026-07-14 · «modelo-primero»)

**Contexto.** Proyectos, Equipo y Recursos son **colecciones** (N proyectos,
N personas, N artículos) y,
con la vocación europea, previsiblemente **multi-idioma**. Maquetar páginas antes
de definir la forma del contenido suele generar reescrituras.

**Decisión.** **Modelo-primero (Opción A).** Antes de construir Proyectos/Equipo/
Recursos, se define el **esquema** de cada colección (p. ej. Proyecto = título,
sector, m², ubicación, problema, solución, resultado, fotos) y las claves **i18n**;
el contenido se renderiza desde datos, no se maqueta a mano. Next.js renderiza la
navegación desde una única fuente en `src/lib/homepage.ts` y la identidad desde
`data/brand.json`; las colecciones siguen el patrón `data/*.json` → componentes
y rutas prerenderizadas.

*Motivo de cerrarla ahora:* el build ya existe y demuestra el patrón datos→plantilla;
comprometerse con «modelo-primero» evita crear páginas a mano que habría que
rehacer al activar i18n.

**Consecuencias.**
- (+) Cada colección tendrá un esquema explícito y una única fuente de datos.
- (+) i18n encaja desde el principio (claves por idioma), alineado con la vocación europea.
- (✓) Proyecto ya tiene esquema multiidioma (`data/proyectos.schema.json`),
  fuente (`data/proyectos.json`) y render condicional en portada, hub y detalle.
- (−) Equipo y Recursos todavía necesitan esquema propio antes de publicarse.
- Las plantillas vacías dejaron de enviarse en el HTML; una colección aparece
  únicamente cuando contiene datos reales válidos.

**Estado actualizado:** los seis proyectos recibidos se preparan desde
`data/proyectos.json` tras confirmar ejecución, unidades principales y ubicaciones.
La autorización para identificar clientes deja de ser un booleano: cada caso
registra estado, alcance, fuente, fecha, referencia y revisión legal. La situación
actual es confirmación interna para el nombre, sin soporte documental ni alcance
para fotografías, de modo que la publicación final permanece bloqueada. Las 18
imágenes seleccionadas pasaron una auditoría de calidad y privacidad documentada
en `PHOTO_AUDIT.md`, que no sustituye la autorización de uso.

**Actualización de cierre:** los seis proyectos registran entrega conforme y
ausencia de correcciones posteriores como datos confirmados. La iteración de
evidencia incorpora duración, equipo y medios principales en los seis casos y
situación operativa en cinco; algunos años, la continuidad de TP-Link, los
tiempos de reapertura y los resultados medidos siguen sin dato. El build omite
cualquier campo desconocido en lugar de inferirlo.

**Actualización de Fase 3:** el hub y las seis fichas Next se prerenderizan desde
el mismo modelo mediante `generateStaticParams`. La puerta tipada de soluciones
filtra exclusivamente `estadoPublicacion: publicable`; como el resultado actual
es cero, no se crea `/soluciones/` ni se expone contenido interno.

---

## ADR-005 — Migración progresiva a Next.js

**Estado:** Aceptada · **fecha 2026-07-14**

**Contexto.** La web estática ya es rápida y segura, pero ampliar colecciones,
consentimiento, metadatos, imágenes responsive, tipado, pruebas y CI dentro del
generador manual aumentaría el coste de mantenimiento. El stack objetivo acordado
es Next.js App Router, TypeScript, GitHub y Vercel.

**Decisión.** Migrar por fases a Next.js con prerenderizado, React Server
Components por defecto y JavaScript cliente solo para interacción. La web actual
permanece intacta como referencia hasta que cada ruta alcance paridad funcional,
visual, responsive y accesible. `data/brand.json`, `data/proyectos.json` y
`data/ofertas.json` conservan su autoridad durante la transición.

**Consecuencias.**

- (+) Tipado, lint, tests, CI, activos versionados e imágenes responsive dentro
  de un único toolchain.
- (+) Metadatos, canonical, sitemap, robots y Open Graph derivados del estado de
  publicación.
- (+) Integración controlada de consentimiento, GA4 y Clarity por entorno.
- (✓) La convivencia temporal terminó tras comparar todas las rutas y retirar la
  base estática en la Fase 4.5.
- (−) Se incorpora una dependencia de framework que debe mantenerse con lockfile,
  versión de Node fijada y actualizaciones revisadas.

El orden, las puertas de calidad y la estrategia de publicación se mantienen en
[`ROADMAP.md`](ROADMAP.md), evitando duplicarlos en este ADR.

**Actualización tras Fases 1–3.** La portada App Router queda prerenderizada y
dividida en secciones servidoras. Solo `src/components/site-navigation.tsx` usa
`use client`; gestiona menu, foco y navegacion sticky. Durante la convivencia se
importa `css/home.css` en el bundle Next para garantizar paridad sin duplicar el
sistema visual. Las imagenes usan props responsive de Next sin atributos de
estilo inline, lo que permite retirar `unsafe-inline` de `style-src`. La excepcion
permanece en `script-src` por los bloques de arranque RSC que genera el prerender
de App Router; ADR-006 documenta por qué los nonces no compensan el render
dinámico y por qué SRI debe esperar a dejar de ser experimental.

El hub y las seis fichas se mantienen como Server Components sin nuevas islas
cliente. Metadata y Open Graph son propios de cada ruta; canonical, URL e imagen
absoluta solo se emiten cuando `data/brand.json` contenga un dominio real. Las
rutas legales y el sitemap alcanzaron paridad antes del cutover.

---

## ADR-006 — Puerta automatizada y preview desactivada por defecto

**Estado:** Aceptada · **fecha 2026-07-14**

**Contexto.** La migración necesitaba una puerta reproducible para integrar el
cutover y proteger cambios futuros sin habilitar despliegues por accidente.

**Decisión.** Cada pull request ejecuta en GitHub Actions `npm run check`, Playwright
en móvil y escritorio y presupuestos Lighthouse móviles sobre portada, hub y un
caso. La preview Vercel vive en un job separado, dependiente del gate, y requiere
simultáneamente entorno `preview`, secretos y la variable explícita
`ENABLE_VERCEL_PREVIEWS=true`. El valor por defecto es apagado.

La CSP mantiene `unsafe-inline` solo en `script-src` mientras App Router sea
prerenderizado. Los nonces documentados por Next.js fuerzan renderizado dinámico;
adoptarlos ahora eliminaría la ventaja estática y no se justifica para una web
sin scripts de terceros. `style-src` continúa cerrado.

**Consecuencias.**

- (+) El mismo comando reproduce localmente el check remoto.
- (✓ histórico hasta 2026-07-15) `main` exigió `Quality gate` actualizado y
  bloqueó fuerza y borrado también para administradores mientras el repositorio
  fue público.
- (+) Rutas, responsive, accesibilidad, foco, consola, red y presupuestos quedan
  cubiertos antes de integrar.
- (+) Ningún pull request despliega mientras el interruptor permanezca apagado.
- (−) Lighthouse usa 3 s como tolerancia estable de laboratorio; la meta de
  campo continúa siendo LCP < 2,5 s.
- (−) Una preview solo puede considerarse protegida tras verificar también el
  control de acceso en Vercel; preparar el job no equivale a publicarla.
- (±) El repositorio pasó temporalmente a público para habilitar la protección
  disponible en el plan gratuito. ADR-009 sustituye esa exposición por un flujo
  privado con CI visible, hook local y gobernanza obligatoria.

---

## ADR-007 — Cutover a Next.js como implementación única

**Estado:** Aceptada · **fecha 2026-07-14**

**Contexto.** Portada, hub, seis casos, navegación, legal, robots, sitemap,
metadata, tests y presupuestos ya tienen paridad en App Router. Mantener el
generador Node duplicaría validaciones, copy, rutas y cualquier futura fase de
consentimiento. La web necesita cabeceras CSP y de seguridad, prerenderizado y
despliegue bloqueado por defecto.

**Decisión.** Next.js App Router es la única implementación. `npm run build`, CI
y Vercel usan `next build`; el generador, checker y HTML legacy se eliminan.
Vercel usa el runtime estándar de Next con rutas prerenderizadas y
`git.deploymentEnabled: false`.

El preset remoto del proyecto se actualiza de `Other` a `Next.js`; build y
directorio de salida vuelven a autodetección. Este cambio corrige la antigua
expectativa de una carpeta `public` sin crear un despliegue.

### Opciones consideradas

| Opción | Evaluación |
|---|---|
| Next/Vercel con prerenderizado | Aceptada: una sola herramienta, cabeceras de Next y rutas estáticas/SSG |
| `output: "export"` | Rechazada: la exportación pura no admite `headers` de Next |
| Mantener legacy y Next | Rechazada: duplica código, pruebas y futuras integraciones |
| Nonces con render dinámico | Rechazada ahora: desactiva optimización estática y CDN por defecto |

**Trade-off.** Se acepta depender del runtime de despliegue de Next para aplicar
cabeceras aunque las páginas se generen estáticamente. A cambio se evita mantener
un servidor dinámico por petición y se conserva una única ruta de build.

**Consecuencias.**

- (+) Una sola fuente funcional para portada, proyectos, legal y metadata.
- (+) 41 pruebas unitarias, 36 ejecuciones Playwright y Lighthouse protegen el
  cutover.
- (+) La Fase 5 se implementará una sola vez.
- (−) La CSP de scripts mantiene `unsafe-inline` para el bootstrap de App Router.
- (−) Un hosting estático genérico requeriría reproducir las cabeceras fuera de
  Next; no es la plataforma objetivo actual.

**Referencias.**

- [Exportación estática y funciones no compatibles](https://nextjs.org/docs/app/guides/static-exports#unsupported-features)
- [CSP estática frente a nonces dinámicos](https://nextjs.org/docs/app/guides/content-security-policy#static-vs-dynamic-rendering-with-csp)

**Acciones completadas.**

- [x] Migrar aviso legal, privacidad, sitemap y metadata de portada.
- [x] Cambiar scripts, CI, Playwright y Vercel a Next.
- [x] Retirar builder, checker y plantillas legacy.
- [x] Verificar rutas, datos, accesibilidad, cabeceras y presupuestos.
- [x] Mantener despliegue e indexación desactivados.

---

## ADR-008 — Consentimiento básico con bloqueo previo de proveedores

**Estado:** Aceptada · **fecha 2026-07-14**

**Contexto.** La Fase 5 prepara GA4 y Microsoft Clarity, pero la preview sigue
cerrada, no existen IDs reales aprobados y el proyecto exige que rechazar genere
cero solicitudes de analítica. Los modos avanzados de ambos proveedores pueden
enviar mediciones sin cookies aun cuando el almacenamiento esté denegado, lo que
no satisface esa política más estricta.

**Decisión.** Adoptar consentimiento básico y bloquear cualquier etiqueta antes
de una aceptación expresa. La preferencia se guarda durante 180 días en
`localStorage`, con versión y caducidad. Aceptar y rechazar aparecen al mismo
nivel; el panel se puede reabrir y retirar la aceptación.

Los parámetros de Consent Mode v2 parten de `denied`. Solo
`analytics_storage` pasa a `granted` al aceptar; `ad_storage`, `ad_user_data` y
`ad_personalization` permanecen siempre denegados. Clarity recibe ConsentV2 con
almacenamiento publicitario denegado. Los formularios se marcan para enmascarado
y no se envían identificadores personalizados.

Los IDs se leen en servidor desde `GA_MEASUREMENT_ID` y
`CLARITY_PROJECT_ID`. El navegador solo consulta el endpoint interno después de
aceptar; valores ausentes o inválidos se convierten en `null`. La retirada envía
el estado denegado, borra cookies analíticas detectables, elimina las etiquetas
y recarga únicamente si un proveedor ya se estaba ejecutando.

**Consecuencias.**

- (+) Rechazar o no decidir produce cero solicitudes a Google, Microsoft y al
  endpoint de configuración.
- (+) Los IDs pueden separarse por entorno sin versionarlos ni exponerlos antes
  del consentimiento.
- (+) 50 pruebas unitarias y 46 ejecuciones Playwright cubren formato, caducidad,
  red, persistencia, revocación, teclado y accesibilidad.
- (+) La política de cookies es accesible con o sin JavaScript.
- (−) Se renuncia a la modelización cookieless de los modos avanzados.
- (−) Retirar después de cargar un proveedor requiere recarga para detener con
  certeza el código de terceros ya ejecutado.
- (±) La CSP permite únicamente los orígenes técnicos de GA4 y Clarity, pero esa
  allowlist no activa ni descarga recursos por sí sola.

**Pendiente externo.** No se configuran IDs reales ni Search Console hasta que
existan revisión legal, entornos aprobados y dominio definitivo. Esta ADR no
autoriza preview, producción, indexación o publicación.

---

## ADR-009 — Repositorio privado con guardas gratuitas

**Estado:** Aceptada · **fecha 2026-07-15**

**Contexto.** El repositorio público permitía exigir `Quality gate` en `main` con
GitHub Free, pero también exponía estrategia, coordinación y datos de casos que
no son contenido publicable. En el plan gratuito, GitHub no ofrece ramas
protegidas ni rulesets para repositorios privados. El repositorio tiene un único
colaborador y la web continúa sin deployments, dominios, analítica real o
autorización de publicación.

**Decisión.** Mantener GitHub Free y cambiar `git5285/remainon-web` a privado.
GitHub Actions conserva `Quality gate` en cada pull request, pero su aprobación se
impone mediante el protocolo del proyecto en lugar de una regla remota de pago.

Cada clon activa `.githooks/pre-push` mediante
`git config core.hooksPath .githooks`. El hook bloquea todo push directo a `main`
y ejecuta `npm run check:quality` antes de subir una rama. Las tareas solo pueden
fusionar una PR cuando el check remoto del SHA actual esté verde y no pueden usar
`--no-verify` para eludir el control.

### Opciones consideradas

| Opción | Evaluación |
|---|---|
| GitHub privado + guardas locales | Aceptada: coste cero, continuidad y riesgo proporcionado a un único colaborador |
| GitHub Pro | Aplazada: recupera enforcement remoto sin migración, pero añade coste recurrente |
| GitLab Free privado | Aplazada: permite enforcement remoto gratis, pero obliga a migrar CI, PRs y automatización |
| Mantener GitHub público | Rechazada: prolonga exposición estratégica sin aportar valor de publicación |

**Consecuencias.**

- (+) Nuevas consultas del código y los documentos requieren autorización.
- (+) Se conservan el historial, las PRs, GitHub Actions y la integración actual.
- (+) El gate local reduce consumo remoto y evita subir ramas no verificadas.
- (−) El propietario todavía puede desactivar el hook o fusionar una PR fallida;
  el protocolo es una barrera operativa, no enforcement del servidor.
- (−) Hacer privado el repositorio no revoca clones o copias obtenidos mientras
  fue público.
- (→) Al incorporar otro colaborador con permisos de escritura se reabre esta ADR
  para adoptar GitHub Pro o migrar a un forge con protección privada gratuita.

Esta decisión no habilita Vercel, previews, producción, indexación ni analítica.

---

## ADR-010 — Arquitectura internacional con prefijo para todos los idiomas

**Estado:** Aceptada · **fecha 2026-07-15**

**Contexto.** El mercado principal es la Unión Europea y la web debe operar en
inglés, alemán, español y francés. Mantener español sin prefijo y añadir los
demás idiomas produciría dos reglas de URL, haría más frágiles los enlaces
equivalentes y complicaría un futuro cambio de mercado principal.

**Decisión.** Inglés es el idioma inicial y los cuatro idiomas usan siempre
prefijo: `/en/`, `/de/`, `/es/` y `/fr/`. `/` redirige permanentemente a `/en/`.
Los segmentos se localizan (`projects/projekte/proyectos/projets`, las rutas
legales y contacto), mientras los slugs estables de los seis proyectos se
conservan en todos los idiomas. Las antiguas rutas españolas redirigen a `/es/`.

Los diccionarios de interfaz son tipados y completos. Marca, ofertas, proyectos,
alt text y datos de cada caso requieren las cuatro variantes en sus esquemas.
Los equivalentes de idioma se calculan por identidad de ruta, no sustituyendo
texto dentro de la URL. Canonical, `hreflang` —incluido `x-default`—, sitemap y
Open Graph absolutos solo se emiten cuando exista un dominio definitivo y la
puerta pública esté abierta.

Las traducciones actuales son borradores editoriales completos, no aprobación
lingüística. `data/brand.json` registra estado, revisor y fecha por idioma; la
publicación falla cerrada mientras cualquier revisión siga pendiente.

### Opciones consideradas

| Opción | Evaluación |
|---|---|
| Prefijo en los cuatro idiomas e inglés inicial | Aceptada: regla uniforme, enlaces equivalentes deterministas y cambio futuro controlado |
| Español sin prefijo | Rechazada: crea una excepción permanente y contradice el mercado internacional acordado |
| Detección automática obligatoria por navegador | Rechazada: las URLs deben ser estables, compartibles y elegibles por el usuario |
| Traducir también los slugs de casos | Aplazada: añade redirecciones y riesgo sin mejorar la evidencia del proyecto |

**Consecuencias.**

- (+) 52 páginas se generan en build con `<html lang>` exacto y selector que
  conserva la página equivalente.
- (+) Los datos desconocidos continúan como `null` u omitidos en cada idioma.
- (+) Se conservan redirecciones permanentes para enlaces históricos españoles.
- (−) Cada cambio público exige actualizar y revisar las cuatro versiones.
- (−) El contenido no debe publicarse como traducción profesional hasta registrar
  revisor y fecha en cada idioma.

**Referencias.**

- [Internationalization en Next.js](https://nextjs.org/docs/app/guides/internationalization)
- [Versiones localizadas para Google](https://developers.google.com/search/docs/specialty/international/localized-versions)

---

## ADR-011 — Captación por Resend, sin almacenamiento propio y activación cerrada

**Estado:** Aceptada técnicamente · **activación bloqueada** · **fecha 2026-07-15**

**Contexto.** El sitio necesita una solicitud de evaluación en cuatro idiomas,
pero todavía no existen sociedad ni textos legales aprobados. Un `mailto:` no
confirma entrega ni permite una experiencia coherente; una base de datos propia
añade retención y superficie de seguridad innecesarias.

> **Actualización 2026-07-16:** el dominio, el buzón responsable y el alias de
> privacidad ya existen. El formulario sigue bloqueado por identidad societaria,
> revisión legal, aceptación del proveedor y configuración de entorno.

**Decisión.** Usar Resend como adaptador de envío inicial y no persistir leads en
una base de datos de la aplicación. `/api/contact/` acepta solo JSON limitado,
valida origen, tamaño, tiempos, honeypot y campos, aplica rate limit efímero por IP
hasheada y envía al buzón responsable sin registrar PII. No se admiten adjuntos.

El formulario queda fail-closed y ni siquiera se renderiza como activo hasta que
coincidan simultáneamente: `CONTACT_FORM_ENABLED=true`, API key válida, buzones
del dominio definitivo, identidad societaria, correo público, revisión legal,
proveedor `Resend` y `formularioRevisionAprobada=true`. La aprobación debe incluir
DPA, subencargados, transferencias, ubicación y retención; seleccionar el
adaptador no equivale a aceptar esas condiciones.

### Opciones consideradas

| Opción | Evaluación |
|---|---|
| Resend a buzón responsable, sin base propia | Aceptada técnicamente: coste inicial cero, API directa y minimización de almacenamiento |
| `mailto:` | Rechazada: experiencia desigual, exposición del canal y entrega no verificable |
| Base de datos/CRM desde el inicio | Rechazada ahora: retención y complejidad desproporcionadas |
| Formulario activo antes de identidad/legal | Rechazada: tratamiento sin responsable ni información completos |

**Consecuencias.**

- (+) La ruta y la UI quedan listas sin aceptar datos prematuramente.
- (+) El plan gratuito declarado por el proveedor cubre la etapa inicial; cualquier
  cambio de precio o condiciones debe revisarse antes de activar.
- (+) Los eventos analíticos registran estado y canal, nunca contenido de campos.
- (−) El buzón pasa a ser el sistema de conservación y debe tener acceso,
  borrado, seguridad y plazos definidos.
- (−) Un proceso comercial más complejo requerirá una ADR específica para CRM.

**Referencias.**

- [API de envío de Resend](https://resend.com/docs/api-reference/emails/send-email)
- [DPA de Resend](https://resend.com/legal/dpa)
- [Precios de Resend](https://resend.com/pricing/)
