# Runbook de cutover y publicación

Este documento describe la entrega de la Home actual en `apps/public-site/`.
`src/` fue retirado; el apartado B conserva únicamente su procedimiento histórico. La automatización de
`automation/agents/` prepara y verifica trabajo, pero no es una aplicación pública.
El dominio interno `domain/publication/` no forma parte del artefacto Home.

El runbook no autoriza preview, despliegue, dominio, indexación, analítica,
formulario ni rollback. El estado remoto debe comprobarse con evidencia fechada
cuando se autorice esa inspección; este documento no afirma cuál es el deployment
activo ni qué rollback está disponible.

## A. Home: preparación local y frontera de entrega

1. Trabajar en `apps/public-site/`, revisar `HOMEPAGE.md` y reservar las rutas
   exactas antes de editar. Conservar los datos internos y las banderas de autoridad.
2. Ejecutar `npm run check:home`. El build comprueba el contrato Home y el
   navegador verifica seis vistas, contacto sin envío y rutas excluidas.
3. Ejecutar `npm run prepare:home -- --output=/ruta/nueva/fuera-del-checkout`.
   La receta exporta entradas inventariadas, construye solo Home y verifica
   rutas/cuerpos. No descarga, conecta servicios ni publica. Con cambios pendientes,
   `--allow-worktree` produce evidencia local con `exactCommit: null`.
4. Revisar `home-candidate.json`: inputs/hashes, SHA base, estado local, salida,
   runtime, rutas y exclusiones. Comparar los assets actuales, no los originales
   recuperados. La recuperación tiene su propio `check:home:recovery`.
5. Antes de una entrega Git, obtener su autorización exacta y ejecutar el gate
   completo, incluida seguridad con permiso para consultar el registry. No
   sustituir ese gate por `check:home`. Solo el SHA revisado y su CI verde pueden
   avanzar por el flujo de `AGENTS.md`.
6. Antes de crear o publicar una candidata remota, obtener aprobación específica
   para acción, SHA, proyecto, entorno, dominio y acceso. Verificar raíz/build y
   asociación de proyecto sin copiar secretos a las fuentes. La receta produce
   `apps/public-site/.next`, no Vercel Build Output: no usarla directamente con
   `deploy --prebuilt`. La construcción de plataforma y su auditoría son pasos
   posteriores autorizados.
7. Auditar únicamente `/`, `/en`, `/de` y sus recursos, con APIs/legado/rutas
   interiores excluidas, noindex y contacto mailto. Una aprobación Home limitada
   no autoriza APIs, Resend, analítica, indexación, idiomas del legado, cambios de
   protección global ni una candidata distinta.
8. Si procede publicar, registrar el deployment anterior como referencia y
   comprobar el alias real después. Un build listo no prueba que el dominio
   cambió. Cualquier rollback necesita su autorización; no se ejecuta por inferencia.

El gate `check:activation` evalúa el contrato interno heredado, no el build Home. Una excepción humana Home debe estar documentada para la candidata exacta;
no se obtiene poniendo sus banderas en verde ni cambiando datos legales.
La receta local no presupone que exista una excepción vigente.

### A.1 Receta local de plataforma y auditoría repetible

Desde el checkout seleccionado (`npm run check:checkout`), preparar primero una
exportación nueva con `prepare:home`. Revisar su `home-candidate.json` y conservar
el `source.inputsSha256` fuera de la exportación como expectativa de auditoría.
Conservar también el SHA-256 de los bytes completos de `home-candidate.json`
después de revisar su procedencia contra Git; obtenerlo con
`shasum -a 256 /ruta/export/home-candidate.json`. No recalcular la expectativa
para aceptar una candidata modificada sin repetir la revisión.
Un export con `--allow-worktree` sigue siendo solo evidencia local: no tiene
`exactCommit`. No se infiere aprobación de estos pasos.

```sh
npm run home:platform -- prepare --root=/ruta/export \
  --inputs-sha256=<SHA256 inputs revisado> --candidate-sha256=<SHA256 manifiesto revisado> \
  --project-id=<prj_ID verificado> \
  --org-id=<team_ID verificado> --target=production
```

Este comando comprueba las fuentes, exige destino sin `.vercel` y rechaza un
checkout Git. Escribe únicamente en la exportación: asociación local explícita,
`home-platform.json` y configuración de build. Usa `npm ls --omit=dev --depth=0`
para validar las dependencias ya copiadas, sin reinstalación. Registra hashes de
configuración, pero **no** comprueba la asociación remota ni ejecuta build Vercel.
No sobrescribe un estado de plataforma existente: preparar otra exportación.

