# Entrega local: siete pasos de arquitectura Home/legado

Fecha: 24-09-2026. Alcance: implementación local de los siete pasos autorizados,
sin commit, push, PR, merge, red externa, publicación ni despliegue.

## Base y atribución de evidencia

- Checkout de control: `/Users/danielgarcia/Projects/Obraxen`, main
  `88eb051f9ae16602e8e3c174bf921736ed76ddac`, inicialmente 26 modificaciones y
  14 archivos sin seguimiento, sin staged.
- Sus fuentes coincidían con el commit local
  `c87b1ab4d04b9b0086ba2b52d14ae64b5d7eb15f`, salvo un handoff histórico.
  Ese commit incorpora `127082409589482af932ba7b491f4bc51fc7cef1` y refactors
  previos liberados. No se ha cambiado main ni confirmado sus cambios pendientes.
- Trabajo nuevo: rama local `codex/architecture-boundaries-20260924`, worktree
  `.vercel/candidates/architecture-boundaries-20260924`, base c87b1ab.
  Las modificaciones de esta entrega están **sin commit**.
- Se comprobaron los SHA-256 de los 635 archivos preexistentes del checkout de
  control: ninguno cambió. Solo se añaden allí los marcadores de esta coordinación.
- No se ha inspeccionado producción. Ningún resultado local acredita el estado
  de obraxen.com ni renueva una autorización anterior.

## Mapa de responsabilidades conservado

```text
package.json + runtime fijado
├─ dev/build/start → scripts/public-site.mjs → Home
│  ├─ home-contract + public-site-evidence: guardas e inventario
│  ├─ public/index.html → generate-route-content → generated-home-html.js
│  │                    → Route Handlers /, /en, /de → apps/public-site/.next
│  └─ public/assets: imágenes/vídeo + i18n + contacto mailto
├─ *:legacy → configuración Next raíz → src/ + data/ → rutas/API del legado
└─ automation/agents → permisos, ownership y control del trabajo interno

prepare:home → 47 inputs explícitos + dependencias locales
             → export aislado + build Home + home-candidate.json
```

La separación Home/legado es intencionada. El runtime y lockfile compartidos
siguen siendo un contrato común. El empaquetado solo necesita dos módulos del
runtime interno; no incorpora el sistema de agentes completo.

## Cambios, problema resuelto y complejidad añadida

| Orden | Hallazgo / subsistema | Cambio mínimo aplicado | Complejidad y alternativa |
|---|---|---|---|
| P1 | ARQ-01, automatización/Home: manifiestos anidados no reconocidos y guardas centradas en legado | `diff-policy.mjs` reconoce manifiestos por nombre; `policy.json` protege configuración, rutas, contacto y verificadores Home. `home-contract.mjs` comprueba noactivación antes de generar/build | Un contrato Home adicional, con pruebas y lista explícita de rutas. Mantenerlo separado evita reinterpretar el gate legal/Resend del legado. Conservar el estado previo habría requerido detectar manualmente estas regresiones |
| P1 | ARQ-02, evidencia Home: exigir hashes originales a una candidata mantenida producía falsa divergencia y omitía assets nuevos | `public-site-evidence.mjs` separa integridad histórica, inventario actual y paridad con destino. `verify-public-site.mjs` consume todos los archivos públicos actuales | Dos comprobaciones con nombres y resultados distintos. El inventario histórico no se reescribe. Conservar el estado previo habría confundido procedencia con equivalencia actual |
| P2 | ARQ-03, herramientas/entrega: receta dependiente de artefactos locales no versionados | `prepare-home-candidate.mjs` exporta fuentes explícitas, construye sin salidas previas y acredita inputs/rutas/cuerpos | Una lista pequeña de inputs que mantener. Se reutiliza el lockfile y se copian dependencias locales: coste de disco, sin separar paquetes o introducir herramientas. La alternativa es seguir con una preparación manual que exige conocimiento no documentado |
| P2 | ARQ-04, Home: mensajes concatenados y observador sin auditoría dinámica | Mensajes `contact.*` con parámetros y catálogo único; observador audita nodos, texto y atributos, reconociendo salidas ya traducidas | Compatibilidad temporal con el catálogo exact-text y un conjunto de valores traducidos conocidos. No se migra toda la Home ni se cambia el renderizado de idiomas. Conservar lo anterior mantiene el riesgo de textos dinámicos no detectados |

La confianza es alta en estos cuatro recorridos porque hay regresiones ejecutadas
y prueba de empaquetado real. No se infiere deuda por tamaño de archivo, antigüedad
de dependencias o coexistencia de dos aplicaciones.

## Siete pasos cerrados localmente

1. **Base y preservación:** checkout aislado, claim exacta y hashes de control.
2. **Protecciones:** pruebas positivas/editoriales y negativas de manifiestos,
   rutas, recursos, envío, indexación y almacenamiento; gate legado intacto.
3. **Evidencia separada:** recuperación original verificada localmente; paridad
   actual comprueba también nuevos recursos y detecta modificaciones/ausencias.
4. **Receta versionada:** build aislado real con 47 inputs; rechazo real del
   worktree sucio sin `--allow-worktree`, sin crear el destino rechazado.
5. **Mensajes dinámicos:** claves estables en contacto y regresiones EN/DE para
   nodos, atributos y traducción parcial de prefijos. No hay cambio de copy aprobado.
6. **Regresión:** Home, automatización, tipos, cobertura, legado y comparación
   local de la exportación. Las comprobaciones remotas siguen fuera del alcance.
