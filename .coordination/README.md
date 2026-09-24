# Protocolo de trabajo paralelo

Objetivo: que varias tareas puedan avanzar sin escribir sobre los mismos
archivos ni repetir decisiones.

## Alcance y lectura

`AGENTS.md` es la entrada del repositorio y `COORDINATION.md` resume las reglas
vigentes. Este documento define solo la mecánica de claims, handoffs y
transiciones. Consulta `operations.mjs status --active` para las reservas registradas
activas y sus rutas; valida toda la cadena antes de filtrar. `status` sin filtro
conserva el JSON completo para diagnóstico. Esta vista no sustituye al preflight
ni a las claims legacy sin registro operativo. Los
handoffs y claims cerrados son historial, no lectura obligatoria de arranque.

## Ciclo obligatorio por tarea

1. **Sincronizar:** comprueba `git status --short` y las reservas activas.
   Usa `operations.mjs status --active` como fuente de estado registrado. Consulta handoffs solo
   cuando debas resolver propiedad, decisiones vigentes o dependencias del cambio.
   Ejecuta `preflight.mjs` cuando la tarea vaya a editar dentro de un
   sistema con worktrees, leases o concurrencia que deba reconciliarse.
2. **Reservar:** crea `.coordination/claims/<thread-id>.md` antes de editar y
   registralo una vez con `operations.mjs register`.
3. **Negociar:** si hay solape, identifica al propietario y la entrega o
   transferencia necesaria. Contacta al propietario solo por un canal ya
   autorizado; en otro caso, informa al usuario. El archivo permanece bloqueado
   hasta una resolución válida.
4. **Trabajar:** antes de la primera edición, registra la transición de tu claim
   de `reservado` a `en_curso` y comprueba que terminó correctamente. Limita los
   cambios al alcance reservado; conserva trabajo ajeno.
5. **Publicar estado:** añade una transicion inmutable con
   `operations.mjs transition`; no modifiques el marcador registrado.
6. **Entregar:** crea `.coordination/handoffs/<thread-id>.md` cuando existan
   decisiones duraderas que deban acompañar a la candidata. Pasa a
   `esperando_revision` antes de entregarla y a `liberado` solo con evidencia
   terminal tipada. Una fusion no genera otro cambio Git de cierre.

Si el propietario ya no es accesible, una transferencia requiere autorización
expresa del usuario. Debe registrarse como evidencia de decision humana en las
dos cadenas operativas y, si existe trabajo staged, conservar un checksum o
manifiesto antes y despues de la intervencion.

## Plantilla de claim

```md
# <titulo de tarea>
- thread_id: <id completo>
- creado: <AAAA-MM-DD HH:MM zona>
- estado: reservado
- objetivo: <una frase>
- archivos:
  - <ruta exacta; sin comodines para claims nuevas>
- cambios_ajenos_detectados: <si/no y detalle>
- consumidores: <otros chats afectados>
- siguiente_paso: <una frase>
```

El marcador queda inmutable despues de registrarse. `estado` representa el
estado inicial; el estado vigente procede del ultimo evento compartido valido.
Las claims legacy sin registro operativo siguen usando el estado del archivo.
El marcador se mantiene en el worktree de control del director y no se añade a
la rama candidata ni a su PR. Tras una liberacion verificada puede retirarse del
worktree: la cadena compartida conserva el historial y una claim activa sin
marcador sigue bloqueando al preflight nuevo.

## Registro operativo

El log vive fuera del checkout, en la misma raiz privada compartida por los
clones registrados. Cada evento conserva el checksum del marcador, el evento
anterior, la transicion y referencias de evidencia. Los archivos de evento se
crean una sola vez y nunca se editan ni se eliminan automaticamente.

```sh
node automation/agents/operations.mjs register \
  --claim .coordination/claims/<thread-id>.md \
  --event-id <id-unico> \
  --occurred-at <fecha-utc>

node automation/agents/operations.mjs transition \
  --thread-id <thread-id> \
  --event-id <id-inicio-unico> \
  --occurred-at <fecha-utc> \
  --state en_curso \
  --reason work_started

node automation/agents/operations.mjs transition \
  --thread-id <thread-id> \
  --event-id <id-revision-unico> \
  --occurred-at <fecha-utc> \
  --state esperando_revision \
  --reason candidate_ready
```

El registro conserva el estado inicial `reservado`; no empieza el trabajo.
El recorrido de una candidata es `reservado -> en_curso -> esperando_revision`.
El salto directo `reservado -> esperando_revision` es inválido. Una tarea
bloqueada puede pasar a `bloqueado`; no se fuerza una transición para cerrar.

Una transicion a `liberado` exige `--evidence-file` con referencias tipadas:
reconciliacion terminal, PR fusionada, informe `no_op`, handoff por checksum o
decision humana identificable. Una PR cerrada sin fusionar o un informe
`blocked` necesitan ademas reconciliacion, handoff o decision humana. Reabrir
una claim liberada exige una referencia de decision humana. Texto libre, una
respuesta de modelo o un commit aislado no bastan.

El preflight falla cerrado si el log esta corrupto, la cadena se bifurca, falta
un evento anterior o el marcador cambia despues del registro. Si un marcador
activo desaparece, su estado compartido sigue bloqueando al writer. Durante la
transicion, conservar el marcador inicial permite que runners anteriores vean
al menos una claim activa y se bloqueen de forma conservadora.

### Cierre de una tarea local terminada

