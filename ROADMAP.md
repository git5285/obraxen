# Roadmap para una web ejemplar

Fecha de referencia: 14 de julio de 2026.

Este plan parte de la web existente y de su evidencia real. La migracion no debe
recrear el proyecto desde cero ni convertirlo en una plantilla generica: debe
conservar contenido, datos, rutas, direccion industrial, controles de
publicacion y rendimiento, y mejorar la mantenibilidad, la calidad de entrega y
la medicion.

## Stack objetivo

- **Web:** Next.js con App Router, TypeScript y React Server Components por
  defecto.
- **Repositorio:** GitHub privado, ramas de trabajo y pull requests con checks
  obligatorios antes de integrar en `main`.
- **Hosting:** Vercel, previews protegidas por pull request y produccion cerrada
  hasta superar la puerta de publicacion.
- **Analitica:** Google Analytics 4 y Microsoft Clarity solo tras consentimiento
  valido; Google Search Console mediante verificacion de dominio y sitemap.
- **Desarrollo asistido:** Codex, sujeto a `AGENTS.md`, claims por archivo,
  verificacion automatizada y handoff.

## Principios no negociables

1. La evidencia real prevalece sobre cualquier afirmacion comercial.
2. Naming, sociedad, dominio, contacto y datos legales no se inventan ni se
   fuerzan para completar una pantalla.
3. La ausencia de datos se representa como `null`, `sin dato` o contenido
   omitido; nunca se rellena con una promesa aproximada.
4. No se publica desde `main` por accidente. Preview y produccion son entornos
   distintos, con proteccion y variables separadas.
5. Cada ruta debe funcionar sin JavaScript cliente salvo la interaccion que lo
   necesite. El sitio es contenido tecnico, no una aplicacion pesada.
6. La migracion se hace ruta a ruta y se compara contra la linea base actual.

## Arquitectura propuesta

```text
src/
  app/
    layout.tsx
    page.tsx
    proyectos/page.tsx
    proyectos/[slug]/page.tsx
    soluciones/page.tsx
    aviso-legal/page.tsx
    privacidad/page.tsx
    robots.ts
    sitemap.ts
    opengraph-image.tsx
  components/
    layout/
    projects/
    solutions/
    consent/
  lib/
    brand.ts
    projects.ts
    offers.ts
    publication.ts
    analytics.ts
  styles/
    tokens.css
    globals.css
data/
  brand.json
  proyectos.json
  ofertas.json
public/
  img/
```

- Las paginas se prerenderizan en build. No se necesita SSR para contenido que
  cambia mediante commits.
- `data/brand.json` sigue siendo la puerta de identidad y publicacion.
- Los proyectos conservan una unica fuente de datos y generan tanto el hub como
  las rutas dinamicas mediante `generateStaticParams`.
- Las imagenes pasan por `next/image`, con tamaños responsivos y dimensiones
  explicitas. Los masters permanecen fuera de `public/`.
- Metadatos, canonical, Open Graph, `robots.ts` y `sitemap.ts` se derivan del
  estado de publicacion y del dominio real.
- El CSS actual se migra primero a tokens globales y CSS Modules. Componentes
  externos solo se incorporan cuando resuelven una necesidad concreta; el panel
  de consentimiento es un buen candidato, la maquetacion editorial no.

## Flujo GitHub y Vercel

1. Crear una rama por hito y abrir pull request.
2. Ejecutar en GitHub Actions: instalacion reproducible, lint, TypeScript,
   validacion de datos, tests, build y smoke test de rutas.
3. Vercel crea una preview protegida por pull request.
4. Revisar visualmente escritorio y movil, teclado, consola y red.
5. Integrar en `main` solo con checks verdes.
6. Mantener produccion desactivada o protegida hasta que naming, dominio,
   contacto, legal y consentimiento esten aprobados.

No se necesita un workflow de despliegue personalizado al principio: la
integracion oficial GitHub-Vercel ya aporta previews por push y pull request. Si
mas adelante se requiere una aprobacion manual adicional, se incorpora entonces.

## Analitica y privacidad

### Google Search Console

- Activar cuando exista dominio definitivo.
- Preferir una propiedad de dominio verificada por DNS TXT.
- Publicar `sitemap.xml`, comprobarlo con inspeccion de URL y enviarlo desde el
  informe de Sitemaps.
- No depende de cookies ni debe esperar al banner de consentimiento.

### Google Analytics 4

- Usar un ID `G-...` por entorno; produccion y previews no comparten datos.
- Implementar consentimiento basico: la etiqueta no se carga antes de que el
  usuario acepte analitica.
- Configurar Consent Mode v2 con analitica y publicidad denegadas por defecto;
  no activar funciones publicitarias en la primera version.
- No enviar nombres, emails, telefonos, textos de formularios ni identificadores
  de cliente como parametros de evento.

### Microsoft Clarity

- Usar un proyecto separado para produccion.
- Cargar Clarity solo tras aceptar analitica y comunicar cambios mediante la API
  ConsentV2.
- Mantener enmascarados formularios, datos de contacto y cualquier contenido que
  pueda identificar a una persona.

### Eventos iniciales

- `cta_select` con ubicacion y destino.
- `project_open` con slug publico.
- `solution_open` con slug publico.
- `contact_channel_select` con canal, nunca con el dato de contacto.
- `form_start`, `form_error` y `form_submit` sin contenido de campos.
- `consent_update` con categorias, sin identificadores personales.

## Backlog priorizado

La puntuacion usa `(impacto + riesgo) x (6 - esfuerzo)`, con valores de 1 a 5.

