# Recuperación de la Home publicada aprobada

La web pública es la referencia visual y funcional aprobada por el usuario.
Se recuperó del despliegue Vercel `dpl_8GnZiT4XQpcpssqysL4aWshmfB9t`, creado
el 16 de septiembre de 2026, URL `obraxen-kmi22mk84-user89392.vercel.app`.
El despliegue tiene origen CLI y no proporciona un commit Git de origen.

## Evidencia de procedencia

La API de Vercel conservaba 74 archivos fuente, incluidos HTML, Route Handlers,
generador, traductor, imágenes, vídeo, manifiestos y configuración de build.
Se recuperaron mediante peticiones GET con la sesión existente; cada contenido
se verificó contra su UID SHA-1 y se registró también su SHA-256.
El inventario está en `published-site-source.json`, junto a este documento.

La copia original completa permanece localmente en
`.vercel/approved-home-recovery-20260923/original/`, fuera de Git. Su manifiesto
está en `manifest.json` y el inventario previo del checkout en `control-before.json`.
`scripts/recover-published-home.mjs` documenta la recuperación y nunca despliega.
No necesita ejecutarse para construir, arrancar ni editar la web recuperada.

El vídeo original se versiona mediante Git LFS, sin recodificarlo. Un clon nuevo
necesita Git LFS y `git lfs pull` antes del build; el checkout de calidad en CI
lo descarga explícitamente. Antes de entregar cambios en objetos LFS, ejecutar
`git lfs push origin <rama-candidata>` con la autorización Git correspondiente:
el hook de calidad propio no sustituye ese transporte de objetos. El límite de
blobs del repositorio y sus controles de higiene permanecen intactos.

## Integración

La aplicación canónica es `apps/public-site/`, dentro del repositorio y aislada
del árbol anterior. Mantiene los mismos Route Handlers y el mismo generador que
producción. Los seis archivos de texto funcionales y los 29 assets binarios se
importaron sin modificar su contenido. No se reconstruyó el diseño con JSX,
capturas o estilos aproximados.

Se eliminaron únicamente duplicaciones de la organización de la copia de trabajo:
la fuente canónica es `public/index.html`, sin copias editables en tres idiomas;
los recursos viven en `public/assets/`, sin una segunda carpeta `assets/`.
Todos los duplicados originales se conservan en la recuperación aislada.
El módulo `app/generated-home-html.js` se regenera desde el HTML antes del build
y no se versiona. La aplicación usa las versiones ya fijadas por el lockfile raíz:
Next.js 16.3.5, React/React DOM 19.3.0. No requiere otra instalación de dependencias.

Los comandos raíz `dev`, `build` y `start` seleccionan la Home aprobada. Las
entradas `*:legacy` conservan la aplicación anterior sin sobrescribir `src/`,
`data/`, `css/` ni `img/`. Las suites anteriores usan ahora sus entradas de legado;
la comprobación de la Home recuperada se incorpora al gate local y al workflow CI.
Los artefactos generados del nuevo build quedan fuera de los inputs del recibo
de calidad, pero sus fuentes HTML, JS y assets siguen incluidas.

## Equivalencia y comprobaciones

`npm run test:published -- --compare-production` compara las rutas `/`, `/en` y
`/de`, todos los recursos públicos actuales de la candidata y seis vistas (tres idiomas
en 1440×1000 y 390×844). Comprueba el HTML servido, contenido renderizado,
geometría y estilo de elementos principales, enlaces, imágenes y capturas.
Para hacer reproducibles las capturas se cargan las imágenes y se pausa el
vídeo en el mismo fotograma, después de comprobar su reproducción real.

Se ejercitan navegación por anclas, menú móvil, carrusel, selección de sector,
diálogo de reparación y foco, validación y preparación local del borrador de
correo, cambio de idioma y desplegables legales. Nunca se pulsa el enlace que
abre el correo ni se envían consultas. Los errores de consola y solicitudes
fallidas se recogen desde antes de navegar. Los resultados se guardan en
`test-results/published-home/`; una comparación exacta fallida no acredita paridad.

Desde la separación de evidencias, la paridad usa el inventario actual,
no los hashes de la recuperación. Los archivos nuevos también se comprueban.
La integridad histórica se verifica por separado y sin red:
`npm run check:home:recovery -- --recovery-root=/ruta/absoluta/a/original`.
Ese comando valida los 74 archivos contra SHA-256, tamaño y UID SHA-1, sin
modificar el inventario. La comparación con una web remota requiere su permiso;
el chequeo local ordinario no consulta producción.

La ruta `/en` traduce su HTML inicial español mediante JavaScript: un GET de
texto no representa el idioma final que ve el visitante. Esta recuperación
conserva ese mecanismo. No añade `/es`, `/fr`, traducción en servidor ni páginas
interiores; serían cambios de producto independientes.

