# Estado de coordinación

Actualizado: 2026-07-16 16:27 Europe/Madrid.

Este tablero resume el estado actual. Las reservas exactas viven en
`.coordination/claims/` y las entregas históricas en `.coordination/handoffs/`.

## Tareas activas

No hay tareas editoras activas. La claim `9548505b...` queda liberada tras el
cierre local de la auditoría y endurecimiento del sistema de mejora continua;
no hubo push, cambio en Git remoto, despliegue ni publicación.

El usuario autorizó transferir `PRODUCT.md`, `CONTENT_AUDIT.md`, `STRATEGY.md`,
`AGENTS.md`, `COORDINATION.md` y `.coordination/**` a la consolidación documental.
Los cinco archivos funcionales de evidencia se transfirieron secuencialmente a
la tarea de cierre de Fase 0 por orden expresa del usuario; el handoff funcional
ya estaba terminado y se preservó el checksum del índice antes de intervenir.

El índice heredado se resolvió mediante manifiestos exactos: los cinco archivos
funcionales de evidencia se integraron solos, los tres Markdown conservaron su
contenido final y las demás entregas se separaron por procedencia. No quedan
cambios staged sin propietario.

## Entregas cerradas

- Modelo de ofertas y evidencia: commit `834f5df`.
- Hub técnico `/proyectos/`: commit `b020886`.
- Optimización inicial de imágenes: 18 WebP validados.
- Auditoría, simplificación de portada y corrección WCAG 2.5.3: handoff
  `019f6119-3a7f-7122-88a4-75b6a5a41b45`.
- Consolidación documental: 26 Markdown auditados, `PRODUCT.md` absorbido por
  estrategia y contenido, referencias y fuentes verificadas; mismo handoff.
- Auditoría estructural y por formatos: carpetas, HTML, JSON, CSV, Python y CSS
  revisados; artefactos y código de un solo uso eliminados, CSS sin tokens muertos
  y material interno excluido de Vercel; handoff `60c275cc...`.
- Auditoría TXT/MJS/imágenes: robots de preview correcto, MJS válidos y 24
  imágenes sin metadatos sensibles, duplicados o ahorro lossless pendiente; no se
  recomprimieron derivados de evidencia; handoff `fe5fb839...`.
- Estrategia sectorial y mapa de 108 organizaciones: disponibles en
  `STRATEGY.md` y `research/sector-map.csv`.
- Fase 0 cerrada en la rama `codex/phase-0-baseline`: evidencia integrada en
  `ae28903`, portada y accesibilidad en `fdcde7d`, y limpieza estructural en
  `78e7d9c`; documentación y estrategia en `57c4268`; foco del menú móvil
  estabilizado en `0120a46` y verificado dos veces de extremo a extremo.
- Fase 0 integrada en GitHub mediante la PR `#1`; `main` queda en el merge
  `2ec10f3`.
- Fase 1 completada en `codex/next-foundation`: App Router, TypeScript estricto,
  ESLint, Node 24, validacion Zod, 10 tests y puerta de publicacion tipada; la
  salida estatica y el bloqueo de despliegue permanecen vigentes.
- Fase 1 integrada en GitHub mediante la PR `#2`; `main` queda en el merge
  `216e4b8`.
- Fase 2 completada en `codex/phase-2-homepage`: portada dividida en Server
  Components, navegacion como unica isla cliente, 17 tests, 24 imagenes
  responsive y paridad geometrica/visual verificada.
- Fase 2 integrada en GitHub mediante la PR `#3`; `main` queda en el merge
  `2fba606`.
- Fase 3 completada en `codex/phase-3-evidence`: hub y seis fichas Next
  prerenderizadas desde datos, metadata por ruta, 18 imagenes responsive,
  puerta de soluciones cerrada, 31 tests y paridad geometrica exacta.
- Fase 3 integrada en GitHub mediante la PR `#4`; `main` queda en el merge
  `117ad9a`.
- Fase 4 integrada mediante la PR `#5`; `main` queda en el merge `d010e82` con
  workflow reproducible,
  31 tests unitarios, 24 pruebas Playwright, presupuestos Lighthouse en tres
  rutas y preview Vercel preparada tras un interruptor apagado por defecto.
  `main` exige ese contexto en modo estricto incluso a administradores.
- Fase 4.5 integrada mediante la PR `#6`; `main` queda en el merge `8bbd68c`.
  WCAG 2.5.3 queda corregido y probado,
  permisos trazables, datos desconocidos normalizados, exposición revisada,
  rutas legales y sitemap migrados, y builder/HTML legacy retirados. Next.js es
  la única implementación; el preset remoto de Vercel también reconoce Next con
  salida autodetectada y `vercel build` pasa sin desplegar. El gate posterior al
  merge, run `29361794598`, está verde y la preview Vercel fue omitida; las claims
  `042123c8...` y `b376296c...` están liberadas.
