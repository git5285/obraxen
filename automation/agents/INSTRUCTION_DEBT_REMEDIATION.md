# Corrección de los ocho hallazgos de deuda de instrucciones

Fecha: 2026-09-08. Tarea: `01a08128-2409-7572-8c1d-a1df9dc75942`.
Estado: los ocho cambios y comprobaciones focalizadas están completos, con
revisión independiente sin hallazgos pendientes en ese alcance. El cierre
operativo se registra en el log, no reescribiendo este documento. No es una
entrega Git ni un ciclo autónomo. La autorización posterior del propietario permite estas
correcciones, sus pruebas locales y la copia recuperable de overrides; no
instalación, publicación ni despliegue.

## Alcance y evidencia

El baseline es el árbol de trabajo respaldado antes de este mantenimiento, no
solo HEAD: ya existían cambios de otras tareas. El manifiesto privado conserva
rutas, copias originales y SHA-256:

`/Users/danielgarcia/.local/state/obraxen/instruction-debt/01a08128-2409-7572-8c1d-a1df9dc75942/baseline.json`.

Las propuestas adicionales de la auditoría posterior (Next-upgrade, cierre del
workflow alojado y otras descripciones) no forman parte de estos ocho cambios.
No se ha habilitado el adaptador de repositorio ni cambiado permisos, confianza,
política de publicación, límites del builder o configuración de pruebas.

| Punto | Corrección | Evidencia y límite |
| --- | --- | --- |
| 1. Auditoría antes de entrega | `cycle.md` coloca Audit antes de Deliver. `authorizations.mjs` exige contexto v2 con auditoría pass independiente y candidata/base/runtime/contenido coincidentes antes de reservar cualquier paso. | Pruebas negativas de las tres acciones sin auditoría, v1, auto-revisión, veto, needs_human, fecha futura o identidad distinta: ninguna reserva. Casos positivos y compatibilidad histórica. Las identidades son atestaciones del controlador; no prueba criptográfica de autoría. |
| 2. Disponibilidad real | Cycle y Current mode enlazan al apartado del adaptador deshabilitado; la disponibilidad se comprueba en lectura antes de preflight que escribe estado, probes, claim, lease o worktree. | `REPOSITORY_EXECUTION_ENABLED` sigue false. Prueba de APIs deshabilitadas con objeto-trampa y comparación de archivos/worktrees antes-después. La preparación de la fixture ocurre antes de medir el intento; no es ejecución sobre Obraxen. |
| 3. Restricciones del builder | El hook niega Delete File, Move to y check:quality. Conserva apply_patch permitido y checks locales. También niega grafías con escapes, comillas, comodines y opciones que redirigen configuración/prefix/workspace. | Pruebas de la función del hook; los comandos peligrosos representados no se ejecutan. No es una demostración de sandbox completo o de activación real del hook en cada host. |
| 4. Despliegue | El comando Vercel se subordina al runbook. Preview, instalación, enlace, credenciales y accesos remotos no quedan implícitamente autorizados. Distingue READY de verificación real y acota logs. | Plantilla y secciones fuente de observability/deployments-cicd regeneran exactamente deploy.md. Inspección estática y recorridos hipotéticos; ningún despliegue ni consulta remota ejecutados. |
| 5. Handoffs | AGENTS y README de coordinación condicionan la lectura histórica a propiedad, decisiones vigentes o dependencias. | No se borra historia, se conservan reservas y cierre con evidencia tipada. |
| 6. Selección tecnológica | Descripciones de v0-dev, ai-gateway, vercel-flags, ncc, auth, payments, runtime-cache y shadcn delimitan la integración concreta. Se estrechan señales genéricas donde existían. investigation-mode se separa del diagnóstico local ordinario. | YAML válido; los dos pares de recorridos no demuestran una mejora de selección porque baseline y candidata ya eligieron lo mismo bajo los límites globales. |
| 7. Conocimiento fechado | knowledge-update pasa a referencia fechada y condicionada a evidencia vigente; no prevalece incondicionalmente ni afirma autoinyección. | Se conserva conocimiento técnico, sin verificar aquí su vigencia externa. El catálogo de una sesión existente puede conservar metadatos anteriores. |
| 8. Figma | Se acortan figma-design-to-code y figma-create-new-file. | Se preservan cuerpos, prerrequisitos de herramientas, dirección de trabajo, resolución de plan/editor y fidelidad de assets. No se confunden con las otras descripciones Figma propuestas en una auditoría posterior. |