### Resultado medido — 23 de septiembre de 2026

- 74 archivos originales recuperados con UID SHA-1 verificado; 35 fuentes/assets
  importados en la aplicación coinciden byte por byte con sus SHA-256 originales.
- Las tres respuestas HTML coinciden con producción:
  `8c0a34892ce8d879920fcb19f8957bb5d230c02b129c30271f55f2560ef88e11`.
- 30 recursos públicos coinciden byte por byte (incluidos traductor y vídeo).
- Las seis capturas completas coinciden exactamente con producción. También
  coinciden texto, enlaces, imágenes y geometría; las interacciones comprobadas
  pasan con la incidencia de foco heredada que se detalla debajo.
- Build publicado, build de legado, lint, TypeScript y 64 pruebas focalizadas
  de runtime, gate y configuración ESLint completados correctamente.
- `npm run test:published` arranca y cierra por sí mismo su servidor temporal;
  seis vistas verificadas sin solicitudes externas. El modo desarrollo sirve el
  mismo HTML y se comprobó que guardar su fuente regenera el módulo automáticamente.
- El despliegue público conserva su identificador original. No se ejecutó
  commit, push, PR, despliegue ni modificación remota.

| Vista | SHA-256 de captura local y producción |
|---|---|
| ES 1440×1000 | `48adc7640687b2a35846314e68569da0e69e4d7caa77002fb86cf52c98904238` |
| EN 1440×1000 | `f1cadf973383bf733d9e2b135dda50d352cd6558d2448f01441d5f73b39a7fd4` |
| DE 1440×1000 | `705b4fa135836d7e3404a175e83766136980bb7d462c22a6bbc96e90c1fab2f5` |
| ES 390×844 | `43acfa5801b920c5934a3fbf097336054e9339aa461bbe0cf44619600ec9b3c4` |
| EN 390×844 | `590c62909a3bc93a9d53312d5824083c315c8e262fb727a9f7f1686d45452836` |
| DE 390×844 | `03d306bb6547f25e11f72f8b8a1b4eb3cf4abe698f05f595821b0a5d772b37f7` |

## Alcance y límites

La recuperación comprobó una incidencia heredada: al abrir el menú móvil,
`setMenu` intenta enfocar `.mobile-submenu-toggle`, que el propio script de la
landing ha eliminado. Produce `Cannot read properties of null (reading 'focus')`
en producción y en local, en ES/EN/DE; el menú se abre y permite navegar, pero
no recibe el foco inicial previsto. No se corrigió durante la recuperación exacta.
En la recuperación, el verificador admitía exclusivamente ese error, en móvil, procedente de
`setMenu` y solo mientras el HTML conservaba el hash original; cualquier otro error
fallaba. El informe histórico diferenciaba paridad aprobada de ausencia de errores
y enumeraba esta incidencia.

### Mantenimiento local — 24 de septiembre de 2026

La navegación final ahora se declara en el HTML y enfoca enlaces existentes,
también al cambiar de tamaño. Se retiraron la inicialización de submenús
sustituidos y la excepción de errores ligada al hash completo del documento.
El verificador local exige cero errores y prueba ediciones editoriales en memoria.
El contacto está separado en `public/assets/home-contact.js`; la traducción
comprueba ausencias y admite claves estables y posiciones expresadas como rangos.
Estos cambios locales son posteriores a la recuperación exacta: no alteran
su inventario ni sus hashes y no acreditan una nueva equivalencia con producción.

La preparación local está versionada en `scripts/prepare-home-candidate.mjs`;
ya no depende de reconstruir una receta guardada en `.vercel/`. El resultado
distingue inputs confirmados en Git y worktree, e incluye solo la Home y las
herramientas mínimas para construirla. No importa legado, secretos ni asociación
de proyecto Vercel, y no crea por sí mismo una URL o un deployment.

Se conserva lo publicado, incluidos textos, identidad, teléfono y correo,
noindex, enlace mailto y páginas interiores ocultas. No se modifican ni se
interpretan como aprobadas las banderas legales/comerciales del árbol legado.
El diseño aprobado no constituye aprobación de cambios funcionales adicionales.

La integración no modifica Vercel, dominios, protección, analítica o producción.
Un despliegue futuro requiere revisión, autorización específica y comprobar la
configuración de raíz/build de Vercel para `apps/public-site`; no debe desplegarse
el snapshot completo por inferencia ni activar la implementación anterior.

## Guía para las demás tareas

Consultar `HOMEPAGE.md`, registrar claim con rutas exactas y editar la fuente
canónica en `apps/public-site/`. No usar las antiguas portadas de `src/` ni
recrear el archivo externo perdido. Para cambios de diseño o comportamiento,
mostrar explícitamente la diferencia frente a producción y verificar la nueva
versión local. Las mejoras del legado no se transfieren automáticamente.
