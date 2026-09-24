# Coordinación obligatoria

Antes de trabajar, ejecutar `node scripts/checkout-context.mjs` desde la raíz
elegida (también disponible como `npm run check:checkout`). Registrar ruta, HEAD,
rol control/worktree y cambios pendientes. Consultar `designationFile` si existe
para elegir la candidata de la tarea; el diagnóstico no la selecciona ni acredita
estado remoto. Se puede exigir `--expected-root=<ruta>` y `--expected-head=<SHA>`.
No sincronizar automáticamente un control preservado.

Home actual: `apps/public-site/` y `HOMEPAGE.md`. `src/` fue retirado de esta
candidata; historial y recuperación en `docs/LEGACY_RETIREMENT.md`.
Dominio interno conservado: `domain/publication/` y `data/`.
Automatización interna: `automation/agents/`; no es una aplicación pública.

Estas reglas se aplican a cualquier tarea que trabaje en este repositorio.

## Antes de editar

Una tarea de solo lectura no crea claim. `COORDINATION.md` es un resumen opcional.

1. Lee, de `.coordination/README.md`, «Alcance y lectura»,
   «Ciclo obligatorio por tarea», «Plantilla de claim» y «Conflictos».
   Consulta «Registro operativo» antes de registrar o cerrar una claim;
   «Plantilla de handoff» antes de entregar y «Autorizacion agrupada de entrega»
   solo para esa vía. No releas contenido vigente ya disponible en el contexto.
2. Revisa `git status --short` y las claims activas con
   `node automation/agents/operations.mjs status --active` (solo lectura).
3. Consulta handoffs relacionados solo cuando sean necesarios para resolver
   propiedad, una decisión vigente o una dependencia del cambio. No recorras
   historial cerrado como requisito general de arranque.
4. Crea un marcador con archivos exactos en tu propio
   `.coordination/claims/<thread-id>.md` dentro del worktree de control; no lo
   añadas a la rama candidata.
5. Registra ese marcador antes de editar con
   `automation/agents/operations.mjs register`.

## Propiedad y cambios ajenos

- Un archivo solo puede tener una tarea editora.
- No edites una reserva activa sin entrega secuencial o autorización expresa del
  usuario registrada en las dos cadenas operativas. No reescribas marcadores
  registrados para documentar una transferencia.
- Los cambios staged o sin commit de otra tarea se preservan y se verifican por
  nombre o checksum antes y después del trabajo.
- Un marcador registrado es inmutable. Sus cambios de estado se añaden al log
  operativo compartido; no se reescribe el Markdown para simular una transición.
- No uses `git add .`, `git add -A`, commits globales ni comandos destructivos.

## Cierre

- Registra los hitos con `operations.mjs transition` y conserva evidencia
  tipada para cualquier liberación o reapertura.
- Registra en un handoff las decisiones de ingeniería que deban viajar con la
  candidata. El estado remoto posterior vive en el log operativo o en la PR.
- Deja la claim efectiva en `liberado` cuando no quede trabajo bajo su alcance.
  No abras otra PR solo para actualizar claim, handoff o estado post-merge.
- Ninguna tarea despliega, publica, activa Vercel, formularios, analítica o
  indexación sin autorización humana expresa y separada.

## Flujo Git obligatorio

- Configura los hooks versionados con `git config core.hooksPath .githooks` antes
  del primer push desde cada clon.
- Nunca hagas push directo a `main` ni omitas el hook con `--no-verify`.
- Toda rama ejecuta `npm run check:quality` antes de subir y abre una pull request.
  El hook usa `--reuse --head <sha>`: solo reutiliza lint, tipos, tests con
  cobertura y build si el recibo local verificable tiene menos de una hora y
  coincide con todos sus inputs. Seguridad, navegador y CI se ejecutan de nuevo.
  Sin evidencia válida se ejecutan todos los checks; nunca se omite el hook.
- Solo se fusiona el SHA revisado cuando su ejecución remota `Quality gate` está
  verde. GitHub Free no impone este check en repositorios privados: esta regla y
  el hook local son obligatorios para todas las tareas.

## Autorizaciones agrupadas

- Una sola decisión humana puede autorizar la secuencia exacta `commit de
  candidata -> push de rama -> PR borrador` mediante
  `automation/agents/authorizations.mjs`.
- La autorización debe fijar repositorio, candidata, base, rama `codex/`, rutas
  exactas sin comodines, estado de activación, checks, orden y caducidad. Cada paso se reserva una vez y se
  consume con un token que no se guarda en claro.
- Esta vía no activa las banderas permanentes de autoridad, no puede ser creada
  por un agente a partir de una inferencia y no permite al builder usar Git.
- Una reserva caducada o una cadena corrupta bloquean el resto; no se reintentan
  ni se recuperan automáticamente.
- Merge, despliegue, publicación, borrado y rollback destructivo quedan fuera de
  toda autorización agrupada y requieren una confirmación humana separada.

## Límites permanentes

- La evidencia real prevalece sobre cualquier afirmación comercial.
- Nombre, sociedad, dominio, contacto y legal no se inventan.
- La investigación de naming no autoriza selección, compra ni integración.
- Los datos desconocidos permanecen `null`, `sin dato` u omitidos.

## Alcance de herramientas y documentación

Obraxen usa su flujo existente de Next.js y Vercel. No selecciones Sites para
ediciones ordinarias: solo corresponde a una petición explícita de usar Sites
o a un proyecto identificado por `.openai/hosting.json`. La selección de una
skill nunca autoriza migrar de proveedor, registrar, publicar ni desplegar.

Consulta las guías locales Next.js cuando el cambio dependa de sus APIs,
convenciones, renderizado, routing o configuración. En una corrección puramente
textual o documentación ajena al framework no hay una guía Next.js pertinente
que cargar. Conserva el bloque generado siguiente sin modificarlo.

Para código ajeno a Next.js no se exige una guía del framework: «relevant guide»
en el bloque siguiente se refiere únicamente a los aspectos de Next.js afectados.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