## Comprobaciones ejecutadas

Todos los comandos del proyecto usan el runtime fijado:
`node automation/agents/runtime.mjs exec -- <comando>`.

- `npm run test -- tests/agents/policy.test.ts tests/agents/authorizations.test.ts tests/agents/repository-work.test.ts --no-file-parallelism`: **141 pruebas, 3 archivos, pass** tras la revisión final de argumentos, incluyendo opciones entrecomilladas y redirección de raíz/configuración. Se repitió después de añadir el caso positivo de `check:diff --worktree`.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `git diff --check`: pass, incluida la comprobación final de documentación y handoff.
- Cabeceras YAML: 14 skills globales validadas con `js-yaml` ya instalado; descripción/nombre válidos. El quick_validate de skill-creator no pudo ejecutarse por ausencia de PyYAML; no se instaló.
- El renderer local reproduce exactamente `commands/deploy.md` desde su plantilla y secciones fuente.
- ZIP: los 16 archivos globales modificados coinciden byte a byte con sus nuevas copias `after`; manifiesto externo e interno coinciden.

### Fallo temporal conservado, no ocultado

La suite amplia `npm run test -- tests/agents` falló en tres pruebas de ciclo de
fixture por el timeout de Vitest de 5000 ms. Una repetición sin paralelismo de
`policy.test.ts` e `isolated-work.test.ts` pasó 112 pruebas y falló cuatro por
ese límite (116 en total). No hubo evidencia de que quitar paralelismo resolviera
el problema.

El test de fixture y sus módulos comparados permanecen iguales al baseline.
La prueba interna concede 30000 ms a su subproceso, pero no modifica el límite
externo de Vitest. Como diagnóstico se ejecutó:

`npm run test -- tests/agents/isolated-work.test.ts --no-file-parallelism --testTimeout 30000`

Resultado: **41/41 pass**, duración informada por Vitest 37,79 s para el archivo.
Esto prueba que las aserciones pasan con ese presupuesto en esta ejecución;
no demuestra la causa de la lentitud, no es un pase con el límite habitual y no
modifica configuración ni aserciones. La suite amplia con su límite normal
sigue sin un pase verificado. No se ejecutó check:quality ni su auditoría de red;
no se anuncia Quality gate completo, CI verde o preparación para merge.

## Cinco recorridos: hipótesis, sin ejecución

Estos casos usan hechos de fixture, no afirman que exista una base Postgres o
un fallo de UI en Obraxen. Ningún recorrido modifica la web ni ejecuta una
migración, interacción de navegador, reparación de producto o despliegue.

### Errata mecánica

Petición: cambiar pavimnetos por pavimentos en una ruta existente.
Activación: AGENTS y coordinación; no copywriting, diseño, diagnóstico, TDD ni
ciclo autónomo. Lectura: archivo/diff, estado y propiedad, secciones necesarias
de coordinación. Acciones hipotéticas: claim exacta, sustitución, comprobación
del diff y cierre. Aprobación: edición local incluida; Git remoto no incluido.
Fin: sustitución exacta y ausencia de cambios accidentales. La guía Next.js no
se carga por una corrección puramente textual. Handoffs históricos solo si
resuelven una necesidad actual.

### Migración de base de datos

