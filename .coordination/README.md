# Protocolo de trabajo paralelo

Objetivo: que varias tareas puedan avanzar sin escribir sobre los mismos
archivos ni repetir decisiones.

## Alcance y lectura

`AGENTS.md` es la entrada del repositorio y `COORDINATION.md` resume las reglas
vigentes. Este documento define solo la mecánica de claims, handoffs y
transiciones. Consulta `operations.mjs status` para el estado vivo; los
handoffs y claims cerrados son historial, no lectura obligatoria de arranque.

## Ciclo obligatorio por tarea

1. **Sincronizar:** comprueba `git status --short`, las reservas activas y los
   últimos handoffs relacionados. Usa `operations.mjs status` como fuente de
   estado; ejecuta `preflight.mjs` cuando la tarea vaya a editar dentro de un
   sistema con worktrees, leases o concurrencia que deba reconciliarse.
2. **Reservar:** crea `.coordination/claims/<thread-id>.md` antes de editar y
   registralo una vez con `operations.mjs register`.
3. **Negociar:** si hay solape, envia un mensaje al propietario. Hasta que haya
   acuerdo, el archivo queda bloqueado para la tarea nueva.
4. **Trabajar:** limita cambios al alcance reservado; conserva trabajo ajeno.
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
  - <ruta exacta o glob acotado>
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
  --event-id <id-unico> \
  --occurred-at <fecha-utc> \
  --state esperando_revision \
  --reason candidate_ready
```

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

## Autorizacion agrupada de entrega

Una decision humana puede cubrir sin nuevas interrupciones una secuencia
contigua y exacta de `commit_candidate`, `push_branch` y
`create_draft_pull_request`. El controlador la registra una sola vez con
`authorizations.mjs`; el registro fija repositorio, candidata, base, rama
`codex/`, rutas exactas sin comodines, checksum de activacion, checks, orden y
una vigencia maxima de 24 horas.

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
