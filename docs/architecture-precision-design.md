# Precisión industrial · alternativa local

Ruta: `/es/architecture-preview/precision/`. Modo Persuade. No sustituye la preview original ni modifica la identidad global.

## Direction contract

THESIS: El soporte real y la intervención concreta lideran; no otra nave generada detrás de un eslogan.

OWN-WORLD: Blanco, tinta y naranja de los tokens existentes. Avenir/sistema. Superficies rectas, fotografía sin filtros y controles explícitos.

STORY: Entender qué se repara, ver experiencia documental del equipo, identificar una necesidad y contactar.

FIRST VIEWPORT: Titular grande a la izquierda sobre blanco; explicación y CTA a la derecha. Debajo, fotografía documental panorámica con pie propio. Móvil: titular, CTA y foto, sin métricas intermedias.

FORM: Dirección fijada por el usuario, «precisión industrial sobre una superficie real»; ejecución code-led. La interacción abre información técnica en la misma fila de la necesidad. Movimiento breve del indicador, sin entradas que oculten contenido.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Límites

Se mantienen familias y tokens globales. El sistema de esta alternativa se documenta aquí; DESIGN.md global no se reemplaza. Sin publicación, analítica nueva, envío ni almacenamiento. Fotografías existentes en img/proyectos, bytes sin cambios e inlined después del gate local. Los casos son intervenciones anteriores de integrantes del equipo.

## Nota del registro operativo

El registro inicial introdujo por error occurredAt=15:25Z en lugar de la hora real (~12:28Z). Los eventos posteriores conservan ese suelo cronológico sin reescribir el log inmutable; recordedAt refleja la hora real del sistema.

## Overview

Sistema actual de la alternativa local: «precisión industrial sobre una superficie real». Extracción del CSS y los componentes, sin medición de estilos computados en navegador. Fuentes: `css/architecture-precision.css`, `css/tokens.css` y `src/components/architecture-precision.tsx`; procedencia de imágenes contrastada con `src/app/[lang]/architecture-preview/precision/page.tsx` y `data/proyectos.json`.

Composición blanca, tipografía de sistema, fotografía documental y filas técnicas desplegables; servicios sobre fondo hormigón y contacto sobre tinta. Estas observaciones pertenecen únicamente a la ruta alternativa. Maxwell emitió «ship» para el alcance visual, según el encargo; esta documentación no añade una revisión visual independiente.

## Colors

Valores canónicos heredados de `css/tokens.css`, sin crear ni modificar tokens:

| Token | Valor | Uso observado |
| --- | --- | --- |
| `--brand-primary` | `oklch(64.607% 0.1943 41.116)` | Fondo del CTA principal y flecha del correo |
| `--brand-primary-dark` | `oklch(55.343% 0.174 38.402)` | Hover, foco sobre claro, indicadores, errores y números de proceso |
| `--brand-primary-light` | `oklch(75.764% 0.159 55.934)` | Hover, foco e indicador sobre contacto oscuro |
| `--brand-ink` | `oklch(20.924% 0.006 271.116)` | Texto principal y fondo de contacto |
| `--brand-bg` / `--brand-on-dark` | `oklch(100% 0 0)` | Fondo blanco / texto sobre oscuro |
| `--brand-muted` | `#595d60` | Texto secundario y bordes de campos |
| `--brand-concrete` | `#f2f4f3` | Aviso de preview y servicios |
| `--brand-line-strong` | `oklch(89.895% 0.015 260.729)` | Separadores de 1px |

En contacto, texto secundario y separadores usan `rgb(from var(--brand-on-dark) r g b / .72)` y `/ .25`, respectivamente.

## Typography

Display: `'Avenir Next', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif`. Texto: `-apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif`. Familias locales; la alternativa no incorpora fuentes remotas. Interlineado base declarado: `1.55`. No se infiere un tamaño raíz en píxeles ni una razón modular.

| Papel | Escritorio | Hasta 760px |
| --- | --- | --- |
| H1 | `clamp(3.25rem,6.7vw,6rem)`, peso 600, línea `.99` | `clamp(2.75rem,12vw,4.75rem)`, línea `1.02` |
| H2 | `clamp(2.25rem,4vw,3.75rem)`, peso 600, línea `1.06` | `2.5rem` |
| H2 contacto | `clamp(2.75rem,5.1vw,4.5rem)` | `2.75rem` |
| Título de caso | `2.125rem`, peso 600, línea `1.1` | `1.75rem` |
| Introducción | `1.0625rem`, ancho máximo `37ch` | `.9375rem`, `40ch` |
| Notas / navegación | `.8125rem` / `.875rem` | Notas mantienen `.8125rem`; menú usa `1.125rem` |

H1–H3 usan texto equilibrado, sin guionado y tracking `-.035em`; H1 móvil usa `-.04em`. Los números de proceso son tabulares. Los valores fluidos son los declarados, no mediciones de una captura.

## Layout

Contenedor centrado: `calc(100% - 96px)`, máximo `1248px`; hasta 760px pasa a `calc(100% - 40px)`. Secciones: `104px` verticales, `64px` en móvil. Cabecera relativa, de altura mínima `98px` (`78px` móvil).