- Fase 5 entregada mediante la PR `#8`: consentimiento básico con rechazo y
  aceptación equivalentes, preferencia revocable a 180 días, configuración de
  GA4/Clarity por entorno, política `/cookies/`, CSP acotada y carga posterior a
  aceptación. El gate local completo pasa con 50 unitarias, 46 ejecuciones
  Playwright y Lighthouse 97/97/98; no hay IDs reales, despliegue ni indexación.
  La claim `19c89a6e...` está liberada.
- Preparación de Fase 6 integrada mediante la PR `#10`; `main` queda en el merge
  `4fb3a18`. Los siete deployments legacy de Vercel se retiraron, GitHub es
  privado en el plan gratuito y ADR-009 sustituye la protección remota de pago
  por CI en PR, hook local y gobernanza obligatoria. El run posterior de `main`
  `29421963694` está verde, la preview fue omitida y la claim `5fd4304a...` queda
  liberada.
- Fases 6.1–6.6 integradas mediante la PR `#12`; `main` queda en el merge
  `b79c695`. La implementación nació en `codex/phase-6-eu-i18n`, commit `21f525f`:
  52 páginas en/de/es/fr, rutas equivalentes, datos localizados, contacto Resend
  fail-closed, revisión profesional como gate, ADR-010/011 y runbook NO-GO. El
  gate local pasa con 75 unitarias, 87 Playwright correctas, 6 omisiones
  intencionales, WebKit y Lighthouse 98/99/100; la claim `3531129d...` queda
  liberada sin despliegue. El run posterior de `main` `29431531128` está verde.
- Consolidación técnica inmediata entregada mediante la PR `#13`, commit
  inicial `a635299` y cabeza validada `1317129`: reflow en/de/es/fr probado desde 320 px, contacto y legales sin
  colisión CSS, navegación tipada, metadata absoluta verificable, SLA no
  acreditado retirado y presupuestos SEO diferenciados entre preview y público.
  El gate local pasa con 100 unitarias, 88 Playwright correctas, 7 omisiones
  intencionales y Lighthouse dentro de presupuesto; la claim `f31e2072...` queda
  liberada sin despliegue. El run Linux de la PR `29439664817` está verde.
- Preparación técnica 6.7.0 entregada mediante la PR `#14`, commit de
  implementación `09b6ab2`: `npm run check:activation` deriva
  38 incidencias reales de identidad/contacto (8), legal/proveedor (2), revisión
  lingüística (4) y permisos de seis casos (24). `ACTIVATION_GATE.md` define el
  expediente exacto, la diligencia pública de Resend y el rollback; el resultado
  permanece `NO-GO` y no autoriza candidata, contrato ni publicación. El gate
  local completo y el run Linux de PR `29441551157` están verdes, incluido
  WebKit y Lighthouse; la preview fue omitida y la claim `f3ad2075...` queda
  liberada.
- Ingesta controlada de identidad 6.7.1 preparada en la PR `#15`: `Obraxen`
  queda integrado únicamente como nombre comercial. Sociedad, CIF, domicilio
  publicable, dominio operativo, buzones y teléfono siguen sin acreditarse; la
  declaración general sobre los seis casos se conserva como confirmación interna
  y no sustituye permisos documentales de terceros. El gate baja de 38 a 37
  incidencias y permanece `NO-GO`. El SHA `322e1fe` corrige además contraste del
  logo de pie y reflow Linux a 320 px; el run `29454371281` está verde y la claim
  `c484b245...` queda liberada sin despliegue.
- Dominio y correo 6.7.2 entregados mediante la PR `#16`, con implementación en
  `db77afa` y corrección de reflow Linux en `103266c`: `obraxen.com`,
  `info@obraxen.com` y `privacy@obraxen.com` quedan acreditados; MX, SPF, DKIM
  y DMARC están operativos. El gate baja de 37 a 35 incidencias y permanece
  `NO-GO`. El run `29457427094` está verde, la preview fue omitida y la claim
  `4b65f9d3...` queda liberada sin despliegue.
- Sistema de mejora continua con agentes creado en la rama
  `codex/autonomous-agents` (commits `8eca8bf` y `9616cf8`): director, scout,
  builder único y auditor con veto, en modo sombra y sin autoridad de
  publicación; handoff `6751b2a1...`.
- Intake de conocimiento 2026-07-16 evaluado con evals emparejadas: ítem 01
  aceptado, 02 rechazado, 03/05 pendientes de canarios, 04/06 `no_op`; regresión
  `DISCOVERED-20260716-01` descubierta y reproducida; artefactos en
  `.agents/skills/remainon-continuous-improvement/evals/intake-20260716/`;
  handoff `71dfbceb...`.
