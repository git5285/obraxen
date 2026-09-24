# Incorporación y deuda cognitiva

Alcance: Home en `apps/public-site/`, dominio interno en `domain/publication/` y automatización interna
en `automation/agents/`. Este recorrido describe la candidata local; no acredita
merge, CI ni publicación. El control puede conservar otro HEAD y cambios ajenos.

## Recorrido de mantenimiento

1. Desde la raíz elegida, ejecutar `node scripts/checkout-context.mjs`. Registrar
   `root`, `controlRoot`, `checkoutRole`, `head` y `dirty`; consultar el archivo
   `designationFile` si existe. No sustituir una designación local por un estado
   Git copiado en prosa. Las opciones `--expected-root=<ruta>` y
   `--expected-head=<SHA>` verifican la expectativa; no seleccionan otro checkout.
2. Leer `AGENTS.md` y la mecánica pertinente de `.coordination/README.md`.
   `node automation/agents/operations.mjs status --active` muestra las reservas
   registradas activas después de validar toda la cadena. Un estado bloqueado o
   pendiente de revisión conserva ownership. La vista no reemplaza preflight ni
   las claims antiguas sin registro. Una inspección de lectura no crea claim.
3. Para Home, abrir `HOMEPAGE.md`, `apps/public-site/public/index.html` y el
   catálogo `public/assets/home-i18n.js`. Mantener la clave `data-i18n`; español
   renderizado en HTML, variantes revisadas en el catálogo ES/EN/DE. Los cuatro
   resúmenes de soluciones ya usan claves estables. No editar el módulo generado
   ni los diccionarios de `src/` para cambiar esta Home.
4. Consultar `test:home -- --list`, ejecutar `test:home` para el contrato y
   `check:home` para lint, unitarias, build y navegador Home. Los comandos
   explícitos son `dev:home`, `build:home`, `start:home`, `test:e2e:home`.
   Los cuatro aliases Home anuncian su destino. `tests/homepage.test.tsx`, el
   alias `@`, `test:e2e` y Lighthouse se retiraron junto con el legado. La cobertura
   general incluye otras pruebas, pero sus umbrales no miden el HTML Home.
5. Antes de una entrega Git, aplicar el gate completo y su autorización externa
   de seguridad; conservar el hook y CI del SHA exacto. Publicar es otra decisión,
   con artefacto, proyecto, entorno y alcance de rutas explícitos. Seguir el
   apartado A del runbook para Home; B es archivo histórico del legado retirado. Ningún diagnóstico local,
   handoff histórico o check aislado sustituye estas condiciones.

## Criterios observables

| Hallazgo | Cambio y criterio de aceptación |
|---|---|
| DC-01, checkout | La candidata incorpora el diagnóstico liberado y añade detección del legado; distingue control/worktree y rechaza ruta/SHA inesperados. Los caminos designados no duplican HEAD/suciedad. Prueba: `tests/checkout-context.test.ts` y ejecución real en ambas raíces. |
| DC-02, documentación | El índice enlaza fuentes con alcance; arquitectura/roadmap/métricas del legado no se presentan como estado general de Home. Los requisitos legales y de entrega permanecen. Recorrido: README → HOMEPAGE → fuente/pruebas → runbook A. |
| DC-03, selección de pruebas | Comandos explícitos por aplicación y aliases que anuncian destino, preservan argumentos y errores. Inventario positivo `tests/unit-test-groups.json` para Home/publicación interna/tooling; pruebas nuevas, obsoletas o duplicadas fallan. `test:coverage` conserva todas las suites. Pruebas: `tests/unit-test-groups.test.ts`, `tests/scoped-command.test.ts`. |
| DC-04, traducción | Cambiar puntuación española en cualquiera de los cuatro resúmenes conserva EN/DE y no genera ausencias; una clave desconocida y textos nuevos sin traducción siguen fallando. Prueba: `tests/public-home.test.ts`. Migrar otras zonas solo cuando se editen, con revisión de sus traducciones. |
| DC-05, coordinación | `status --active` incluye reservado/en_curso/bloqueado/esperando_revision y sus rutas; `status` mantiene su formato completo. Una cadena liberada corrupta sigue haciendo fallar la vista filtrada. Las lecturas no escriben eventos. Prueba: `tests/agents/operations.test.ts`. |

## Fuentes, complejidad y entrega

Esta candidata integra las cinco mejoras liberadas de cognitive-debt con la
retirada del legado. Se han reconciliado comandos, inventario y documentación:
no se reintroducen src, sus dependencias ni sus pruebas. El control y la candidata
original de cognitive-debt se conservan sin cambios. El exportador Home incluye
el nuevo delegado de aliases para que el comando de build funcione aislado.

Los idiomas y la revisión profesional son requisitos de contenido; separar su
clave de la puntuación reduce mantenimiento sin sustituir esa revisión. El log
inmutable, la propiedad por archivo y los gates siguen vigentes: se reduce lo
que hay que leer en una consulta cotidiana, no la evidencia que se valida.

El HTML generado permanece derivado y fuera de Git. Los hashes de recuperación
son históricos; el inventario de candidata compara sus fuentes actuales. Los
resultados concretos de esta implementación se registran en su handoff, con
comandos y límites. No mantener aquí un segundo contador de tests ni resultados
remotos que queden desactualizados al siguiente cambio.