Petición de fixture: columna nullable en Postgres y compatibilidad de consumidores.
Activación: tecnología de migración existente; schema.org no aplica. Lectura:
esquema, migraciones, consumidores y pruebas pertinentes, sin secretos.
Acciones hipotéticas: definir columna, preparar migración y probar en base local
desechable expresamente autorizada. Aprobación: staging, producción, datos
compartidos, credenciales remotas y operaciones irreversibles requieren alcance,
entorno y rollback específicos. Fin: artefacto y comprobaciones locales pedidos,
o decisión/acceso preciso pendiente. No inferir permiso de borrado para limpieza.

### UI con inspección visual

Petición: corregir solapamiento del menú móvil y verificarlo visualmente.
Activación: impeccable para refinamiento y agent-browser-verify para el smoke;
no Figma, v0 o shadcn sin integración. Lectura: componente, tokens, estilos y
playbook pertinente; Next.js solo si depende del framework. Acciones hipotéticas:
inspección inicial, corrección mínima y observación del resultado renderizado,
interacción y errores en ruta/viewport/estado afectados. Aprobación: trabajo
local incluido; instalar o acceder remotamente requiere otra cobertura.
Fin: corrección e inspección real; una captura guardada o servidor arrancado no
bastan. Si falta navegador, la verificación queda pendiente.

### Test local fallido

Petición: reparar una aserción de Vitest tras una modificación local.
Activación: reproducción ordinaria; no TDD ni investigación profunda por defecto.
Lectura: salida, test, implementación y cambio pertinente. Acciones hipotéticas:
reproducir, determinar causa, reparar sin debilitar aserciones y repetir checks
afectados. Aprobación: reparación local dentro de alcance; propiedad conflictiva
o ampliación material requiere decisión. Fin: reparación validada, no solo
informe del fallo. El límite de una corrección del builder autónomo no se aplica
al mantenimiento humano autorizado.

### Despliegue con aprobación

Petición: preparar candidata para preview y solicitar aprobación cuando proceda.
Activación: runbook de Obraxen y referencia Vercel pertinente. Lectura: identidad
de candidata, gates, protección y cobertura de aprobación. Acciones hipotéticas:
preparación local, solicitud concreta antes de acceso remoto o URL, ejecución
solo con cobertura y verificación del deployment exacto. Aprobación: preview
también la necesita; producción, formulario, analítica e indexación conservan
fronteras separadas. Fin: preparación entregada con aprobación pendiente, o
deployment y checks requeridos completos. READY no prueba protección ni
funcionamiento. Los ejemplos CLI no sustituyen el runbook.

## Comparación y mediciones

Paquetes congelados y resultados completos:
`/Users/danielgarcia/.local/state/obraxen/instruction-debt/01a08128-2409-7572-8c1d-a1df9dc75942/comparison/`.

`manifest.json` identifica versiones y SHA-256; `results.json` conserva respuestas
y llamadas de las cuatro muestras; `measurements.json` enlaza las trazas y
contiene mediciones estructurales. Dos muestras independientes por versión,
orden de lanzamiento A1/B1 y B2/A2. Mismas peticiones, hechos de fixture y permisos
en ambos paquetes. El primer par tuvo techo de respuesta de 1800 palabras y
el segundo de 1300, equilibrado dentro de cada par; no son cuatro prompts
envolventes byte a byte idénticos.

| Medida | Resultado | Qué permite afirmar |
| --- | --- | --- |
| Tamaño serializado de paquete A/B | 43.225 / 46.584 bytes | La candidata añade 3.359 bytes al paquete; no hay ahorro global demostrado. |
| Dos descripciones Figma del alcance | 994 -> 327 bytes | Reducción medida de 667 bytes UTF-8 de descripciones, no tokens. |
| Llamadas de lectura por muestra | 2 en las cuatro trazas | La primera salida se truncó y se recuperó el contenido; no mejora de lecturas. |
| Selección de skills | Igual en las cuatro muestras | Errata sin workflows adicionales; UI con inspección; routing Anthropic sin AI Gateway. No mejora de selección demostrada. |
| Bytes de salidas serializadas | Medidos por muestra en measurements.json | Tamaño de eventos devueltos, no contexto exacto recibido por el modelo. |
| Tokens, tiempo de modelo, checks repetidos y bloqueos evitables de los escenarios | null | No hubo ejecución de esos escenarios; no se inventa telemetría. |