- Seguimiento del intake entregado: preflight con fail-closed ante worktrees o
  claims ilegibles (cuatro regresiones unitarias, fixture de eval-10), contrato
  `learned_rules` promovido al informe de la skill, y `core.bare=true`
  accidental del repositorio principal restaurado a `false`; handoff
  `d1018539...`.
- Auditoría y endurecimiento del sistema autónomo cerrados localmente en
  `a160a16`: el builder queda bloqueado de forma determinista en modo sombra,
  las superficies críticas están protegidas, el lease limpia fallos parciales,
  `check:diff` valida toda la candidata desde la base revisada y QA usa puertos
  aislados. El formulario habilitado tiene prueba navegador propia y exige
  limitación externa acreditada antes de activarse. El gate final pasa con 144
  unitarias, 2 pruebas del formulario, 88 Playwright correctas, 7 omisiones
  previstas, WebKit y Lighthouse; handoff `9548505b...`.
- Automatización local `remainon-shadow-improvement` creada y activa con cadencia
  de seis horas sobre el worktree dedicado. Ejecuta un ciclo de lectura con
  director/scout, preflight y contrato estructurado; no invoca builder ni tiene
  autoridad de diff, Git remoto, despliegue o publicación.

Los detalles de cada entrega permanecen en sus handoffs; no se duplican aquí.

## Decisiones vigentes

- `STRATEGY.md` centraliza empresa, perfil operativo, oferta y mercado.
- `CONTENT_AUDIT.md` controla copy y evidencia publicable.
- `SITE_ARCHITECTURE.md` controla rutas.
- `ROADMAP.md` controla la migración a Next.js y la entrega.
- `data/brand.json`, `data/proyectos.json` y `data/ofertas.json` siguen siendo las
  fuentes estructuradas de identidad, casos y ofertas.
- ADR-007 fija Next.js con prerenderizado y cabeceras como implementación única;
  no se usa `output: export` ni se mantiene la base legacy.
- `REPOSITORY_EXPOSURE.md` controla los riesgos derivados de la visibilidad
  pública del código y datos.
- ADR-008 fija consentimiento básico: no se consulta configuración ni se carga
  GA4 o Clarity antes de aceptar; publicidad permanece siempre denegada.
- ADR-009 fija GitHub privado en el plan gratuito: cada rama pasa el gate local,
  los pushes directos a `main` están bloqueados y solo se fusiona una PR con el
  `Quality gate` remoto del SHA actual verde.
- ADR-010 fija inglés como entrada y prefijos `/en/`, `/de/`, `/es/`, `/fr/`,
  con segmentos localizados y revisión profesional obligatoria por idioma.
- ADR-011 fija Resend como adaptador técnico sin base propia; formulario y API
  permanecen fail-closed hasta aprobación documental, identidad legal y entorno.
- La activación de `/api/contact/` exige además una regla distribuida de límite
  de solicitudes acreditada mediante `CONTACT_RATE_LIMIT_MODE=vercel-waf`; el
  límite en memoria es solo defensa secundaria.
- El sistema autónomo permanece en modo sombra: scout y director pueden
  inspeccionar, pero el builder no obtiene herramientas ni autoridad de diff;
  merge, despliegue y publicación continúan siendo decisiones humanas.
- La automatización de seis horas solo acumula canarios sombra revisables. Pasar
  a `mode=active` exige una PR y decisión humana independientes.
- La preview permanece cerrada; no hay autorización de publicación o despliegue.
- El proyecto Vercel se conserva sin deployments ni dominios; sus diez URLs
  históricas y alias comprobados responden 404 tras la retirada del 15 de julio.
- `Obraxen` está seleccionado e integrado como nombre comercial por instrucción
  expresa del usuario. `obraxen.com`, `info@obraxen.com` y el alias de privacidad
  están verificados; esto no acredita disponibilidad registral o marcaria y la
  sociedad, el teléfono y la identidad legal siguen pendientes.

## Orden siguiente

1. Resolver las 35 incidencias de la puerta 6.7 con revisión profesional de
   en/de/es/fr, identidad, sociedad, teléfono, permisos, legal y DPA/proveedor
   según `ACTIVATION_GATE.md`.
2. Solo después y con autorización expresa, crear una preview protegida, auditar
   el SHA candidato y registrar la decisión formal `GO/NO-GO` del cutover público.
3. Mantener previews, indexación, formulario, analítica real y publicación
   apagados hasta completar esas condiciones.

No se inicia `/soluciones/`, analítica, contacto, indexación ni despliegue como
efecto lateral de esta coordinación.