Con la autorización que corresponda, un operador construye después el Build
Output desde esa exportación usando la CLI fijada en el lockfile:
`vercel build --prod --non-interactive` para production, o sin `--prod` para
preview. Utilizar un entorno limpio, sin variables de aplicación heredadas;
no hacer `vercel pull`, instalar paquetes ni recuperar secretos por inferencia.
La receta local no cambia la configuración compartida de Vercel.

El operador autorizado obtiene y conserva el inventario JSON con la CLI fijada:
`vercel deploy --prebuilt --prod --skip-domain --dry --non-interactive --json`
(omitir `--prod` para preview). **No quitar `--dry`**: este paso no publica.
Los comandos de plataforma no son invocados por la herramienta local.

```sh
npm run home:platform -- audit --root=/ruta/export \
  --inputs-sha256=<SHA256 inputs revisado> --candidate-sha256=<SHA256 manifiesto revisado> \
  --dry-run=/ruta/inventario.json
```

La auditoría es de lectura y emite JSON por stdout para conservar como evidencia.
El contrato local es `2.0.0` (`schemaVersion: 2`): ambos comandos requieren
`--candidate-sha256`, además del hash de inputs. Los callers anteriores deben
revisar el manifiesto y aportar ese argumento; una preparación v1 no se reutiliza.
El hash vincula la atribución a la revisión externa del manifiesto, no sustituye
la comprobación de Git ni autentica por sí solo una declaración falsa.
Vincula inputs, HTML servido, assets, funciones, entorno embebido, destinos de
routing y el inventario de subida por hash/tamaño. Rechaza archivos fuera del
alcance, enlaces fuera de la exportación, outputs ausentes del inventario y
rutas/funciones inesperadas. Permite enlaces internos generados por Vercel y
verifica sus bytes de enlace.
Los assets de `_next/static/` deben coincidir por ruta y bytes con `.next/static/`
del build local; no se acepta HTML en ese inventario. La única respuesta
sintética admitida en ese namespace es `not-found.txt` con el texto `Not Found`.
Cada alias se valida por su ruta pública aunque comparta un destino físico.
Es un contrato del adaptador actual, no una prueba
de todo comportamiento posible del JavaScript compilado. Un cambio de formato
Vercel puede bloquearlo y requiere revisión y fixtures, no relajar el check.

Un informe `passed` no consulta producción, no prueba CI ni autoriza publicación.
Antes de publicar hay que revalidar SHA/inputs, configuración, CI, proyecto,
entorno y permiso exactos; cualquier cambio del artefacto invalida su evidencia.

## B. Archivo histórico del legado — no ejecutar en esta candidata

Los apartados siguientes describen la aplicación retirada `src/`, con cuatro
idiomas y APIs. Sus comandos `*:legacy` ya no existen. No seguir este
procedimiento para entregar Home ni tomar sus afirmaciones remotas como actuales. El inventario de identidad, legal, proveedor, idiomas y casos vive
en `ACTIVATION_INPUTS.md`; `npm run check:activation` produce su decisión.

## 1. Condiciones de entrada

No se crea una URL candidata hasta que una PR demuestre simultáneamente:

- `npm run check:activation` devuelve `READY_FOR_PROTECTED_CANDIDATE`;
- las evidencias de `ACTIVATION_INPUTS.md` corresponden al SHA candidato;
- regla externa de limitación de solicitudes para `/api/contact/` configurada y
  probada; el límite en memoria no sustituye este control distribuido;
- `npm run check:quality`, auditoría de dependencias y revisión de exposición en
  verde;
- autorización expresa del usuario para crear una preview protegida.

La comprobación previa es ejecutable:

```bash
npm run check:activation
```

Debe devolver `READY_FOR_PROTECTED_CANDIDATE`. El estado actual devuelve
`NO-GO`; la salida del comando es la fuente canónica del recuento y del detalle,
y `ACTIVATION_GATE.md` documenta el contrato de entrada. Ese comando no sustituye
la auditoría de la URL ni la decisión humana de publicación.

`data/brand.json` es el control ejecutable. Si `publicar: true` convive con una
condición global incompleta, el gate debe fallar; no se corrige para forzar la
salida. La autorización y los activos de cada caso se evalúan por separado al
construir `publicProjects`; un caso no autorizado nunca entra en una ruta,
imagen social, sitemap o JSON-LD público.

## 2. Preview candidata protegida

Antes de habilitar previews, verifica con evidencia actual quién puede aprobar
el entorno GitHub `preview`, qué bypasses existen y si la integración de Vercel
puede desplegar por otra vía. Obtén primero la aprobación aplicable para esa
inspección remota. Registra la fuente y fecha de la evidencia, sin secretos.
`ENABLE_VERCEL_PREVIEWS=true` no autoriza futuras candidatas: cada ejecución
debe estar cubierta por una aprobación con SHA exacto, destino y nivel de acceso.
Si no puedes demostrar esa cobertura, no habilites ni ejecutes previews. Si ya
están habilitadas y falta evidencia, informa del bloqueo y solicita autorización
para cualquier cambio remoto; no declares que las has desactivado.