7. **Entrega revisable:** diff local limitado a 22 archivos, este documento y
   handoff de coordinación. No se copia el diff sobre el checkout de control.

## Evidencia ejecutada

Todos los comandos del repositorio se ejecutaron con
`node automation/agents/runtime.mjs exec --` y el runtime fijado.

| Comprobación | Resultado observado |
|---|---|
| `npm run lint` | Exit 0, repositorio completo |
| `npm run typecheck` | Exit 0; generación de tipos y TypeScript |
| `npm run test:coverage` | 65 archivos de tests y 1.020 pruebas aprobadas; 91,42 % de líneas en las bibliotecas medidas del legado, no en Home |
| `npm run check:home` | Exit 0: lint, 43 pruebas, build y navegador ES/EN/DE a 1440 y 390 px |
| Regresión visual frente a la base inicial | Las seis capturas y snapshots renderizados conservan los hashes iniciales; no es una comparación con producción |
| `npm run check:legacy` | Exit 0: tipos, 462 pruebas, builds, contacto simulado, E2E y Lighthouse. E2E general: 124 aprobadas, 17 omitidas por la configuración existente; Lighthouse: cuatro rutas dentro del presupuesto |
| `npm run check:home:recovery -- --recovery-root=…/original` | Exit 0: 74 originales verificados por tamaño, SHA-256 y UID SHA-1 |
| `npm run prepare:home -- --output=…/candidate-final --allow-worktree` | Exit 0: build desde exportación nueva, tres rutas exactas y HTML canónico |
| `npm run prepare:home -- --output=…/expected-dirty-refusal` | Exit 1 esperado: worktree sin confirmar, destino no creado |
| `npm run test:published -- --compare-url=http://127.0.0.1:43091` | Exit 0: paridad entre repositorio y exportación; 32 archivos públicos, tres HTML y seis vistas/interacciones |
| `npm run check:activation -- --json` | Exit 1 esperado, `NO-GO`, seis bloqueos originales, publicación y publishSwitch falsos |
| `git diff --check` | Sin errores de whitespace |
| Diff de `src/ data/ css/ img/ scripts/check-activation.mjs package-lock.json` contra c87b1ab | Vacío |

Los intentos iniciales de navegador y cobertura sin permiso de loopback fallaron
por `listen EPERM`; se repitieron con permiso local y pasaron. Durante el cambio,
la prueba de navegador detectó una colisión de nombre en el mensaje del formulario;
se corrigió y se repitió la suite. Ningún intento fallido se cuenta como aprobado.

Informes generados en el worktree:
`test-results/published-home/checks.json`, `comparison.json` y sus PNG;
`coverage/`, `playwright-report/` y los informes locales de Lighthouse.

Exportación final temporal:
`/private/tmp/obraxen-home-architecture.HAZtvW/candidate-final/home-candidate.json`.
Es regenerable y no sustituye a las fuentes versionadas; no depender de su
permanencia en /private/tmp para una entrega posterior.

- Inputs SHA-256: `d9f9e1eaf05157e7baf18d40493d36a2d3e22e9bee07706d16c4b1138664a9dc`.
- HTML SHA-256: `89db3073ab9631f2baf1937fc579adcd83c195af656dd95ea808cd008303d3c8`.
- `exactCommit: null`, `publicationAuthorized: false`.
- Salida: `apps/public-site/.next`; Vercel Build Output no generado.

## Comportamiento conservado y criterios de aceptación

- **Contenido:** mismo HTML, recursos visuales y seis snapshots iniciales. Las
  ediciones editoriales en memoria no rompen navegación ni claves existentes.
- **Interacción:** foco y teclado del menú/diálogo, vídeo, carrusel, seis sectores,
  validación, mailto, datos del visitante y selección de idioma. No se pulsa el
  enlace de envío, no se observan cookies, almacenamiento ni solicitudes externas.
- **Empaquetado:** inputs verificados antes/después, sin legado o secretos,
  sin sobrescribir destinos, rechazando symlinks y punteros LFS; rutas/cuerpos
  del build comprobados y equivalentes al servidor local de referencia.
- **Automatización:** edición editorial ordinaria permitida dentro de su scope;
  dependencia anidada y guardas operativas bloqueadas sin autoridad. No se
  amplían permisos permanentes ni se omite el gate obligatorio.

## Límites y decisiones posteriores

- No se ejecutaron `npm audit`, el agregado `check:quality`, CI ni lecturas de
  producción. No declarar el gate completo aprobado: seguridad requiere permiso
  específico para el registry; CI necesita una entrega Git autorizada.
- No se creó un commit limpio nuevo. El modo limpio de la receta está cubierto
  con fixtures; la integración real se probó con inputs pendientes y exportación
  nueva, etiquetada como tal.
- Las guardas estáticas son detección de regresiones habituales, no prueba formal
  contra JavaScript arbitrario u ofuscado. El navegador acredita los recorridos
  ejercitados, no todos los estados posibles.
- No se ha comprobado la configuración actual de Vercel ni los aliases. La
  receta local no produce `.vercel/output` y no autoriza `deploy --prebuilt`.
- La traducción exact-text que queda fuera del contacto puede migrarse al tocar
  cada zona. No se propone un framework, proveedor o arquitectura nuevos.
- Siguiente secuencia, solo si se autoriza: revisar diff local → confirmar
  candidata exacta y permiso de seguridad → gate completo → entrega Git/CI →
  decisión de publicación independiente. Ninguno de esos permisos se infiere
  de esta entrega local.