Una tarea local ordinaria puede completar su entrega sin esperar aprobación humana
cuando el resultado solicitado y sus verificaciones están completos. Escribe un
handoff con rutas, checks, decisiones y sin trabajo pendiente bajo esa claim;
calcula su SHA-256 y aporta `[{"kind":"handoff","path":".coordination/handoffs/<id>.md","contentDigest":"<sha256>"}]`
mediante `--evidence-file` al pasar de `esperando_revision` a `liberado`.
El controlador comprueba que el archivo existe, que su checksum coincide y que
no queda trabajo pendiente: el registro valida el formato de la evidencia, no
el contenido del handoff. Verifica después el estado efectivo con
`operations.mjs status`. Esta liberación
conserva los archivos y su historial; no aprueba Git ni acciones externas.

Una candidata autónoma retenida pendiente de revisión no es una tarea local
terminada: sigue reservada hasta su evidencia terminal o decisión correspondiente.
Un handoff que documente trabajo pendiente no sirve para declarar finalizada una
tarea. Conserva los bloqueos de ownership y la evidencia de cualquier transferencia.

## Autorizacion agrupada de entrega

Una decision humana puede cubrir sin nuevas interrupciones una secuencia
contigua y exacta de `commit_candidate`, `push_branch` y
`create_draft_pull_request`. El controlador la registra una sola vez con
`authorizations.mjs`; el registro fija repositorio, candidata, base, rama
`codex/`, rutas exactas sin comodines, checksum de activacion, checks, orden y
una vigencia maxima de 24 horas.

Al preparar esta decisión, ofrece como item opcional separado la auditoría de
dependencias. Presenta la orden exacta `npm audit --omit=dev --audit-level=moderate
--package-lock-only --ignore-scripts`, con `npm_config_registry=https://registry.npmjs.org`, el
repositorio, candidata, SHA-256 de package-lock.json, entorno controlador, registry
y caducidad. Explica que envía información de dependencias al registry, sin
instalar paquetes ni modificar datos remotos del proyecto. Registra la aprobación
explícita y su fuente en un handoff; una sola respuesta puede aprobar ambos items.
No añadas un cuarto paso ni campos libres al bundle de entrega: el permiso de
auditoría es una decisión separada y verificable con el mismo contexto humano.
Antes de ejecutarla, comprueba esos datos y su vigencia; si falta el item aprobado
no infieras permiso del bundle. Cambiar registry, lockfile o candidata requiere
renovar ese item. Antes de ejecutar el gate o el push, valida el permiso de
auditoría y fija `npm_config_registry` al registry aprobado en el entorno del
comando completo; comprueba `npm config get registry` en ese mismo entorno.
Así `check:security`, incluido el invocado por pre-push, usa el destino aprobado.
Si se rechaza el item, prepara la candidata local y deja la entrega pendiente
de evidencia de seguridad: nunca omitas el check obligatorio.
Los roles sin red conservan su restricción; ejecuta la auditoría
solo en el controlador autorizado. No concedas una bandera permanente de red.

Antes de cada accion el controlador valida el contexto y crea una reserva
exclusiva de 10 minutos. Al terminar, consume esa reserva con su token y registra
el resultado y las evidencias tipadas en una cadena append-only. El token solo se devuelve al
controlador y se persiste por hash. Una reserva caducada, un resultado distinto,
una bifurcacion o corrupcion bloquean la autorizacion; no existe reclaim ni
reintento automatico.

Las banderas generales de commit, push y PR permanecen desactivadas: el bundle
es una excepcion humana estrecha para esa candidata, no autoridad autonoma. No
puede incluir merge, despliegue, publicacion, borrado o rollback destructivo.
Aunque los resultados autorizados sean recuperables por una persona, ejecutar
la recuperacion requiere su propia confirmacion.

```sh
node automation/agents/authorizations.mjs status
node automation/agents/authorizations.mjs register --file <bundle.json>
node automation/agents/authorizations.mjs inspect \
  --authorization-id <id> --context-file <context.json>
```

## Plantilla de handoff

```md
# Handoff: <titulo>
- thread_id: <id completo>
- terminado: <AAAA-MM-DD HH:MM zona>
- resultado: <resumen>
- archivos_cambiados: <lista>
- verificaciones: <comandos y resultado>
- decisiones: <lista>
- pendiente: <lista>
- mensaje_enviado_a: <chat o thread_id>
```

## Conflictos

Prioridad: reserva anterior válida, luego división explícita por archivos y, si
no es posible, trabajo secuencial o transferencia autorizada. Ninguna urgencia
autoriza a sobrescribir cambios ajenos. El historial de claims y handoffs no se
borra durante una limpieza documental: permite reconstruir propiedad y decisiones.

Toda claim cuyo estado efectivo no sea `liberado` conserva propiedad exclusiva
sobre sus rutas. `bloqueado` describe un impedimento de la tarea propietaria; no
autoriza a otro escritor. `esperando_revision` conserva el diff y la reserva
hasta que una revision humana o evidencia terminal la promueva, rechace,
transfiera o libere explicitamente.

El preflight registra cada clon por identidad de `origin` en el estado privado
del usuario y revisa los worktrees de todos los clones registrados. Un registro
corrupto, inaccesible u obsoleto bloquea el trabajo de scout y writer; nunca se
elimina ni se reclama automáticamente. Antes de retirar uno, una persona debe
comprobar el proceso, lease, worktrees, estado Git, claims y handoffs asociados.
Una migración del protocolo exige detener primero todos los runners antiguos:
ningún writer puede operar mientras exista un clon registrado con una versión
legacy o con un lease legacy retenido.
