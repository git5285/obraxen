# Sistema de diseño

Estado verificado: 15 de julio de 2026. Este documento describe el sistema que
existe hoy; no convierte aspiraciones antiguas en reglas. Los valores canónicos
viven en [`css/tokens.css`](css/tokens.css) y los estilos se separan por ruta.

## Fuentes de verdad

| Alcance | Archivo |
|---|---|
| Color, tipografía, radios, ancho, capas y motion | `css/tokens.css` |
| Portada | `css/home.css` |
| Hub de proyectos | `css/projects.css` |
| Casos | `css/case.css` |
| Legales | `css/legal.css` |

La identidad visual definitiva sigue pendiente. Recolorear o cambiar las
familias tipográficas debe empezar en los tokens, no con sustituciones dispersas.
El naranja codificado dentro del favicon SVG es la única excepción conocida:
un `data:` URI no puede leer custom properties.

## Dirección visual

- Industrial, clara y basada en evidencia real.
- Fondo mayoritariamente blanco, texto oscuro y un único acento naranja.
- Fotografía de obra como prueba, no como decoración ni material generado.
- Tipografía display grande para jerarquía y tipografía de sistema para cuerpo y UI.
- Rejillas y bandas editoriales antes que tarjetas genéricas de producto SaaS.
- Sin estética oscura/neón, lujo editorial importado ni animación ornamental.

Relats aporta la contención industrial; Stripe, el acabado de interacción y las
superficies estratificadas; Apple, la jerarquía tipográfica y el espacio. Son
referencias de intención, no requisitos de parecido.

## Reglas vigentes

### Tokens y color

- Los colores de interfaz proceden de variables `--brand-*`.
- Las transparencias usan color relativo, por ejemplo
  `rgb(from var(--brand-ink) r g b / .5)`; no introducen una paleta paralela.
- `--brand-primary` no se usa como texto pequeño sobre blanco: su contraste es
  insuficiente para cuerpo. Para texto se utiliza `--brand-primary-dark`.
- No existen valores numéricos literales de `z-index`; las capas usan la escala
  semántica `--z-*`.

### Tipografía

- `--font-display`: encabezados, logotipo y piezas editoriales destacadas.
- `--font-sans`: cuerpo, navegación, controles y metadatos.
- No se cargan fuentes externas. Una fuente de marca solo se incorporará cuando
  la identidad esté aprobada y pueda autoalojarse.
- Los titulares pueden usar `clamp()` para conservar la jerarquía entre móvil y
  escritorio; los tamaños pertenecen a cada composición, no a una escala de
  tokens sin consumidores.

### Layout y responsive

- Ancho máximo compartido: `--maxw: 1180px`; cada composición controla su
  canalón según la ruta y el breakpoint.
- La portada cambia en 860 px.
- El hub usa 860 px y un ajuste de mosaico en 520 px.
- Los casos cambian en 760 px y los legales en 620 px.
- Un breakpoint nuevo necesita una necesidad de composición verificable; no se
  añade para corregir un único texto o dispositivo.
- No se admite overflow horizontal desde 320 px ni en escritorio. Los titulares
  multilingües usan reflow seguro y se prueban a 320, 360, 375 y 390 px.

### Motion

- Las transiciones usan `--ease-standard` y las duraciones `--dur-*` cuando son
  interacciones de interfaz.
- No se usa bounce, overshoot ni movimiento que desplace contenido de forma
  imprevisible.
- `prefers-reduced-motion` desactiva el movimiento no esencial en portada, hub y
  casos.
- Animar `transform` y `opacity` es preferible a propiedades que recalculan layout.

### Accesibilidad

- Texto normal: contraste mínimo 4.5:1; texto grande: 3:1.
- Foco visible y orden de teclado coherente en todos los enlaces y controles.
- El nombre accesible debe incluir el texto visible. El hub ya cumple WCAG 2.5.3
  en los 12 enlaces previamente afectados.
- Las fotografías significativas conservan `alt`; los iconos decorativos usan
  `aria-hidden="true"`.
- Los componentes deben seguir funcionando con zoom y texto ampliado, sin
  depender únicamente del color.

## Verificación rápida

```sh
# Breakpoints reales
rg -n '@media' css

# Ningún z-index numérico
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

## Implementación Next.js

Next.js es la única implementación. `src/app/globals.css` importa las hojas
canónicas de `css/`, la portada se divide en Server Components y la navegación es
su única isla cliente. No existe una plantilla estática ni un generador heredado
con el que mantener paridad.

Playwright verifica el reflow de titulares multilingües a 320, 360, 375 y 390 px,
además de la matriz de rutas a 390 y 1.440 px. Los CSS Modules solo se introducirán
cuando aporten aislamiento real a una composición; no se duplican estilos para
cumplir una preferencia de estructura.
