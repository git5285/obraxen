# Observación del setup de Codex

Petición humana: observar el uso cotidiano antes de añadir nuevos mecanismos.
Muestra: las próximas cinco tareas humanas distintas de Obraxen iniciadas tras
el arranque de esta observación. Se excluyen esta tarea de consolidación, pruebas,
canaries, ciclos autónomos y las propias revisiones del observador. Varias claims
de una misma tarea cuentan una sola vez. El límite temporal es el 9 de octubre de
2026; si no hay cinco tareas, se entrega una muestra incompleta identificada.

La observación se programa como seguimiento de esta conversación en Codex.
Revisa cada seis horas y permanece silenciosa si no hay evidencia nueva ni
problemas que requieran acción. No ejecuta checks, edita producto, publica,
envía mensajes externos ni solicita permisos preventivos.

## Registro y fuentes

Estado local del experimento:
`~/.local/state/obraxen/setup-observation-01a0d561/state.json`.
Informe al completar la muestra o alcanzar el plazo:
`~/.local/state/obraxen/setup-observation-01a0d561/report.md`.

Fuentes: eventos operativos de registro/cierre, handoffs con checksum verificado,
logs de checks y resúmenes de las tareas concretas de este proyecto. No recorrer
conversaciones ajenas ni copiar credenciales, variables de entorno o mensajes
privados completos. Conservar referencias y fragmentos mínimos de evidencia.

Por cada tarea, recoger:

| Dato | Evidencia requerida |
| --- | --- |
| Interrupciones evitables | Petición/bloqueo concreto, motivo y evidencia de autorización previa o requisito inexistente |
| Conflictos de archivos | Claim/rutas que se solapan y resolución observada |
| Checks repetidos | Mismo comando, inputs verificablemente idénticos, resultado anterior y ausencia de una razón nueva para repetir |
| Esfuerzo de coordinación | Tiempo activo explícitamente medido; si solo hay timestamps, registrar duración de calendario por separado |
| Resultado y adopción | Alcance final, comprobaciones y uso observado de contexto compacto/local-task |

Un dato ausente es `null` o «sin dato», nunca cero. Un bloqueo de seguridad
justificado no es una interrupción evitable. Un check repetido tras un cambio o
fallo no es redundante. No inferir hashes ni ahorros de tiempo/tokens.

Formato de observación dentro de `state.json`:

```json
{
  "threadId": "identificador de la tarea humana",
  "title": "título real",
  "completedAt": "fecha observada",
  "avoidableInterruptions": null,
  "fileConflicts": null,
  "redundantChecks": null,
  "coordinationActiveSeconds": null,
  "calendarSeconds": null,
  "compactContextUsed": null,
  "localTaskUsed": null,
  "evidence": [],
  "notes": []
}
```

## Cierre

El informe distingue datos medidos, desconocidos y límites de la muestra.
Propone como máximo tres simplificaciones, solo ante fricción repetida con
evidencia. No aplica esas propuestas. Al terminar, notifica una sola vez en esta
tarea y pausa este seguimiento. Una muestra pequeña no demuestra una mejora
estadística ni justifica expandir permisos.
