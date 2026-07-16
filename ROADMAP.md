# Roadmap para una web ejemplar

Fecha de referencia: 15 de julio de 2026.

Este plan parte de la evidencia real y del cutover ya completado a Next.js. Los
siguientes hitos deben conservar contenido, datos, rutas, dirección industrial,
controles de publicación y rendimiento sin volver a introducir una segunda
implementación.

## Stack objetivo

- **Web:** Next.js con App Router, TypeScript y React Server Components por
  defecto.
- **Repositorio:** GitHub privado en el plan gratuito, ramas de trabajo y pull
  requests con CI verde antes de integrar en `main`; el hook versionado bloquea
  pushes directos y `REPOSITORY_EXPOSURE.md` controla la exposición.
- **Hosting:** Vercel, previews protegidas por pull request y produccion cerrada
  hasta superar la puerta de publicacion.
- **Analitica:** Google Analytics 4 y Microsoft Clarity solo tras consentimiento
  valido; Google Search Console mediante verificacion de dominio y sitemap.
- **Desarrollo asistido:** Codex, sujeto a `AGENTS.md`, claims por archivo,
  verificacion automatizada y handoff.

## Principios no negociables

1. La evidencia real prevalece sobre cualquier afirmacion comercial.
2. Naming, sociedad, dominio, contacto y datos legales no se inventan ni se
   fuerzan para completar una pantalla.
3. La ausencia de datos se representa como `null`, `sin dato` o contenido
   omitido; nunca se rellena con una promesa aproximada.
4. No se publica desde `main` por accidente. Preview y produccion son entornos
   distintos, con proteccion y variables separadas.
5. Cada ruta debe funcionar sin JavaScript cliente salvo la interaccion que lo
   necesite. El sitio es contenido tecnico, no una aplicacion pesada.
6. Cada ruta nueva se valida contra las puertas actuales de contenido, datos,
   accesibilidad, seguridad y rendimiento.

## Arquitectura actual

```text
src/
  app/
    [lang]/layout.tsx
    [lang]/page.tsx
    [lang]/[section]/page.tsx
    [lang]/[section]/[slug]/page.tsx
    api/analytics-config/route.ts
    api/contact/route.ts
    robots.ts
    sitemap.ts
  components/
    site-navigation.tsx
    projects-section.tsx
    project-case.tsx
    legal-page.tsx
    contact-form.tsx
    language-switcher.tsx
    consent-manager.tsx
  lib/
    brand.ts
    projects.ts
    offers.ts
    publication.ts
    analytics-config.ts
    consent.ts
    contact.ts
    i18n.ts
    dictionaries/{en,de,es,fr}.ts
data/
  brand.json
  proyectos.json
  ofertas.json
css/
img/
tests/
```

- Las paginas se prerenderizan en build. No se necesita SSR para contenido que
  cambia mediante commits.
- Las 52 páginas se generan bajo `/en/`, `/de/`, `/es/` y `/fr/`; todos los
  idiomas llevan prefijo y `/` redirige a inglés.
- `data/brand.json` sigue siendo la puerta de identidad y publicacion.
- Los proyectos conservan una unica fuente de datos y generan tanto el hub como
  las rutas dinamicas mediante `generateStaticParams`.
- Las imagenes pasan por `next/image`, con tamaños responsivos y dimensiones
  explicitas. Los masters permanecen fuera de `public/`.
- Metadatos, canonical, Open Graph, `robots.ts` y `sitemap.ts` se derivan del
  estado de publicacion y del dominio real.
- El CSS actual conserva tokens y hojas por área consumidas por Next. No se
  incorpora una librería visual sin una necesidad concreta; el consentimiento
  debe empezar por su modelo y pruebas, no por un componente externo.

## Flujo GitHub y Vercel

1. Crear una rama por hito y abrir pull request.
2. El hook local ejecuta `npm run check:quality` antes del push; GitHub Actions
   repite instalación reproducible, lint, TypeScript, validación de datos, tests,
   build y comprobaciones de navegador en cada pull request.
3. Vercel solo crea una preview si el entorno protegido, los secretos y
   `ENABLE_VERCEL_PREVIEWS=true` están configurados expresamente.
4. Revisar visualmente escritorio y movil, teclado, consola y red.
5. Integrar en `main` solo con el `Quality gate` del SHA actual verde. GitHub Free
   no lo impone en privado, por lo que `AGENTS.md` convierte la regla en obligatoria.
