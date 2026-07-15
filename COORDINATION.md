# Estado de coordinación

Actualizado: 2026-07-15 15:48 Europe/Madrid.

Este tablero resume el estado actual. Las reservas exactas viven en
`.coordination/claims/` y las entregas históricas en `.coordination/handoffs/`.

## Tareas activas

| Tarea | Alcance exclusivo | Estado |
|---|---|---|
| Naming (`019f60e5...`) | Investigación sin escritura funcional | En curso; ningún nombre seleccionado |
| Preparación Fase 6 (`5fd4304a...`) | Vercel legacy, privacidad Git y controles de lanzamiento | En curso; retirada Vercel cerrada y guardas Git preparadas |

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
- La preview permanece cerrada; no hay autorización de publicación o despliegue.
- El proyecto Vercel se conserva sin deployments ni dominios; sus diez URLs
  históricas y alias comprobados responden 404 tras la retirada del 15 de julio.
- Naming está abierto solo como investigación. Selección, sociedad, dominio y
  contacto siguen pendientes.

## Orden siguiente

1. Decidir mercado/idiomas y sistema completo de captación antes de implementar
   URLs internacionales o contacto.
2. Mantener previews, indexación, analítica real y publicación apagadas hasta
   completar identidad, permisos, legal, dominio y autorización expresa.

No se inicia `/soluciones/`, analítica, contacto, indexación ni despliegue como
efecto lateral de esta coordinación.
