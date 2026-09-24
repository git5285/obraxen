# Home oficial de OBRAXEN

La referencia aprobada por el usuario es la web publicada en https://obraxen.com.
Desde el 23 de septiembre de 2026, su fuente recuperada vive dentro del repositorio
en `apps/public-site/`. No usar `src/app/[lang]/page.tsx` como base de esa Home:
pertenecía a la implementación anterior, ahora retirada de esta candidata.

## Abrir y construir la Home aprobada

Requiere las dependencias y el runtime fijados por el repositorio. Las pruebas
Home también necesitan Chromium de Playwright: seguir la
[preparación de navegadores](README.md#preparación-de-navegadores), incluidos
los requisitos de sistema en Linux.

```sh
npm run dev
# http://127.0.0.1:4387 — Home aprobada, modo desarrollo
npm run build
npm run start
# mismo puerto, build optimizado
npm run test:published
# requiere el build anterior; verifica comportamiento, sin consultar producción
npm run check:home
# lint y pruebas de Home + build + navegador, en un solo comando
```

No arrancar dos servidores en el mismo puerto. Los scripts aceptan
`-- --port <puerto>`. El servidor escucha por defecto solo en 127.0.0.1.
En desarrollo, el HTML se vuelve a empaquetar al guardarlo; recargar la página
para ver el resultado. No es necesario editar el módulo generado.

## Fuente única y límites

- `apps/public-site/public/index.html`: documento canónico con estructura,
  estilos e interacciones generales. La navegación y los enlaces inactivos se
  declaran directamente; no se sustituyen al terminar de cargar.
- `apps/public-site/public/assets/`: imágenes y vídeo recuperados,
  `home-i18n.js` para traducción y `home-contact.js` para validación,
  selección de reparación y preparación del borrador de correo.
- `apps/public-site/app/route.js`, `app/en/route.js` y `app/de/route.js`:
  las tres rutas originales de Next.js.
- `generate-route-content.mjs`: empaqueta el HTML canónico antes del desarrollo
  o build. `app/generated-home-html.js` es generado e ignorado por Git; no editarlo.
- `docs/published-site-source.json`: despliegue de recuperación y hashes históricos,
  no el inventario vigente ni una prueba del estado publicado hoy.

Las rutas son `/` (español), `/en` (inglés) y `/de` (alemán); las barras finales
redirigen como en el despliegue. El HTML inicial es español y el script aplica
la traducción en el navegador. `/es` y `/fr` no son rutas de esta aplicación.

Se conservan navegación por anclas, cinco proyectos, seis sectores, selección
de reparación, vídeo, contacto y desplegables legales. El formulario prepara
un enlace `mailto:`; no envía consultas ni almacena sus datos en el servidor.
Las Noticias y las páginas interiores permanecen ocultas/inactivas como en la
versión publicada. No activar enlaces, APIs, analítica, indexación o nuevos idiomas
como consecuencia implícita de esta recuperación.

## Verificar y trabajar

`npm run test:published` comprueba el build local en escritorio y móvil, tres
idiomas, imágenes, navegación, vídeo, carrusel, sectores, diálogo, borrador de
correo y textos legales. No contacta producción ni envía correos.

Solo con autorización para esa lectura remota, la comparación explícita con producción se ejecuta con:

```sh
npm run test:published -- --compare-production
```

Esta variante lee la web pública y compara HTML, todos los archivos públicos de
la candidata actual (incluidos los nuevos), contenido renderizado,
geometría y capturas. Los informes y PNG se generan en
`test-results/published-home/`. La comparación exige equivalencia exacta con
la referencia; una mejora deliberada futura deberá revisarse como diferencia.

El verificador exige cero errores de navegador. Comprueba foco al abrir/cerrar
el menú y al cambiar entre móvil y escritorio, navegación sin JavaScript y
conservación del texto de consulta al borrar su contexto. También sirve una
variante editorial en memoria para comprobar que un cambio de texto no rompe
el contrato de navegación ni las traducciones con clave estable.

La incidencia de foco de la recuperación está corregida en la fuente local.
Los hashes originales siguen siendo evidencia histórica, no una excepción
para admitir errores. `--compare-production` conserva su exigencia de igualdad
exacta y detectará las diferencias deliberadas mientras producción no cambie.
No compara los assets actuales con los hashes históricos. Para una URL candidata
explícita existe `--compare-url=<origen>`; exige la autorización remota aplicable,
salvo cuando ambas direcciones son servidores locales. El informe distingue
`recoverySourceDeploymentId` de `comparisonDestination`: no infiere qué deployment
sirve un alias.

La integridad de la recuperación original es otra comprobación, solo local:

```sh
npm run check:home:recovery -- --recovery-root=/ruta/absoluta/a/original
```

Si esa copia no está disponible, la comprobación histórica queda pendiente;
no se sustituye por la fuente mantenida ni se actualiza el inventario original.

## Mantener traducciones

Los comandos explícitos de esta aplicación son `dev:home`, `build:home`,
`start:home` y `test:e2e:home`; sus aliases históricos anuncian el mismo destino.
`test:home` selecciona su inventario positivo; `test:home -- --list` permite
consultarlo. `test:e2e` y los comandos del legado ya no existen en esta candidata.

Para un cambio de texto: localizar el nodo en `public/index.html`, conservar su
`data-i18n` y revisar la entrada con esa clave en `keyedMessages` de
`public/assets/home-i18n.js` (orden ES, EN, DE). El HTML gobierna el español
renderizado; las variantes EN/DE requieren revisión editorial propia. Nunca
editar `app/generated-home-html.js` ni `src/lib/dictionaries/` para esta Home.

Los cuatro resúmenes de soluciones usan `solution.{repair,polish,level,prepare}.summary`.
Una corrección española de puntuación ya no cambia su identificador. La prueba
`public-home.test.ts` modifica esa puntuación en memoria en los tres idiomas.
Al tocar otra zona sin clave, migrar solo esa zona con traducciones completas;
el resto conserva detección de ausencias y compatibilidad por texto exacto.
`test:home` comprueba el contrato; `check:home` añade build y navegador. Si cambia
un titular o metadata comprobados literalmente, revisar también las expectativas
editoriales de `verify-public-site.mjs`, sin relajar navegación ni errores.

Las claves `data-i18n` de navegación y titular se resuelven con `message(key)`
en `home-i18n.js`; pueden cambiarse sus textos españoles sin perder EN/DE.
La clave del titular traduce solo su nodo de texto directo y conserva el `span`.
El catálogo conserva las coincidencias de texto para las zonas aún no migradas.
Al editar esas zonas, actualizar las traducciones o introducir una clave estable.
`missingTranslations` enumera texto inicial y mensajes dinámicos sin traducción;
`test:published` falla si la lista no está vacía. Los nombres propios e
identificadores invariables se enumeran explícitamente, no mediante una exclusión
genérica de textos desconocidos. `npm run test:home` comprueba el traductor,
las claves del HTML y los rangos de carruseles. Los mensajes de contacto usan
`message("contact.…", { count, name })`: las traducciones y sus parámetros
pertenecen al catálogo de claves, no a concatenaciones de frases en el formulario.
El observador audita nodos añadidos, cambios de texto y atributos; reconoce las
salidas traducidas conocidas para no denunciarlas como ausencias.

## Tres recorridos de mantenimiento

Antes de cada recorrido, `npm run check:checkout` identifica el checkout, SHA y
cambios pendientes sin consultar remotos. Para una expectativa estricta usar
`-- --expected-head=<SHA completo> --require-clean`. Un informe sin errores no
afirma que el checkout sea el último remoto ni que esté publicado.
La introducción editorial del contacto utiliza `data-i18n="contact.intro"`;
su texto español vive en el HTML y EN/DE en el catálogo de claves. Una prueba
cambia el texto español en memoria y verifica que EN/DE no pierden traducción.

1. **Contenido:** editar `public/index.html` o el asset correspondiente. Para
   una zona con `data-i18n`, mantener su clave y revisar las variantes EN/DE en
   el catálogo; para una zona aún exact-text, actualizar su correspondencia o
   migrar solo esa zona. Ejecutar `check:home`; no tocar el módulo generado.
2. **Interacción:** contacto en `home-contact.js`; textos en las claves
   `contact.*` de `home-i18n.js`; navegación/vídeo/carruseles en el HTML.
   Añadir regresión al traductor o al recorrido de `verify-public-site.mjs`,
   según el comportamiento. Conservar foco, teclado, borrador sin envío y texto
   del visitante. Un cambio de API, almacenamiento o activación es otro alcance.
3. **Candidata local:** ejecutar la receta siguiente después de comprobar Home.
   No copiar manualmente el repositorio ni usar el árbol `src/` como entrada.

## Preparar una candidata Home sin publicar

```sh
npm run prepare:home -- --output=/ruta/absoluta/nueva/fuera-del-checkout
# Para evidencia local de cambios todavía sin commit:
npm run prepare:home -- --output=/ruta/absoluta/nueva/local --allow-worktree
```

El directorio padre debe existir; el destino no debe existir. La receta nunca
sobrescribe ni elimina archivos. Requiere el runtime y las dependencias locales
fijadas; no instala, no descarga LFS ni ejecuta comandos Vercel. Copia las fuentes
canónicas, las herramientas mínimas y las dependencias existentes para construir
desde cero, sin reutilizar `.next`. Rechaza enlaces simbólicos en fuentes y
punteros LFS sin resolver.

`home-candidate.json` registra inputs/hashes, SHA base, estado local, fingerprint
del runtime, rutas y resultado. Solo atribuye un `exactCommit` si el checkout y
sus inputs coinciden con Git. `--allow-worktree` no convierte cambios pendientes
en un commit ni en una publicación. `--source-only` prepara fuentes sin build y
lo declara como tal, nunca como comprobación aprobada.

El build se limita a `/`, `/en`, `/de` y verifica que sus cuerpos corresponden
al HTML canónico. Se excluyen legado, datos internos, coordinación, configuración
de proyecto Vercel y archivos de entorno. Se conserva el lockfile compartido:
separar dependencias es una decisión futura, no un requisito de esta receta.
El `vercel.json` generado describe raíz/build para una revisión posterior;
la salida local es `apps/public-site/.next`, **no** `.vercel/output` ni un
artefacto listo para `vercel deploy --prebuilt`.

La preparación local de configuración y la auditoría de Build Output están
versionadas en `scripts/home-platform-artifact.mjs`; consultar la sección A.1
del runbook. No ejecutan Vercel, no leen credenciales y no conceden autorización.

`check:home:contract` y el prebuild comprueban noindex/nofollow, bloqueo del envío
nativo, recursos locales, ausencia de primitivas de envío/analítica/almacenamiento
y alcance de rutas. Son guardas de regresión estática, no un analizador completo
de JavaScript ni autorización legal. El navegador añade comprobaciones de
solicitudes, cookies, almacenamiento y rutas excluidas. El contrato interno de activación sigue
siendo independiente y no se debilita por estos checks.

La receta y sus pruebas se incluyen en `test:home`; la automatización no puede
modificar sus protecciones, rutas, configuración o manifiestos de dependencias
sin la autoridad correspondiente. HTML editorial y assets ordinarios conservan
su flujo habitual.

La cobertura porcentual de `test:coverage` corresponde a `domain/publication/`,
no al HTML o JavaScript de esta Home. Para esta aplicación, la evidencia de
comportamiento procede de `test:home` y `test:published`.

Antes de editar, respetar las claims de `AGENTS.md` y reservar rutas exactas.
Para la Home aprobada, trabajar en `apps/public-site/`; una prueba sobre el
árbol legado no demuestra nada sobre la web publicada.

## Implementación anterior retirada

`src/`, sus comandos y herramientas exclusivas se retiraron con autorización.
Se conservan `css/`, `data/`, `img/`, `public/` y los contratos internos en
`domain/publication/`. No se trasladan sus textos, imágenes, APIs o configuración
a Home. Véase [inventario y recuperación](docs/LEGACY_RETIREMENT.md).

La ruta externa histórica `home-refined.html` documentada aquí antes de la
recuperación ya no existe. Vercel conservaba las fuentes subidas del despliegue
`dpl_8GnZiT4XQpcpssqysL4aWshmfB9t`; fueron recuperadas y verificadas por hash.
No se ha identificado un commit Git original asociado a ese despliegue CLI.
Véase [la trazabilidad de recuperación](docs/PUBLISHED_SITE_RECOVERY.md).

Esta integración es local. No autoriza ni ejecuta un nuevo despliegue,
publicación, cambio de dominio o eliminación del trabajo anterior.
