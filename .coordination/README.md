# Protocolo de trabajo paralelo

Objetivo: que varias tareas puedan avanzar sin escribir sobre los mismos
archivos ni repetir decisiones.

## Ciclo obligatorio por tarea

1. **Sincronizar:** lee `COORDINATION.md`, las reservas activas y los ultimos
   mensajes de los chats relacionados.
2. **Reservar:** crea `.coordination/claims/<thread-id>.md` antes de editar.
3. **Negociar:** si hay solape, envia un mensaje al propietario. Hasta que haya
   acuerdo, el archivo queda bloqueado para la tarea nueva.
4. **Trabajar:** limita cambios al alcance reservado; conserva trabajo ajeno.
5. **Publicar estado:** actualiza tu claim despues de cada hito relevante.
6. **Entregar:** crea `.coordination/handoffs/<thread-id>.md`, avisa a los chats
   consumidores y marca la reserva como `liberado`.

Si el propietario ya no es accesible, una transferencia requiere autorización
expresa del usuario. Debe registrarse en ambas claims y, si existe trabajo
staged, conservar un checksum o manifiesto antes y después de la intervención.

## Plantilla de claim

```md
# <titulo de tarea>
- thread_id: <id completo>
- actualizado: <AAAA-MM-DD HH:MM zona>
- estado: reservado | en_curso | bloqueado | esperando_revision | liberado
- objetivo: <una frase>
- archivos:
  - <ruta exacta o glob acotado>
- cambios_ajenos_detectados: <si/no y detalle>
- consumidores: <otros chats afectados>
- siguiente_paso: <una frase>
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

Toda claim que no esté en `liberado` conserva propiedad exclusiva sobre sus
rutas. `bloqueado` describe un impedimento de la tarea propietaria; no autoriza
a otro escritor. `esperando_revision` conserva el diff y la reserva hasta que
una revisión humana lo promueva, rechace, transfiera o libere explícitamente.

El preflight registra cada clon por identidad de `origin` en el estado privado
del usuario y revisa los worktrees de todos los clones registrados. Un registro
corrupto, inaccesible u obsoleto bloquea el trabajo de scout y writer; nunca se
elimina ni se reclama automáticamente. Antes de retirar uno, una persona debe
comprobar el proceso, lease, worktrees, estado Git, claims y handoffs asociados.
Una migración del protocolo exige detener primero todos los runners antiguos:
ningún writer puede operar mientras exista un clon registrado con una versión
legacy o con un lease legacy retenido.
