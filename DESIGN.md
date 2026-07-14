# Sistema de diseño — reglas verificables

> Cada regla es una aserción comprobable, no una preferencia. Incluye **cómo
> verificarla** (comando o método) y su **estado actual** en el repo a fecha
> 2026-07-14. Los valores canónicos viven en
> [`css/tokens.css`](css/tokens.css); este documento define las reglas de uso.
>
> Convención de estado: **CUMPLE** = el código ya lo satisface ·
> **DESVÍO** = regla acordada que el código aún no cumple (migración pendiente).

---

## 1. Tokens

**Regla.** Todo color, familia tipográfica, radio, espaciado, z-index y easing
procede de una custom property definida en `css/tokens.css`. Prohibido el literal
en `index.html` (hex, `rgb/rgba`, `#fff`, `999px`, nombres de fuente, `z-index`
numérico, `cubic-bezier`/`ease` a pelo).

- **Color:** los 26 tokens en OKLCH son equivalentes exactos (round-trip byte a
  byte) al sRGB original. Recolorear la marca = editar **solo** `tokens.css`.
- **Cómo verificar (color/fuente):**
  ```sh
  grep -nE "#[0-9A-Fa-f]{3,8}|rgba?\([0-9]|font-family:'" index.html | grep -v "%23"
  ```
  Salida vacía = CUMPLE. (El único literal admitido es `%23EA580C` del favicon en
  data-URI de `index.html:13`, que no puede leer variables CSS — excepción documentada.)
- **Estado:** **CUMPLE** para color y fuente. Ver §4 y §5 para z-index y motion.

---

## 2. Escala tipográfica y emparejamiento de fuentes

**Regla A — Escala modular.** Los tamaños de texto salen de la escala
`--fs-*` (base `1rem`, razón **1.25**): `--fs-xs 0.64` · `--fs-sm 0.8` ·
`--fs-base 1` · `--fs-md 1.25` · `--fs-lg 1.563` · `--fs-xl 1.953` ·
`--fs-2xl 2.441` · `--fs-3xl 3.052` · `--fs-4xl 3.815` rem.

**Regla B — Emparejamiento de fuentes (exactamente 2 familias).**
- **Display** (`--font-display`, *Space Grotesk*): **solo** en `h1`, `h2`,
  `.relato .linea` y `.logo`.
- **Cuerpo/UI** (`--font-sans`, *Inter*): todo lo demás.
- Nunca una tercera familia. Nunca *Space Grotesk* en texto corrido, nunca
  *Inter* en un `h1`/`h2`.

- **Cómo verificar (emparejamiento):**
  ```sh
  grep -noE "font-family:[^;}]+" index.html
  ```
  Debe devolver únicamente `var(--font-sans)`, `var(--font-display)` e `inherit`.
- **Estado:** Regla B **CUMPLE** (grep: `var(--font-sans)`, `var(--font-display)`,
  `inherit`×2). Regla A **DESVÍO**: los tamaños usan `clamp()` literales
  (`clamp(3rem,7.6vw,6.2rem)`, etc.), no la escala `--fs-*`. Migración pendiente;
  los `clamp` responsivos deben re-expresarse contra la escala.

---

## 3. Grid y breakpoints

**Regla.**
- **Contenedor:** ancho máximo de contenido `--maxw` (**1180px**), canalón
  `--gutter` (**24px**) vía `.wrap`. Las bandas full-bleed (hero, relato, cierre)
  sangran hasta el borde y re-centran su contenido con el mismo `--maxw`.
- **Rejillas de tarjetas:** `repeat(auto-fit, minmax(<min>, 1fr))` — reflow
  automático, sin media queries por tarjeta.
- **Breakpoint:** **uno solo**, `--bp-mobile` = **860px** (`@media (max-width:860px)`).
  A ≤860px las rejillas de 2+ columnas colapsan a 1 (o 2 en `.stats`/`.foot`).
  Prohibido introducir breakpoints sueltos fuera de este valor.

- **Cómo verificar:**
  ```sh
  grep -oE "@media \(max-width:[0-9]+px\)" index.html   # debe existir solo 860px
  grep -oE "max-width:[0-9]+px" index.html | sort -u     # anchos de layout
  ```
- **Estado:** **CUMPLE** — un único breakpoint de layout (860px) + el de
  `prefers-reduced-motion`. Rejillas con `auto-fit/minmax`. *Nota:* los valores
  1180/24/860 ya son tokens (`--maxw`/`--gutter`/`--bp-mobile`) pero `index.html`
  aún los escribe como literales; migrar referencias es DESVÍO menor.