6. Mantener produccion desactivada o protegida hasta que naming, dominio,
   contacto, legal y consentimiento esten aprobados.

El workflow ya separa calidad y preview. La preview está apagada por defecto y
su activación no autoriza producción.

## Analitica y privacidad

### Google Search Console

- Activar cuando exista dominio definitivo.
- Preferir una propiedad de dominio verificada por DNS TXT.
- Publicar `sitemap.xml`, comprobarlo con inspeccion de URL y enviarlo desde el
  informe de Sitemaps.
- No depende de cookies ni debe esperar al banner de consentimiento.

### Google Analytics 4

- Usar un ID `G-...` por entorno; produccion y previews no comparten datos.
- Consentimiento basico implementado: la etiqueta no se carga ni se consulta su
  configuración antes de que el usuario acepte analitica.
- Configurar Consent Mode v2 con analitica y publicidad denegadas por defecto;
  no activar funciones publicitarias en la primera version.
- No enviar nombres, emails, telefonos, textos de formularios ni identificadores
  de cliente como parametros de evento.
- `GA_MEASUREMENT_ID` se resuelve en servidor por entorno y falla cerrado si
  falta o no cumple el formato; no existe un ID real en el repositorio.

### Microsoft Clarity

- Usar un proyecto separado para produccion.
- Cargar Clarity solo tras aceptar analitica y comunicar cambios mediante la API
  ConsentV2.
- Mantener enmascarados formularios, datos de contacto y cualquier contenido que
  pueda identificar a una persona.
- `CLARITY_PROJECT_ID` sigue el mismo modelo por entorno; la retirada envía el
  estado denegado, limpia cookies detectables y detiene la etiqueta mediante una
  recarga controlada si ya estaba activa.

### Eventos iniciales

- `cta_select` con ubicacion y destino.
- `project_open` con slug publico.
- `solution_open` con slug publico.
- `contact_channel_select` con canal, nunca con el dato de contacto.
- `form_start`, `form_error` y `form_submit` sin contenido de campos.
- `consent_update` con categorias, sin identificadores personales.

## Backlog priorizado

La puntuacion usa `(impacto + riesgo) x (6 - esfuerzo)`, con valores de 1 a 5.

| Trabajo | Impacto | Riesgo | Esfuerzo | Puntuacion | Estado |
|---|---:|---:|---:|---:|---|
| Mantener cerrada la puerta de publicacion | 5 | 5 | 1 | 50 | Protegido; conservar |
| Corregir nombres accesibles del hub | 4 | 4 | 1 | 40 | Completado |
| Consentimiento antes de GA4 y Clarity | 5 | 5 | 3 | 30 | Completado técnicamente; activación bloqueada |
| Retirar JPEG y asset huerfano | 4 | 3 | 1 | 35 | Completado |
| Imagenes responsivas y cache versionada | 3 | 2 | 3 | 15 | Portada, hub y casos completados |
| Externalizar CSS/JS y endurecer CSP | 3 | 3 | 4 | 12 | Completado salvo bootstrap App Router; decisión en ADR-006 |
| Tipado, tests y CI | 5 | 4 | 5 | 9 | Fases 1 y 4 |

La puntuacion no convierte una migracion grande en urgente por si sola: el sitio
actual ya rinde bien. Sirve para resolver primero los riesgos de publicacion,
accesibilidad y privacidad, y despues mejorar la arquitectura sin una reescritura
precipitada.

## Fases de ejecucion

### Fase 0 — Cerrar la base actual

- [x] Resolver el solape de la iteracion de evidencia y conservar su commit.
- [x] Corregir los nombres accesibles del hub de proyectos.
- [x] Mantener los JPEG masters fuera del repositorio y solo WebP publicables dentro.
- [x] Separar el CSS y el comportamiento cliente de la plantilla monolitica de
  portada sin cambiar su salida funcional.
- [x] Congelar mediciones Lighthouse de referencia para las rutas principales.
- [x] Consolidar la documentacion, corregir referencias obsoletas y definir una
  fuente de verdad por tema.

### Fase 1 — Fundacion Next.js

- [x] Crear App Router con TypeScript, ESLint, lockfile y version de Node fijada.
- [x] Migrar tokens, layout, fuentes y cabeceras sin alterar el aspecto.
- [x] Implementar las puertas `preview`/`publicar` antes de migrar contenido.
- [x] Añadir tests de datos y rutas desde el primer commit.

### Fase 2 — Portada y sistema de componentes

