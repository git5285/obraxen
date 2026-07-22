# Coordinación obligatoria

Estas reglas se aplican a cualquier tarea que trabaje en este repositorio.

## Antes de editar

1. Lee `COORDINATION.md` y `.coordination/README.md` completos.
2. Revisa `git status --short` y las claims activas.
3. Consulta los últimos handoffs relacionados.
4. Crea un marcador con archivos exactos en tu propio
   `.coordination/claims/<thread-id>.md` dentro del worktree de control; no lo
   añadas a la rama candidata.
5. Registra ese marcador antes de editar con
   `automation/agents/operations.mjs register`.

## Propiedad y cambios ajenos

- Un archivo solo puede tener una tarea editora.
- No edites una reserva activa sin entrega secuencial o autorización expresa del
  usuario registrada en ambas claims.
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
- Ninguna tarea despliega o publica sin autorización expresa.

## Flujo Git obligatorio

- Configura los hooks versionados con `git config core.hooksPath .githooks` antes
  del primer push desde cada clon.
- Nunca hagas push directo a `main` ni omitas el hook con `--no-verify`.
- Toda rama ejecuta `npm run check:quality` antes de subir y abre una pull request.
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
