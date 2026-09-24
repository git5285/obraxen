# Retirada local del legado

## Estado y alcance — 2026-09-24

Candidata: `/Users/danielgarcia/Projects/Obraxen/.vercel/candidates/architecture-boundaries-20260924`.
Base Git: `308ed7aecd105223383c7c3dd8341af059a4b078`.
Cambios locales sin commit; no representan el estado publicado.
Borrado local autorizado expresamente por el usuario: exactamente 144 archivos
del inventario `legacy-retirement-files.json`. Sus hashes documentan el estado
anterior al borrado. La clave histórica `deleteAfterApproval` conserva la lista,
no indica una autorización pendiente.

Recuperación disponible: commit base y archivo local
`/private/tmp/obraxen-retirement.tA0wpa/legacy-before-retirement.tar` (144 entradas,
incluye los adaptadores preparatorios). Cualquier restauración debe reconciliar
los consumidores y cambios posteriores; no es un rollback de producción.
Los node_modules anteriores también se conservaron en ese directorio temporal.

## Arquitectura resultante

- Home pública: `apps/public-site/`, sin cambios de contenido, diseño, recursos,
  interacciones, idiomas ES/EN/DE, mailto ni noindex. HTML canónico y JS existentes
  siguen generando la aplicación a través de `scripts/public-site.mjs`.
- Dominio interno: `domain/publication/` conserva los contratos Zod, lectores
  de marca/proyectos/ofertas y evidencia de autorización extraídos del legado.
  Consume `data/`, no Next.js ni Home. No se crea un paquete adicional.
- Automatización: `automation/agents/`, scripts y gate se conservan.
  `check-activation.mjs` consume la política independiente y mantiene sus seis
  bloqueos internos y ausencia de autorización para publicar.
- Aplicación retirada: `src/`, configuración Next raíz, E2E y herramientas
  exclusivas del legado. No se trasladan APIs, Resend, analítica, francés ni
  páginas nuevas. Los cuatro idiomas del contrato interno no amplían Home.
- Datos y recursos históricos: `data/`, `img/`, `css/`, `public/` intactos.
  No son automáticamente contenido aprobado para la web ni archivos descartables.

## Cambios de mantenimiento

1. Suites explícitas Home/herramientas/publicación interna:
   `test:home`, `test:tooling`, `test:publication`.
   El inventario rechaza suites sin clasificar, duplicadas o inexistentes;
   `npm test` y cobertura siguen ejecutando todas las suites conservadas.
   Coste nuevo: clasificar cada suite nueva.
2. Gate y CI ejecutan lint, tipos internos, cobertura, build Home y navegador Home.
   Se retiran comandos y checks exclusivos de la aplicación eliminada.
   Auditoría de dependencias, protección de bundles y permisos de CI se conservan.
   El preview condicionado no se activa ni se modifica.
3. Tipos y cobertura apuntan al dominio y herramientas reales, sin alias a src
   ni tipos generados por la antigua aplicación. Umbrales de cobertura intactos.
4. Se eliminan Lighthouse y @axe-core/playwright, sin consumidores conservados.
   Lockfile recalculado offline: 94 entradas menos, ninguna versión actualizada.
   Next/React, Zod, Playwright, Vitest, ESLint, Ajv y Vercel permanecen.
   Esto no equivale a una auditoría de accesibilidad o rendimiento de Home.
5. Regresión de frontera: comprueba las 144 ausencias, datos conservados,
   exportación Home-only, detección transitiva de datos privados, comandos,
   imports y checks compartidos. El test del hook ahora contempla archivos
   nuevos y omite los borrados localmente sin exigir un commit para probar.

## Evidencia ejecutada sobre la retirada

- Instalación limpia offline: 638 paquetes con `npm ci --offline --ignore-scripts
  --no-audit --no-fund`; después `prepare:toolchain` y
  `check:security:embedded` aprobados. Este último verifica solo dos bundles
  revisados de Vercel, no certifica todo el código de terceros.
- Runner local `node automation/agents/runtime.mjs exec -- node
  scripts/quality-gate.mjs`: lint, typecheck, cobertura, build y navegador PASS,
  sin reutilizar recibo. 42 suites, 791 tests; statements 95,45 %, branches
  91,42 %, functions 95,23 %, lines 95,38 % en el ámbito configurado.
- Navegador: seis vistas ES/EN/DE a 1440/390 px, incluyendo navegación, imágenes,
  vídeo, carrusel, sectores, diálogo, consulta, idiomas y legal.
- Exportación aislada `prepare:home -- --output=/private/tmp/obraxen-retirement.tA0wpa/home
  --allow-worktree`: built-local, rutas /, /en, /de; exactCommit null,
  publicationAuthorized false. No src, dominio ni datos internos como inputs.
- YAML de CI parseado; diff sin errores; conjunto de borrados coincide exactamente
  con el inventario. Home/datos/recursos conservados sin diff frente a HEAD.
- Primer ensayo: dos fallos de fixtures del gate/hook después de reducir checks
  y borrar archivos; corregidos y repetidos en la batería completa anterior.
- No ejecutados: npm audit remoto, `npm run check:quality` completo, CI remoto,
  commit, push, merge ni despliegue. No se certifican vulnerabilidades actuales
  ni tráfico/uso externo de URL antiguas.

## Integración con trabajo concurrente

El control conserva HEAD `88eb051f9ae16602e8e3c174bf921736ed76ddac` y cambios
previos; no se copia la candidata encima. Comparación de 660 archivos de control:
658 sin cambios; AGENTS.md y WORKING_CHECKOUT.md cambiaron bajo la tarea cognitive,
no por esta retirada. Sus reservas de documentación/checkout-context se respetan.
Las guías generales y el campo descriptivo legacy del checkout-context todavía
pueden mencionar src: al integrar ambas candidatas deben reflejar esta retirada.
La versión de checkout-context de esta candidata no admite aún --expected-root
ni --expected-head; se verificaron ruta y HEAD con su salida sin opciones y Git.
No es un consumidor ejecutable del legado ni afecta el build.

## Comportamientos y siguientes entregas

- Contenido: editar HTML canónico y traducciones Home; ejecutar tests Home/build.
- Interacciones: modificar solo JS/HTML actual; probar foco, teclado, móvil,
  idiomas y ausencia de envío automático.
- Candidata: exportador existente, inventario Home-only y gates obligatorios.
  Los recibos anteriores no acreditan un SHA futuro ni sustituyen checks remotos.
- Datos: conservar validaciones, referencias, fechas y autorización; no convertir
  campos desconocidos en afirmaciones públicas.
- Publicación y entrega Git quedan fuera de esta autorización local.

## Integración posterior de guías y mejoras cognitive

Se integran las cinco mejoras liberadas: diagnóstico de checkout con detección
real del legado, guías delimitadas, aliases Home e inventario positivo,
cuatro claves estables de traducción y status --active. La Home solo cambia
atributos de traducción, no su texto o diseño. Las pruebas y cifras anteriores
corresponden a la retirada previa; la integración tiene su propia validación.
Las guías de esta candidata ya están reconciliadas; control y candidata fuente
cognitive se preservan. El exportador incluye scripts/scoped-command.mjs.