| Trabajo | Impacto | Riesgo | Esfuerzo | Puntuacion | Estado |
|---|---:|---:|---:|---:|---|
| Mantener cerrada la puerta de publicacion | 5 | 5 | 1 | 50 | Protegido; conservar |
| Corregir nombres accesibles del hub | 4 | 4 | 1 | 40 | Completado |
| Consentimiento antes de GA4 y Clarity | 5 | 5 | 3 | 30 | Fase 5, antes de scripts |
| Retirar JPEG y asset huerfano | 4 | 3 | 1 | 35 | Completado |
| Imagenes responsivas y cache versionada | 3 | 2 | 3 | 15 | Fases 1–3 |
| Externalizar CSS/JS y endurecer CSP | 3 | 3 | 4 | 12 | CSS completado; JS en Fase 2 |
| Tipado, tests y CI | 5 | 4 | 5 | 9 | Fases 1 y 4 |

La puntuacion no convierte una migracion grande en urgente por si sola: el sitio
actual ya rinde bien. Sirve para resolver primero los riesgos de publicacion,
accesibilidad y privacidad, y despues mejorar la arquitectura sin una reescritura
precipitada.

## Fases de ejecucion

### Fase 0 — Cerrar la base actual

- [x] Resolver el solape de la iteracion de evidencia y conservar su commit.
- [x] Corregir los nombres accesibles del hub de proyectos.
- [x] Mantener los JPEG masters fuera del repositorio y solo WebP publicables dentro.
- [x] Separar el CSS y el comportamiento cliente de la plantilla monolitica de
  portada sin cambiar su salida funcional.
- [x] Congelar mediciones Lighthouse de referencia para las rutas principales.
- [x] Consolidar la documentacion, corregir referencias obsoletas y definir una
  fuente de verdad por tema.

### Fase 1 — Fundacion Next.js

- Crear App Router con TypeScript, ESLint, lockfile y version de Node fijada.
- Migrar tokens, layout, fuentes y cabeceras sin alterar el aspecto.
- Implementar las puertas `preview`/`publicar` antes de migrar contenido.
- Añadir tests de datos y rutas desde el primer commit.

### Fase 2 — Portada y sistema de componentes

- Dividir la portada monolitica en secciones servidoras.
- Mantener el menu movil como una isla cliente pequena.
- Sustituir CSS y JavaScript embebidos para poder retirar `unsafe-inline` de CSP.
- Verificar equivalencia visual y rendimiento antes de retirar la plantilla vieja.

### Fase 3 — Evidencia y soluciones

- Migrar `/proyectos/` y `/proyectos/[slug]` desde los JSON actuales.
- Incorporar `/soluciones/` solo para ofertas que superen sus condiciones de
  salida; no publicar borradores internos por el hecho de existir.
- Añadir metadatos y Open Graph por ruta.

### Fase 4 — Calidad de entrega

- GitHub Actions, previews de Vercel y checks obligatorios.
- Tests unitarios de reglas de publicacion y tests de navegador de rutas,
  navegacion, foco, responsive y errores de consola.
- Presupuestos de rendimiento y auditoria Lighthouse automatizada.

### Fase 5 — Analitica, SEO y consentimiento

- Implementar el panel de consentimiento y sus pruebas antes de GA4 o Clarity.
- Configurar IDs por entorno y comprobar que una negativa genera cero requests
  de analitica.
- Con dominio definitivo, activar canonical, sitemap, Search Console y datos
  estructurados finales.

### Fase 6 — Publicacion controlada

- Completar identidad, sociedad, contacto y textos legales.
- Revision profesional de privacidad y cookies.
- Auditoria final sobre la URL de produccion, aprobacion explicita y activacion
  manual de despliegue.

## Puerta de calidad

- Lighthouse movil por ruta: rendimiento >= 95, accesibilidad 100 y buenas
  practicas 100. SEO 100 solo cuando la publicacion sea real.
- LCP < 2,5 s, INP < 200 ms y CLS < 0,1 en datos de campo.
- Cero hallazgos serios o criticos de axe y cero errores de consola/red.
- Ninguna ruta publica contiene `PENDIENTE`, datos ficticios o afirmaciones no
  respaldadas.
- Todas las imagenes tienen dimensiones, `sizes` y formato moderno; el primer
  viewport no descarga imagenes ajenas a su contenido.
- Rechazar analitica impide cargar GA4 y Clarity; cambiar preferencias aplica el
  nuevo estado sin recargar datos personales.
- `main` solo integra cambios con build, tests y validacion de datos correctos.

## Siguiente hito recomendado

Cerrar primero la iteracion concurrente de evidencia. Despues, en una rama y una
reserva nuevas, ejecutar **Fase 1 — Fundacion Next.js** manteniendo la web actual
como referencia hasta que portada, proyectos y legales tengan paridad funcional
y visual.

## Referencias oficiales de implementacion

- [Next.js App Router](https://nextjs.org/docs/app)
- [Estructura de proyecto Next.js](https://nextjs.org/docs/app/getting-started/project-structure)
- [Integracion de terceros en Next.js](https://nextjs.org/docs/app/guides/third-party-libraries)
- [Metadata, robots y sitemap en Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- [Vercel para repositorios GitHub](https://vercel.com/docs/git/vercel-for-github)
- [Consent Mode para web](https://developers.google.com/tag-platform/security/guides/consent)
- [Verificacion de Search Console](https://support.google.com/webmasters/answer/9008080?hl=es)
- [Sitemaps en Search Console](https://support.google.com/webmasters/answer/7451001?hl=es)
- [Clarity ConsentV2](https://learn.microsoft.com/en-gb/clarity/setup-and-installation/clarity-consent-api-v2)
- [AEPD: cookies para herramientas de medicion](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf)