- [x] Dividir la portada monolitica en secciones servidoras.
- [x] Mantener el menu movil y la navegacion sticky como una unica isla cliente.
- [x] Sustituir el JavaScript heredado y retirar `unsafe-inline` de `style-src`;
  `script-src` conserva la excepcion temporal del bootstrap estatico de App Router.
- [x] Verificar equivalencia visual, accesible y de rendimiento sin retirar la
  plantilla vieja.

### Fase 3 — Evidencia y soluciones

- [x] Migrar `/proyectos/` y `/proyectos/[slug]` desde los JSON actuales.
- [x] Incorporar la puerta de `/soluciones/` solo para ofertas que superen sus
  condiciones de salida; no publicar borradores internos por el hecho de existir.
- [x] Añadir metadatos y Open Graph por ruta; canonical, URL e imagen absoluta
  permanecen condicionados al dominio real.

### Fase 4 — Calidad de entrega

- [x] Añadir GitHub Actions como check obligatorio y estricto de `main` mientras
  el repositorio fue público, y dejar la preview de Vercel preparada tras un
  entorno protegido, secretos y un interruptor apagado por defecto; ADR-009
  conserva el gate en privado mediante CI, hook local y gobernanza.
- [x] Añadir tests unitarios de reglas de publicacion y tests de navegador de rutas,
  navegacion, foco, responsive y errores de consola.
- [x] Automatizar presupuestos Lighthouse móviles para portada, hub y un caso:
  rendimiento compuesto >= 90 como smoke, accesibilidad y buenas prácticas 100,
  TBT <= 200 ms, CLS <= 0,1 y LCP de laboratorio <= 3 s local/3,25 s en CI. El
  objetivo de campo sigue en 2,5 s.

### Fase 4.5 — Consolidación y cutover

- [x] Fusionar la PR 5 y mantener la preview Vercel apagada.
- [x] Corregir WCAG 2.5.3 en los seis enlaces de portada y añadir una regresión
  específica de `label-content-name-mismatch`.
- [x] Sustituir el booleano de permiso por trazabilidad de estado, alcance,
  fuente, fecha, referencia documental y revisión legal.
- [x] Convertir fechas incompletas y domicilio no validado a `null`.
- [x] Revisar la exposición del repositorio y bloquear auditorías e informes
  locales en `.gitignore`.
- [x] Migrar aviso legal, privacidad, sitemap y metadatos de portada.
- [x] Adoptar Next/Vercel con prerenderizado y cabeceras como salida única;
  retirar builder, checker y plantillas legacy.
- [x] Verificar 41 pruebas unitarias, 36 ejecuciones Playwright y los tres
  presupuestos Lighthouse sin desplegar.

### Fase 5 — Analitica, SEO y consentimiento

- [x] Implementar el panel de consentimiento y sus pruebas antes de GA4 o Clarity.
- [x] Definir IDs por entorno con validación cerrada y comprobar que una negativa
  genera cero requests de configuración o analitica.
- [x] Añadir información permanente, retirada, caducidad a 180 días, Consent Mode
  v2 con publicidad denegada y Clarity ConsentV2.
- [ ] Configurar IDs reales solo después de aprobar proveedores, textos y entornos.
- [ ] Con dominio definitivo, activar canonical, sitemap, Search Console y datos
  estructurados finales.

### Fase 6 — Publicacion controlada

- [x] Retirar los siete deployments legacy de Vercel y comprobar que proyecto,
  alias y dominios quedan sin una web accesible.
- [x] Cambiar el repositorio a privado en GitHub Free y sustituir el enforcement
  remoto de pago por CI en PR, bloqueo local de `main` y ADR-009.
- [x] **6.1 · Decisión:** aprobar ADR-010 para idiomas/URLs y ADR-011 para
  captación minimizada con Resend, sin activar tratamiento.
- [x] **6.2 · Datos:** exigir en/de/es/fr en marca, ofertas, proyectos, imágenes y
  datos desconocidos; registrar revisión profesional por idioma como pendiente.
- [x] **6.3 · Aplicación:** generar 52 páginas localizadas, selector equivalente,
  `<html lang>` exacto y redirecciones de las rutas españolas legacy.
- [x] **6.4 · SEO técnico:** preparar metadata, Open Graph, canonical, `hreflang`,
  `x-default` y sitemap derivados; mantenerlos cerrados hasta dominio/publicación.
