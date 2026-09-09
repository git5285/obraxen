---
name: Obraxen
description: Sistema industrial claro basado en fotografía y evidencia real.
colors:
  primary: "oklch(64.607% 0.1943 41.116)"
  primary-dark: "oklch(55.343% 0.174 38.402)"
  primary-light: "oklch(75.764% 0.159 55.934)"
  ink: "oklch(20.924% 0.006 271.116)"
  background: "oklch(100% 0 0)"
  muted: "#595d60"
  concrete: "#f2f4f3"
  line: "oklch(93.8% 0.01 252.813)"
typography:
  display:
    fontFamily: "'Avenir Next', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  label:
    fontFamily: "-apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
rounded:
  sm: "3px"
  md: "6px"
  lg: "8px"
components:
  button-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.background}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  project-card:
    rounded: "{rounded.md}"
    padding: "24px"
  navigation-link:
    textColor: "{colors.ink}"
    padding: "12px 10px"
  language-current:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: "10px 8px"
---

# Sistema de diseño: Obraxen

## Overview

Extraído del código el 9 de septiembre de 2026, sin nueva auditoría visual.
Este documento describe el sistema existente; no convierte aspiraciones en reglas.
El frontmatter es la representación para Impeccable; los valores canónicos
viven en [`css/tokens.css`](css/tokens.css) y los estilos se separan por ruta.

### Fuentes de verdad

| Alcance | Archivo |
|---|---|
| Color, tipografía, radios, ancho, capas y motion | `css/tokens.css` |
| Portada | `css/home.css` |
| Hub de proyectos | `css/projects.css` |
| Casos | `css/case.css` |
| Legales | `css/legal.css` |
| Consentimiento | `css/consent.css` |

El wordmark v14 está integrado en `src/components/logo-mark.tsx`; esta evidencia
de implementación no es un dictamen marcario ni legal.
Recolorear o cambiar las familias tipográficas debe empezar en los
tokens, no con sustituciones dispersas.
Los activos SVG pueden llevar colores propios; un `data:` URI no puede leer
custom properties. Revisar los activos junto con los tokens si cambia la marca.

### Dirección visual

- Industrial, clara y basada en evidencia real.
- Fondo mayoritariamente blanco, texto oscuro y un único acento naranja.
- Fotografía de obra como prueba, no como decoración ni material generado.
- Tipografía display grande para jerarquía y tipografía de sistema para cuerpo y UI.
- Rejillas y bandas editoriales antes que tarjetas genéricas de producto SaaS.
- Sin estética oscura/neón, lujo editorial importado ni animación ornamental.

Relats aporta la contención industrial; Stripe, el acabado de interacción y las
superficies estratificadas; Apple, la jerarquía tipográfica y el espacio. Son
referencias de intención, no requisitos de parecido.

## Colors

Un acento naranja, tinta oscura, blanco y superficies de hormigón claro. Las
claves del frontmatter corresponden a los roles de `css/tokens.css`; no constituyen
una segunda paleta. `primary-dark` sirve a texto y CTA; `muted` a texto secundario;
`concrete` separa bandas y `line` estructura bordes.

- Los colores de interfaz proceden de variables `--brand-*`.
- Las transparencias usan color relativo, por ejemplo
  `rgb(from var(--brand-ink) r g b / .5)`; no introducen una paleta paralela.
- `--brand-primary` no se usa como texto pequeño sobre blanco: su contraste es
  insuficiente para cuerpo. Para texto se utiliza `--brand-primary-dark`.

## Typography

- `--font-display`: encabezados, logotipo y piezas editoriales destacadas.
- `--font-sans`: cuerpo, navegación, controles y metadatos.
- No se cargan fuentes externas. Una fuente de marca solo se incorporará cuando
  la identidad esté aprobada y pueda autoalojarse.
- Los titulares pueden usar `clamp()` para conservar la jerarquía entre móvil y
  escritorio; los tamaños pertenecen a cada composición, no a una escala de
  tokens sin consumidores.

La portada usa h1 de 3.5rem, 2.75rem hasta 860 px, 2.125rem hasta 620 px y
1.875rem hasta 360 px, con interlínea 1.06. El cuerpo compartido usa el rol
`body`; legales eleva su interlínea a 1.65. Los tamaños de h2 varían por sección.
El logotipo visible de Obraxen es SVG; el token display no redefine sus letras.

## Layout

- Ancho máximo compartido: `--maxw: 1248px`; cada composición controla su
  canalón según la ruta y el breakpoint.
- Portada: canalones de 48 px, 24 px hasta 860 y 20 px hasta 620; h1 se ajusta
  también a 360 px. Entre 861 y 1200 px se oculta el selector de idioma de la
  cabecera; los enlaces de idioma siguen disponibles en el pie. Con ancho hasta
  620 px y altura hasta 740 px se compactan fotografía y resumen del hero.
- El hub usa 860 px y un ajuste de mosaico en 520 px.
- Los casos cambian en 760 px y los legales en 620 px.
- Legales y contacto usan un contenedor de 860 px; `css/legal.css` incluye además
  una regla de selector de idioma a 900 px. Consentimiento cambia a 767 y 720 px.