1. Crear una rama/PR exclusiva de activación y reservar sus archivos.
2. Configurar el entorno Vercel `preview` con autenticación comprobada.
3. Incorporar secretos solo en Vercel/GitHub: IDs de proyecto, token, dominio de
   envío, `RESEND_API_KEY`, buzones y, si se aprueban, IDs analíticos. Registrar
   `CONTACT_RATE_LIMIT_MODE=vercel-waf` solo después de acreditar la regla externa.
4. Generar un build nuevo después de fijar esas variables. Las páginas se
   prerenderizan: cambiar una variable en Vercel no modifica un artefacto ya
   construido ni una URL candidata existente.
5. Mantener producción y dominios desconectados.
6. Activar temporalmente `ENABLE_VERCEL_PREVIEWS=true` solo con autorización.
7. Dejar que el job `Gated Vercel preview` construya el SHA exacto tras el gate.
8. Registrar URL, SHA, conjunto/versionado de variables, expiración/acceso y
   responsable en el handoff.

No se comparte una URL hasta verificar que exige autenticación. `noindex` no se
considera un control de acceso. Cualquier cambio posterior de variable que afecte
identidad, dominio, metadata, formulario, consentimiento o analítica invalida la
auditoría candidata: exige rebuild/redeploy del mismo SHA y repetir el apartado 3.

## 3. Auditoría candidata

Sobre la URL exacta, comprobar en los cuatro idiomas:

- navegación, equivalentes de idioma, formularios, consentimiento y teclado;
- canonical, `hreflang`, `x-default`, Open Graph, robots, sitemap y JSON-LD;
- cero nombres temporales, datos ficticios, borradores o campos `sin dato`
  presentados como afirmación;
- permisos de cada fotografía/cliente y ausencia de metadatos sensibles;
- entrega real de una consulta de prueba, recepción, respuesta, borrado y ausencia
  de PII en logs/analítica;
- rechazo o ralentización verificable de abuso en `/api/contact/` desde más de
  una instancia, sin bloquear el flujo legítimo ni registrar el contenido;
- CSP, cabeceras, dependencias, Lighthouse, Axe, Chromium, WebKit y móvil real;
- páginas, aliases y deployments antiguos inaccesibles.

El resultado se registra como `GO`, `NO-GO` o `GO con condiciones`. Solo `GO`
firmado por la persona responsable permite solicitar la decisión de publicación.

## 4. Decisión formal de publicación

La decisión debe identificar SHA, URL candidata, dominio, fecha, responsable,
variables aprobadas y plan de rollback. Un merge a `main`, un CI verde o una
preview correcta no sustituyen esa autorización.

Tras autorización expresa:

1. conectar el dominio y verificar TLS/DNS;
2. activar producción desde el artefacto/commit auditado, sin reconstruir otro SHA;
3. validar redirecciones, canonical, sitemap, robots e indexación;
4. enviar sitemap a Search Console;
5. activar formulario y analítica solo si sus aprobaciones independientes están
   registradas y la limitación externa del formulario está verificada;
6. ejecutar smoke inmediato y monitorizar logs sin PII.

## 5. Rollback

Ante exposición sin control, formulario con entrega incorrecta, error
legal/identitario, rutas críticas rotas, PII en logs o regresión grave de
seguridad/accesibilidad, prepara inmediatamente el rollback y conserva evidencia
mínima sin datos personales. Ejecútalo solo si la autorización humana identifica
esa acción, entorno y alcance, o si ya existe una autorización de incidente
aplicable. Sin ella, solicita la decisión antes de modificar el estado externo.

1. retirar alias/dominio del deployment defectuoso o promover el último
   deployment aprobado;
2. desactivar `CONTACT_FORM_ENABLED` e IDs analíticos si el incidente los afecta;
3. conservar evidencia técnica mínima sin datos personales;
4. verificar HTTP, aliases y DNS después del rollback;
5. abrir incidente y no reactivar hasta un nuevo `GO`.

## 6. Comprobación antes de cada intento

Antes de ejecutar este runbook:

1. consultar `ACTIVATION_INPUTS.md` sin copiar sus valores aquí;
2. guardar la salida JSON de `npm run check:activation`;
3. confirmar que el SHA, las variables y las evidencias pertenecen a la misma
   candidata;
4. comprobar que Vercel no conserva un deployment o dominio inesperado;
5. registrar la autorización exacta para la acción externa que corresponda.

Si cualquiera de estas comprobaciones falla, no se crea ni reutiliza una URL y
el proceso vuelve a la fase de preparación.