- [x] **6.5 · Captación:** implementar contacto localizado, validación, límites,
  antiabuso y adaptador Resend fail-closed, sin adjuntos ni base de leads.
- [x] **6.6 · Consolidación:** verificar datos, render, rutas, red, WCAG, foco,
  consentimiento, Chromium, WebKit y Lighthouse multilingüe.
- [x] **6.6.1 · Consolidación técnica inmediata:** eliminar overflow interno de
  titulares entre 320 y 390 px, probar todas las ramas de contacto, tipar destinos
  de navegación, verificar canonical/hreflang absolutos con dominio inyectado,
  retirar el SLA de respuesta no acreditado y separar el presupuesto SEO de
  preview (65) del candidato público (95).
- [x] **6.7.0 · Puerta ejecutable:** derivar un `NO-GO` reproducible de identidad,
  revisión, proveedor y permisos mediante `npm run check:activation`; documentar
  el expediente exacto de entrada y el rollback sin activar superficies públicas.
- [x] **6.7.1 · Nombre comercial:** integrar `Obraxen` desde `data/brand.json`
  por selección expresa del usuario, sin atribuir existencia a la sociedad,
  dominio, buzón o permisos documentales aún pendientes.
- [x] **6.7.2 · Dominio y correo:** verificar `obraxen.com`, Google Workspace,
  MX/SPF/DKIM/DMARC y los alias de privacidad/informes; integrarlos en
  `data/brand.json` sin conectar DNS web, Vercel ni publicación.
- [ ] **6.7 · Activación:** aprobar las cuatro traducciones, DPA/subencargados y
  textos legales; completar identidad, teléfono y permisos; ejecutar
  auditoría candidata y decisión expresa de publicación.
- [ ] Completar identidad, sociedad, contacto y textos legales.
- [ ] Documentar o anonimizar los seis casos y revisar profesionalmente privacidad
  y cookies.
- [ ] Auditar la URL candidata, aprobar expresamente y activar manualmente el
  despliegue con rollback documentado.

## Puerta de calidad

- Lighthouse móvil por ruta: rendimiento compuesto >= 90 como smoke,
  accesibilidad 100 y buenas prácticas 100; LCP, TBT y CLS conservan sus límites
  duros. SEO >= 65 en preview noindex y >= 95 cuando la publicación sea real.
- LCP < 2,5 s, INP < 200 ms y CLS < 0,1 en datos de campo.
- Cero hallazgos serios o criticos de axe y cero errores de consola/red.
- Ninguna ruta publica contiene `PENDIENTE`, datos ficticios o afirmaciones no
  respaldadas.
- Todas las imagenes tienen dimensiones, `sizes` y formato moderno; el primer
  viewport no descarga imagenes ajenas a su contenido.
- Rechazar analitica impide cargar GA4 y Clarity; cambiar preferencias aplica el
  nuevo estado sin recargar datos personales.
- `main` solo integra cambios mediante PR con el `Quality gate` remoto del SHA
  actual verde; el hook local bloquea el push directo.

## Siguiente hito recomendado

Resolver las 36 incidencias que informa `npm run check:activation` mediante el
expediente definido en `ACTIVATION_GATE.md`: revisión lingüística profesional
en/de/es/fr, identidad y sociedad, permisos de casos/fotografías, revisión legal,
aceptación documentada del proveedor y teléfono o WhatsApp. Con cero bloqueos y
autorización expresa se construirá una URL candidata protegida, se auditará y se
pedirá la decisión de publicación. Hasta entonces, formulario, despliegues,
indexación y analítica real permanecen apagados.

## Referencias oficiales de implementacion

- [Next.js App Router](https://nextjs.org/docs/app)
- [Estructura de proyecto Next.js](https://nextjs.org/docs/app/getting-started/project-structure)
- [Integracion de terceros en Next.js](https://nextjs.org/docs/app/guides/third-party-libraries)
- [Metadata, robots y sitemap en Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- [Vercel para repositorios GitHub](https://vercel.com/docs/git/vercel-for-github)
- [Consent Mode para web](https://developers.google.com/tag-platform/security/guides/consent)
- [Verificacion de Search Console](https://support.google.com/webmasters/answer/9008080?hl=es)
- [Sitemaps en Search Console](https://support.google.com/webmasters/answer/7451001?hl=es)
- [Clarity ConsentV2](https://learn.microsoft.com/en-gb/clarity/setup-and-installation/clarity-consent-api-v2)
- [AEPD: cookies para herramientas de medicion](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf)