Hero: columnas `1.55fr 1fr`, gap `64px`, padding vertical `60px 44px`; hasta 1000px, `1.4fr 1fr` y gap `32px`; hasta 760px, una columna, gap `22px` y padding `36px 30px`. Cabeceras de sección: `1.15fr 1fr`, gap `72px`, margen inferior `56px`; en móvil, una columna, gap `24px` y margen `36px`.

Fotografías de caso: `1.65fr 1fr`, gap `20px`; en móvil se apilan con gap `14px` y la segunda ocupa el `76%`, alineada a la derecha. Relación de aspecto del caso destacado: `1400/646`; restantes: `4/3`. Proceso: tres columnas iguales, gap `48px`; móvil: una, gap `28px`. Formulario: máximo `820px`, padding `36px`, campos en dos columnas con gap `24px`; móvil: una columna y padding `22px 16px`.

## Elevation & Depth

La hoja local no declara sombras, degradados ni filtros. La separación se obtiene mediante fondos blanco/hormigón/tinta, espacio y líneas de `1px`. Cabecera con `z-index: var(--z-content)` (`1`); el menú móvil se posiciona debajo mediante `inset:100% 0 auto`. El foco es un contorno de `3px` con separación de `5px`.

## Shapes

CTA, campos y botones de formulario declaran radio `0`; no adoptan los radios globales. Flechas SVG: `24×24`, trazo `1.5`; flecha del correo `44×44` y `24×24` móvil. Indicador de apertura: caja `20×20`, barras de `2px`; su barra vertical gira de `90deg` a `0` al abrir. Imágenes rectangulares con `object-fit:cover`.

## Components

- Navegación: enlaces internos a experiencia, servicios y proceso; enlace de contacto independiente. Hasta 760px se muestra el menú de disclosure con control `44×44`. Se conserva el enlace «Versión anterior» a la preview original y el salto al contenido.
- CTA principal: naranja con texto tinta, peso 700, padding `14px 20px`, altura mínima `54px` (`50px` móvil); hover naranja oscuro con texto blanco.
- Servicios: cinco filas nativas `details/summary`, agrupadas con `name="precision-services"`. Resumen mínimo `100px` (`108px` móvil), padding vertical `24px`; título naranja oscuro al pasar el cursor o abrir. La información técnica aparece en la misma fila.
- Casos: resultado antes del estado inicial, pies por etapa, relato y registro desplegable de superficie, materiales, duración y resultado. Los valores ausentes conservan los fallbacks explícitos del componente.
- Contacto: correo dominante, teléfono y WhatsApp; disclosure de demostración rotulado «Sin envío ni almacenamiento». Campos con padding `12px`, borde de `1px` y textarea mínimo `130px`; `aria-invalid=true` añade borde naranja oscuro de `2px`. Botón de demostración deshabilitado: opacidad `.5`, cursor `wait`.
- Movimiento: enlaces con `150ms`; indicador con `250ms`; ambos usan `cubic-bezier(0.16,1,0.3,1)` y eliminan su transición con `prefers-reduced-motion:reduce`.

Procedencia existente de los cuatro raster, registrada en `data/proyectos.json`:

| Archivo | Registro y uso | Dimensiones declaradas por la ruta |
| --- | --- | --- |
| `img/proyectos/delticom/resultado.webp` | `delticom-hannover`: resultado; hero y primer caso | `1400×646` |
| `img/proyectos/delticom/estado-inicial.webp` | `delticom-hannover`: estado inicial | `1400×646` |
| `img/proyectos/hologram/resultado.webp` | `hologram-paris`: resultado | `1400×1050` |
| `img/proyectos/hologram/estado-inicial-huecos.webp` | `hologram-paris`: estado inicial | `1400×1050` |

Son fotografías documentales existentes de intervenciones anteriores de integrantes del equipo; los registros inspeccionados no identifican al fotógrafo. La ruta lee los archivos tras comprobar idioma español, desarrollo, `OBRAXEN_ARCHITECTURE_PREVIEW=local-only` y ausencia de `VERCEL`, y los incorpora como datos WebP base64. `ResponsiveImage` recibe `unoptimized`; hero eager/prioridad alta, casos lazy. No se modifican los raster. El recorte del hero es CSS: altura `clamp(280px,31vw,446px)` y posición `center 65%`; móvil: `250px` y `43% 70%`. Los encuadres distintos no constituyen una comparación desde el mismo punto de vista.

## Do's and Don'ts

- Do conservar tokens y familias existentes, contornos de foco, disclosure explícito y reducción de movimiento.
- Do mantener procedencia, etapa, atribución al equipo y advertencia sobre encuadres junto a la experiencia documental.
- Do conservar la preview original, el carácter local y los límites de demostración.
- Don't presentar dimensiones declaradas como mediciones del archivo ni esta extracción como verificación de navegador.
- Don't inventar métricas, autores, resultados, permisos ni nuevas reglas globales a partir de esta alternativa.
- Don't reemplazar `DESIGN.md` global ni escribir sidecars, contexto de producto, claims, código, tokens o raster como parte de esta documentación.