---

## 4. z-index — escala semántica

**Regla.** El apilamiento usa **exclusivamente** la escala semántica de
`tokens.css`, en este orden estricto:

```
--z-dropdown (1000) → --z-sticky (1100) → --z-modal-backdrop (1200)
→ --z-modal (1300) → --z-toast (1400) → --z-tooltip (1500)
```

(+ `--z-skip-link` 1600, por encima de todo, para el enlace de salto.)
**Prohibido cualquier `z-index` con valor numérico literal.** Nada de `z-index:1`,
`z-index:60`, `9999`, etc. Si una capa nueva no encaja, se añade un token a la
escala; no se inventa un número.

- **Cómo verificar:**
  ```sh
  grep -nE "z-index:[0-9]" index.html        # debe ser VACÍO (todo vía var())
  ```
- **Estado:** **DESVÍO**. Hoy hay 6 literales: `z-index:100` (skip), `:80`
  (menú móvil), `:60` (sticky-nav) y tres `z-index:1` (hero/tex/serv). Mapeo de
  migración: skip→`--z-skip-link`, menú móvil→`--z-modal`, sticky→`--z-sticky`,
  los `z-index:1` de contenido sobre fondo→`--z-base`+1 o eliminar (basta
  `position:relative`). Los tokens ya existen en `tokens.css`.

---

## 5. Motion

**Regla A — Curva.** Toda transición/animación usa `--ease-standard`
(`cubic-bezier(0.16, 1, 0.3, 1)`, **ease-out exponencial**). En GSAP, el
equivalente es `expo.out`. Los `scrub` ligados a scroll son la única excepción y
usan `ease:"none"` (lineal, por definición del scrub).

**Regla B — Sin bounce.** Prohibido *overshoot*: nada de `back`, `elastic`,
`bounce`, ni `cubic-bezier` con componente Y fuera de `[0,1]`. `--ease-standard`
llega a 1 sin sobrepasarlo.

**Regla C — Duración.** De la escala `--dur-fast 150ms` / `--dur-base 250ms` /
`--dur-slow 400ms`. Micro-interacciones (hover/estado) ≤ `--dur-base`.

**Regla D — `prefers-reduced-motion` obligatorio.** Debe existir el bloque
`@media (prefers-reduced-motion:reduce)` que anule transiciones/animaciones no
esenciales, y el JS debe envolver la animación en
`(prefers-reduced-motion: no-preference)`.

- **Cómo verificar:**
  ```sh
  grep -c "prefers-reduced-motion" index.html          # ≥ 2 (CSS + JS)
  grep -noE "ease:[^,}]+|transition:[^;}]+" index.html  # curvas/duraciones en uso
  ```
- **Estado:** Regla D **CUMPLE** (bloque CSS `reduce` en `index.html:385` + guard
  GSAP `no-preference` en `:935`). Reglas A–C **DESVÍO**: hoy las transiciones CSS
  usan `ease` (no `--ease-standard`), GSAP usa `power1.out` (no `expo.out`) y las
  duraciones son literales (`.15s`–`.45s`). Sin bounce: **CUMPLE** (no hay
  `back/elastic/bounce` en el repo).

---

## 6. Accesibilidad — contraste

**Regla.** Contraste de color (WCAG 2.1):
- **Texto de cuerpo** (< 24px normal / < 18.66px bold): **≥ 4.5:1**.
- **Texto grande** (≥ 24px normal / ≥ 18.66px bold): **≥ 3:1**.

**Cómo verificar.** Ratio = `(L_claro + 0.05) / (L_oscuro + 0.05)` con luminancia
relativa WCAG. Auditoría de los pares reales de la paleta (calculada sobre los
hex de `tokens.css`):

| Par (uso) | Ratio | Umbral | Resultado |
|---|---|---|---|
| `ink` / `bg` — cuerpo sobre blanco | 17.75:1 | 4.5 | ✅ |
| `ink-2` / `bg` — párrafos catálogo/FAQ | 15.70:1 | 4.5 | ✅ |
| `muted` / `bg` — texto atenuado (stat, tarjeta, footer) | 4.95:1 | 4.5 | ✅ (justo) |
| `primary-dark` / `bg` — kicker, cargo, tipo | 5.18:1 | 4.5 | ✅ |
| `primary-dark` / `primary-tint` — etiqueta m² | 4.88:1 | 4.5 | ✅ |
| `blanco` / `ink` — texto sobre bandas oscuras | 17.75:1 | 4.5 | ✅ |
| `primary-light` / `ink` — kicker en hero (texto grande) | 7.84:1 | 3.0 | ✅ |
| **`blanco` / `primary` — etiqueta del botón CTA (.95rem bold ≈15px)** | **3.56:1** | **4.5** | **❌ FALLA** |
| `primary` / `bg` — acento como texto | 3.56:1 | 4.5 (cuerpo) / 3.0 (grande) | ⚠️ solo válido en grande |

