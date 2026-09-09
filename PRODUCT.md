# Product: Obraxen

<!-- impeccable:product-schema 1 -->

Registro del producto existente, consolidado el 9 de septiembre de 2026 a partir
de `STRATEGY.md`, `README.md`, `data/brand.json` y las rutas implementadas.
La petición de mantenimiento autoriza esta consolidación; no añade decisiones
comerciales, capacidades ni autorizaciones de publicación.

## Platform

web

## Users

Interlocutores iniciales B2B de operaciones y mantenimiento que necesitan evaluar
la reparación y recuperación de pavimentos industriales de hormigón en uso.
Propiedad, facility management e integradores son compradores o prescriptores
por validar, según `STRATEGY.md`; no se presentan como clientes confirmados.

## Product Purpose

Explicar el alcance de Obraxen, ayudar a reconocer problemas del pavimento,
mostrar el método y la evidencia autorizada y facilitar una consulta inicial.
La web corporativa apoya la evaluación técnica; no ofrece diagnóstico automático,
presupuesto instantáneo ni contratación en línea.

## Positioning

Recuperación técnica de pavimentos industriales en uso. La estrategia parte del
síntoma, inspecciona la causa y selecciona una intervención proporcionada, con
planificación por fases cuando resulte técnicamente viable. La selección de
productos es multifabricante; Obraxen no fabrica ni formula química propia.
Estas son las directrices documentadas en `STRATEGY.md`, no garantías universales
de resultado ni de continuidad operativa.

## Operating Context

Web Next.js App Router con TypeScript y React. Los idiomas implementados son
inglés, alemán, español y francés; `/` dirige a `/en/`. El selector conserva
la ruta equivalente. Los segmentos localizados se resuelven en `src/lib/i18n.ts`.
Consultar `SITE_ARCHITECTURE.md` y el código para el mapa de rutas vigente.

## Capabilities and Constraints

- Portadas, hubs de proyectos, rutas legales y contacto implementados.
- Las fichas de casos dependen de su puerta de evidencia; los borradores internos
  no son expedientes publicables. Las ofertas internas tampoco crean rutas por sí solas.
- `data/brand.json` es la única fuente de identidad, contactos y publicación.
  Conservar sus valores desconocidos como `null`; no duplicar datos legales aquí.
- Publicación, indexación, formulario, analítica y despliegues requieren las
  condiciones y autorizaciones existentes. Consultar `check:activation` para el
  estado efectivo; este documento no cambia ninguna puerta.
- Consentimiento y formulario son interacciones cliente, junto a la navegación.
  El formulario permanece condicionado por configuración y evidencia. La
  analítica no se carga antes de aceptar; puede revocarse el consentimiento.
- No prometer ausencia de paradas, plazos, certificaciones ni resultados de
  medición sin prueba específica. No incorporar testimonios o precios inventados.
- La revisión profesional de traducciones y documentación legal sigue siendo
  una condición externa; este registro no la sustituye.

## Brand Commitments

Obraxen es el nombre comercial seleccionado. Preservar el wordmark v14 consumido
por `src/components/logo-mark.tsx`; no confundir su incorporación con autorización
marcaria o legal. Voz directa, profesional y comprensible, con límites técnicos
explícitos. La apariencia implementada se registra en `DESIGN.md`.

## Evidence on Hand

`data/proyectos.json` conserva los casos y su trazabilidad; `data/ofertas.json`,
las ofertas internas y sus límites. `img/`, `PHOTO_AUDIT.md` y los registros de
fotografía documentan activos existentes. Cada fotografía usada como prueba debe
conservar procedencia y autorización aplicable. No transferir proyectos, clientes,
certificaciones ni resultados de BECOSAN/deepEX a Obraxen.

## Product Principles

- Evidencia verificable antes que afirmaciones comerciales.
- Diagnóstico y límites antes que prescripción universal.
- Igual alcance funcional en los cuatro idiomas.
- Estado pendiente explícito; nunca completar incógnitas con estimaciones.

## Accessibility & Inclusion

Conservar los requisitos documentados: contraste de texto 4.5:1 (3:1 en texto
grande), foco visible, teclado, nombre accesible coherente con el visible,
alternativas para fotografías significativas, reflow móvil y movimiento reducido.
Son requisitos y objetivos de comprobación, no una certificación de conformidad.
