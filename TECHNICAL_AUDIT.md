# Auditoría técnica

Última verificación: 14 de julio de 2026. Stack: Next.js 16.2.10, React 19,
TypeScript 6, Node objetivo 24.x, Vitest, Playwright y Lighthouse 13.4.0.

## Estado

- Implementación única: Next.js App Router.
- Portada, hub, seis casos, aviso legal, privacidad, robots y sitemap
  prerenderizados; no queda builder o plantilla HTML legacy.
- Preview cerrada: `noindex,nofollow`, sitemap vacío, sin dominio y sin
  despliegues Git automáticos.
- Repositorio público con `main` protegido por `Quality gate`; no se detectan
  secretos o credenciales en los archivos versionados.
- La puerta pública falla por identidad, sociedad, contacto, revisión legal y
  autorizaciones documentales de los casos, como está previsto.

## Resultados actuales

| Ruta móvil | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 97 | 100 | 100 | 66 | 2.556 ms | 11 ms | 0 |
| `/proyectos/` | 97 | 100 | 100 | 66 | 2.686 ms | 2 ms | 0 |
| `/proyectos/blitz-bremen/` | 98 | 100 | 100 | 66 | 2.309 ms | 2 ms | 0 |

El SEO 66 es deliberado mientras la preview siga noindex. Los tres perfiles
superan el presupuesto de rendimiento 95, accesibilidad y buenas prácticas 100,
LCP de laboratorio 3 s, TBT 200 ms y CLS 0,1. El objetivo de campo de LCP sigue
siendo inferior a 2,5 s.

## Verificación automatizada

- `npm run check`: ESLint, TypeScript, 41 pruebas Vitest y build de producción.
- Build: 14 páginas generadas; todas las rutas de contenido son estáticas o SSG.
- Playwright: 36 ejecuciones, 33 correctas y 3 omisiones intencionales de pruebas
  exclusivas de móvil en el proyecto de escritorio.
- Diez rutas de contenido verificadas a 390 × 844 y 1.440 × 1.000.
- Cero errores de consola o red, imágenes rotas u overflow horizontal.
- Axe sin hallazgos serios o críticos en portada, hub, un caso y las dos rutas
  legales.
- WCAG 2.5.3 comprobado expresamente con `label-content-name-mismatch`: cero
  violaciones en los seis enlaces de casos de la portada.
- Menú móvil con foco inicial, trampa de foco, cierre con `Escape`, restauración
  del disparador y foco en la sección de destino.
- `/soluciones/` y slugs desconocidos responden 404.
- `robots.txt` bloquea rastreo y `sitemap.xml` no contiene URLs en preview.

## Seguridad y privacidad

- CSP: `style-src 'self'`, `script-src-attr 'none'`, bloqueo de objetos, frames y
  orígenes no declarados. `script-src` mantiene `unsafe-inline` para el bootstrap
  de App Router.
- HSTS de aplicación: `max-age=31536000`; Vercel añade su política de perímetro
  cuando existe una URL servida.
- `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y
  `Permissions-Policy` se prueban en navegador.
- No se cargan fuentes, analítica, publicidad o scripts de terceros.
- La dirección provisional se retiró de `brand.json` y permanece `null` hasta
  disponer de un domicilio empresarial validado.
- Los informes locales y auditorías externas están ignorados.

Los nonces no se adoptan: Next exige render dinámico por petición, desactiva la
optimización estática y aumenta coste y latencia. La alternativa SRI continúa
experimental. La decisión se revisará si el framework estabiliza ese soporte o
si la aplicación llega a manejar datos sensibles en runtime.

## Evidencia y autorización

Las 18 fotografías WebP carecen de metadatos sensibles y usan dimensiones y
`sizes` explícitos. La auditoría técnica de imágenes no constituye una licencia
de publicación.

Cada caso registra ahora:

- estado y alcance declarado;
- fuente y fecha de confirmación;
- referencia documental;
- revisión legal.

Los seis casos están en `confirmada_internamente`, solo con alcance declarado
para identificar al cliente. Falta soporte documental, alcance de fotografías y
revisión legal. `publicar: true` falla cerrado hasta completar o anonimizar todos
los casos.

Las fechas de ejecución cuyo año no estaba confirmado se almacenan como `null`;
ya no hay textos del tipo “año pendiente de confirmar” en los datos públicos.

## Decisión de despliegue

Se mantiene el runtime estándar de Next/Vercel con prerenderizado. No se usa
`output: "export"` porque la exportación pura no admite las cabeceras definidas
en `next.config.ts`. Esto no introduce SSR: las rutas actuales continúan
generándose en build.

`vercel.json` conserva `git.deploymentEnabled: false`. El job remoto de preview
requiere un interruptor explícito y continúa omitido. No se ha realizado ningún
despliegue durante la consolidación. El proyecto remoto se corrigió de preset
`Other` con salida `public` a preset `Next.js` con build y salida autodetectados;
`vercel build` generó correctamente `.vercel/output` y el artefacto local se
eliminó después de verificarlo.

## Deuda y bloqueos

| Elemento | Estado | Siguiente condición |
|---|---|---|
| Consentimiento | No implementado | Fase 5 antes de GA4 o Clarity |
| CSP sin `unsafe-inline` de script | Aplazado | SRI estable o cambio justificado a render dinámico |
| Permisos de clientes y fotografías | Bloqueo público | Documento, alcance y revisión por caso |
| Identidad, sociedad y contacto | Bloqueo público | Datos reales en `brand.json` |
| Aviso legal y privacidad | Borradores | Revisión profesional |
| Dominio, canonical y Search Console | Sin dato | Dominio definitivo |
| Producción | Desactivada | Auditoría final y autorización expresa |

## Comandos de cierre

```sh
npm run check
npm run test:e2e
npm run lighthouse:ci
npm run check:quality
npm audit --audit-level=moderate
git diff --check
```

Las decisiones viven en [`DECISIONS.md`](DECISIONS.md), la secuencia en
[`ROADMAP.md`](ROADMAP.md) y la exposición pública del código en
[`REPOSITORY_EXPOSURE.md`](REPOSITORY_EXPOSURE.md).