**Reglas derivadas (comprobables):**
- **`--brand-primary` nunca como color de texto pequeño.** Solo se admite en
  texto grande (donde 3.56:1 ≥ 3:1): números `.stat b i` (3.2rem) y `.relato
  .acento` (≈9rem). Verificar: `grep -n "color:var(--brand-primary)"` no debe
  aparecer en reglas con `font-size < 24px`.
- **`--brand-muted-2` (2.72:1) prohibido para texto.** Hoy está definido pero
  **sin uso** (`grep "var(--brand-muted-2)"` → vacío); no introducirlo como texto.
- **Contraste sobre imagen** (hero-sub, labels sobre foto): no garantizable
  estáticamente; verificar en runtime con la imagen real.

- **Estado:** **DESVÍO 1 (real):** el botón CTA primario incumple (3.56:1). Para
  cumplir 4.5:1 con blanco, el fondo del botón debe oscurecerse a
  `--brand-primary-dark` (5.18:1) o subir el tamaño/grosor del label a "grande".
  Resto de texto de cuerpo: **CUMPLE**.

---

## 7. Longitud de línea

**Regla.** Los bloques de **texto corrido** (párrafos, subtítulos largos,
citas) miden **65–75ch**. Titulares display quedan exentos (se miden en `ch`
solo para forzar saltos deliberados, p. ej. `h1` a 12ch).

- **Cómo verificar:**
  ```sh
  grep -noE "max-width:[0-9]+ch" index.html
  ```
  Cada medida de un contenedor de texto corrido debe caer en `[65,75]`.
- **Estado:** **DESVÍO**. Medidas actuales de bloques de texto: hero-sub `46ch`,
  cierre `44ch`, porque `40ch`, faq `40ch`, servicios cab `60ch`, cita `56ch`,
  footer marca `26ch` — **todas por debajo de 65ch**. Reconciliar: o se ensanchan
  a 65–75ch, o se acota la regla (p. ej. 45–75ch) por decisión de diseño. Los
  `12ch`/`18ch` de `h1`/`cierre h2` son display → exentos.

---

## 8. Referencias visuales

Tres referencias, cada una aporta algo concreto y **rastreable en el CSS actual**
(Stripe y Apple ya constan como inspiración en el historial git, commit `6d42c61`
«lenguaje Stripe/Apple»):

**Relats — [relats.com](https://relats.com)** · *Qué tomamos:* el encuadre B2B
industrial y el **lenguaje claro y modular sobre base blanca**: fondo claro con
texto oscuro, mucho aire, rejillas de tarjetas (`auto-fit/minmax`) y
**fotografía técnica de producto/obra** como contenido, no como decoración.
Rastreable en: secciones blancas (`--brand-bg`), `.tarjetas/.serv-grid/.rec-grid`
y las fotos de servicios/hero. De Relats tomamos la **contención cromática** (un
solo acento) — nosotros lo llevamos a un naranja más saturado.

**Stripe** · *Qué tomamos:* el **acabado de producto**: gradiente *aurora*
animado en el hero, **nav de vidrio esmerilado** (`backdrop-filter:blur`),
bandas full-bleed oscuras y **sombras estratificadas**. Rastreable en:
`.hero::before` (`@keyframes aurora`), `.sticky-nav` (blur+saturate),
`.tarjeta:hover`/`.rec:hover` (doble sombra).

**Apple** · *Qué tomamos:* la **tipografía display sobredimensionada** y la
**restricción editorial**: titulares enormes (`clamp` hasta `6.2rem`/`9rem` en
Space Grotesk), ritmo de espaciado amplio y paleta casi acromática con un único
acento. Rastreable en: `.hero h1`, `.relato .linea`, el uso de `--font-display`
y el `padding` vertical generoso de las secciones.

*Delimitación (para no confundir la referencia con una regla):* las referencias
explican **intención**; lo comprobable son los rasgos del CSS citados en cada
una, no un parecido subjetivo con esos sitios.