- Un breakpoint nuevo necesita una necesidad de composición verificable; no se
  añade para corregir un único texto o dispositivo.
- No se admite overflow horizontal desde 320 px ni en escritorio. Los titulares
  multilingües usan reflow seguro y se prueban a 320, 360, 375 y 390 px.

## Elevation & Depth

Las bandas y bordes organizan la portada sin sombras en tarjetas. Las cabeceras
de proyectos y casos usan fondo translúcido y `backdrop-filter: blur(16px)`.
Consentimiento sí usa sombras, registradas en `.impeccable/design.json`.
Las capas altas usan `--z-content`, `--z-sticky`, `--z-modal` y `--z-skip-link`;
la imagen del hero usa `z-index: 0` dentro de su contexto aislado. No afirmar que
todo valor literal está ausente.

### Motion

- Las transiciones usan `--ease-standard` y las duraciones `--dur-*` cuando son
  interacciones de interfaz.
- No se usa bounce, overshoot ni movimiento que desplace contenido de forma
  imprevisible.
- `prefers-reduced-motion` desactiva el movimiento no esencial en portada, hub y
  casos.
- Animar `transform` y `opacity` es preferible a propiedades que recalculan layout.

## Shapes

Radios pequeños en botones e inputs, medios en formularios y tarjetas de
proyectos. Las filas de servicios y pasos usan bordes rectos. La insignia de
estado legal conserva su radio específico de 999 px; el nombre del token
`--radius-pill` no implica que todos los controles sean cápsulas.

## Components

- **CTA principal:** `CtaLink` y `.btn-acento`, altura mínima 48 px, fondo
  `primary-dark`, texto blanco, flecha y hover tinta. Foco visible heredado.
- **Navegación:** `SiteNavigation`, enlaces de cabecera y barra sticky; enlace
  activo subrayado. Menú móvil oscuro, cierre accesible y scroll interno para
  alturas cortas. Wordmark v14 compartido mediante `LogoMark`.
- **Selector de idioma:** `LanguageSwitcher`, idioma actual con fondo naranja
  oscuro y `aria-current`; conserva el equivalente localizado.
- **Servicios y proceso:** filas de fotografía y explicación; pasos numerados
  con separadores. A 620 px pasan a una columna.
- **Proyectos:** `ProjectCard`, fotografías agrupadas, cuerpo, metadatos y enlace;
  renderizado sujeto a evidencia. El hub usa expedientes editoriales propios,
  no una copia de la tarjeta de portada.
- **Campos de contacto:** `ContactForm`, borde muted, radio pequeño, padding de
  12 px, etiquetas explícitas, consentimiento, estados de envío y mensaje de
  resultado. `ContactUnavailable` conserva el estado cerrado y canales reales.
- **FAQ:** `details` y `summary` nativos con indicadores +/− y bordes separadores.
- **Consentimiento:** `ConsentManager`, banner y controles de preferencias con
  foco y sombras propios en `css/consent.css`; no sustituirlos por el CTA principal.

Las secciones de portada se generan en servidor. Navegación y consentimiento son
interacciones cliente; el formulario también lo es cuando su puerta permite
renderizarlo. FAQ usa comportamiento HTML nativo.

## Do's and Don'ts

### Accesibilidad

- Texto normal: contraste mínimo 4.5:1; texto grande: 3:1.
- Foco visible y orden de teclado coherente en todos los enlaces y controles.
- El nombre accesible debe incluir el texto visible. El hub ya cumple WCAG 2.5.3
  en los 12 enlaces previamente afectados.
- Las fotografías significativas conservan `alt`; los iconos decorativos usan
  `aria-hidden="true"`.
- Los componentes deben seguir funcionando con zoom y texto ampliado, sin
  depender únicamente del color.

### Verificación rápida

```sh
# Breakpoints reales
rg -n '@media' css

# Revisar capas; el hero conserva un 0 local intencionado
rg -n 'z-index\s*:\s*[0-9]' css src

# Familias tipográficas en uso
rg -n 'font-family\s*:' css

# Reducción de movimiento
rg -n 'prefers-reduced-motion' css src

# Build, estructura, enlaces y activos
npm run check
```

La comprobación visual se realiza como mínimo a 320, 360, 375, 390 y 1.440 px,
con teclado, consola y red abiertas. Los objetivos medidos y el historial de
rendimiento viven en [`TECHNICAL_AUDIT.md`](TECHNICAL_AUDIT.md), no se duplican
aquí.

### Implementación Next.js

Next.js es la única implementación. `src/app/globals.css` importa las hojas
canónicas de `css/`, con interacciones cliente descritas arriba.
No existe una plantilla estática ni un generador heredado
con el que mantener paridad.

Playwright verifica el reflow de titulares multilingües a 320, 360, 375 y 390 px,
además de la matriz de rutas a 390 y 1.440 px. Los CSS Modules solo se introducirán
cuando aporten aislamiento real a una composición; no se duplican estilos para
cumplir una preferencia de estructura.