Los paquetes contienen 22 descripciones y cuatro documentos, no todo el catálogo
ni todos los SKILL.md. La ausencia de una skill de despliegue en el paquete no
significa que falte en el host. Ambas versiones respetaron los límites globales:
la mejora sustentada es menor contradicción textual y gates deterministas, no
una tasa superior de éxito del modelo. Dos muestras no dan confianza estadística.

## Lote mínimo útil y comprobaciones posteriores

1. Seguridad y orden: auditoría antes de entrega, disponibilidad antes de
   preparación y restricciones de hook con tests positivos/negativos.
2. Flujo: despliegue subordinado y lectura histórica condicional.
3. Descubrimiento: ocho tecnologías concretas, separación de diagnóstico,
   conocimiento fechado y las dos descripciones Figma.

En una evaluación futura autorizada, conservar mismas peticiones, fixtures,
permisos y digests, con al menos dos muestras independientes por versión para
afirmaciones de comportamiento. Exigir cero reservas sin auditoría aprobada y
cero recursos de ownership creados durante un intento conocido deshabilitado.
Probar rechazo de borrado/movimiento/check:quality y preservación de patches y
checks locales válidos, incluyendo opciones citadas. Comprobar errata sin
sobreactivación, UI con observación real y READY separado de función/protección.
Contar repetición solo sobre inputs idénticos; checks posteriores a cambios o
comparaciones diagnósticas no son automáticamente redundantes.

La selección efectiva debe verificarse en una sesión nueva: cambiar disco no
demuestra que el catálogo de una sesión ya iniciada se haya actualizado. No se
recarga, instala ni reconcilia automáticamente otro plugin. No se exige ejecutar
los cinco escenarios de producto para este informe; sus recorridos son sobre papel.

## Persistencia recuperable

Se actualizaron solo las 16 instrucciones globales del alcance en
`/Users/danielgarcia/.codex/instruction-overrides/lote-instrucciones.zip` y su
manifiesto. Copia anterior:
`/Users/danielgarcia/.codex/instruction-overrides/revisions/before-obraxen-01a08128-d8984b24ed28.zip`.
SHA-256 del ZIP resultante:
`4cb94580e311a62d86935cfd83ce8f6c5d55ad4078dd62059120978fb7ee3cf1`.
Las entradas ajenas se preservaron; no se ejecutó reconcile --apply ni se cambió
la versión de ningún plugin. Restaurar o migrar versiones sigue requiriendo
una decisión dentro de su alcance.

## Revisión independiente y conservación

Revisor de mantenimiento: `01a082ad-4e9c-7762-b4c0-a8bd7637966e` (Rawls).
Revisó cambios de código, documentos y las 16 instrucciones globales contra
backups verificados. Detectó la redirección por root; tras la corrección ejecutó
62 comprobaciones puras y no encontró nuevos defectos en ese ajuste. La nota
sobre el recuento antiguo de 132 pruebas se corrigió con el resultado final
de 141. El revisor no ejecutó las suites, red ni acciones representadas; las
salidas de suites, lint y tipos son evidencia del controlador, no del revisor.

El hook continúa siendo una defensa acotada, no un sandbox completo. No se
afirma cobertura exhaustiva de herramientas externas ni validación de su
activación efectiva en hosts autónomos. Se preservaron por checksum los 111
archivos ajenos cubiertos por el baseline; cambios posteriores no incluidos,
como next-env.d.ts, tampoco se sobrescribieron.

El handoff de esta tarea es
`.coordination/handoffs/01a08128-2409-7572-8c1d-a1df9dc75942.md`.
No queda trabajo de implementación de estos ocho puntos bajo las claims de
mantenimiento. El fallo temporal de la suite amplia, la verificación del catálogo
en sesiones futuras y los hallazgos adicionales quedan diferenciados, no
convertidos en resultados verdes ni en autorización para ampliar este cambio.
