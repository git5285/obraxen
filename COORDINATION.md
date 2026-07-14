# Estado de coordinación

Actualizado: 2026-07-14 18:24 Europe/Madrid.

Este tablero resume el estado actual. Las reservas exactas viven en
`.coordination/claims/` y las entregas históricas en `.coordination/handoffs/`.

## Tareas activas

| Tarea | Alcance exclusivo | Estado |
|---|---|---|
| Naming (`019f60e5...`) | Investigación sin escritura funcional | En curso; ningún nombre seleccionado |

El usuario autorizó transferir `PRODUCT.md`, `CONTENT_AUDIT.md`, `STRATEGY.md`,
`AGENTS.md`, `COORDINATION.md` y `.coordination/**` a la consolidación documental.
Los cinco archivos funcionales de evidencia se transfirieron secuencialmente a
la tarea de cierre de Fase 0 por orden expresa del usuario; el handoff funcional
ya estaba terminado y se preservó el checksum del índice antes de intervenir.

El índice de Git todavía contiene las versiones staged históricas de
`PRODUCT.md`, `CONTENT_AUDIT.md` y `STRATEGY.md`; no se modificó para preservar el
trabajo ajeno. La tarea de Fase 0 debe preparar un manifiesto nuevo con solo los
cinco archivos funcionales de evidencia antes de su primer commit y no usar el
índice actual de forma global.

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
  `78e7d9c`; documentación, estrategia y coordinación forman el cierre final.

Los detalles de cada entrega permanecen en sus handoffs; no se duplican aquí.

## Decisiones vigentes

- `STRATEGY.md` centraliza empresa, perfil operativo, oferta y mercado.
- `CONTENT_AUDIT.md` controla copy y evidencia publicable.
- `SITE_ARCHITECTURE.md` controla rutas.
- `ROADMAP.md` controla la migración a Next.js y la entrega.
- `data/brand.json`, `data/proyectos.json` y `data/ofertas.json` siguen siendo las
  fuentes estructuradas de identidad, casos y ofertas.
- La preview permanece cerrada; no hay autorización de publicación o despliegue.
- Naming está abierto solo como investigación. Selección, sociedad, dominio y
  contacto siguen pendientes.

## Orden siguiente

1. Revisar e integrar `codex/phase-0-baseline` mediante el flujo GitHub cuando se
   autorice el push y la pull request.
2. Abrir una claim nueva y una rama propia para la Fase 1 de `ROADMAP.md`.
3. Mantener la base estática hasta alcanzar paridad en Next.js.

No se inicia `/soluciones/`, analítica, contacto, indexación ni despliegue como
efecto lateral de esta coordinación.
