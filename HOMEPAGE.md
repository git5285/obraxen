# Home oficial de OBRAXEN

La referencia aprobada por el usuario es la web publicada en https://obraxen.com.
Desde el 23 de septiembre de 2026, su fuente recuperada vive dentro del repositorio
en `apps/public-site/`. No usar `src/app/[lang]/page.tsx` como base de esa Home:
pertenece a la implementación anterior, preservada para no perder trabajo ajeno.

## Abrir y construir la Home aprobada

Requiere las dependencias y el runtime fijados por el repositorio.

```sh
npm run dev
# http://127.0.0.1:4387 — Home aprobada, modo desarrollo
npm run build
npm run start
# mismo puerto, build optimizado
npm run test:published
```

No arrancar dos servidores en el mismo puerto. Los scripts aceptan
`-- --port <puerto>`. El servidor escucha por defecto solo en 127.0.0.1.
En desarrollo, el HTML se vuelve a empaquetar al guardarlo; recargar la página
para ver el resultado. No es necesario editar el módulo generado.

## Fuente única y límites

- `apps/public-site/public/index.html`: documento canónico con estructura,
  estilos e interacciones de la Home publicada.
- `apps/public-site/public/assets/`: imágenes, vídeo y `home-i18n.js` originales.
- `apps/public-site/app/route.js`, `app/en/route.js` y `app/de/route.js`:
  las tres rutas originales de Next.js.
- `generate-route-content.mjs`: empaqueta el HTML canónico antes del desarrollo
  o build. `app/generated-home-html.js` es generado e ignorado por Git; no editarlo.
- `docs/published-site-source.json`: despliegue de origen y hashes de las fuentes.

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

La comparación explícita con producción se ejecuta con:

```sh
npm run test:published -- --compare-production
```

Esta variante lee la web pública y compara HTML, assets, contenido renderizado,
geometría y capturas. Los informes y PNG se generan en
`test-results/published-home/`. La comparación exige equivalencia exacta con
la referencia; una mejora deliberada futura deberá revisarse como diferencia.

Incidencia conocida y conservada de producción: al abrir el menú móvil se
produce un error de foco en `setMenu`; no impide mostrar los enlaces. El test
lo identifica por separado y rechaza errores nuevos. Véase la recuperación.

Antes de editar, respetar las claims de `AGENTS.md` y reservar rutas exactas.
Para la Home aprobada, trabajar en `apps/public-site/`; una prueba sobre el
árbol legado no demuestra nada sobre la web publicada.

## Implementación anterior preservada

`src/`, `css/`, `data/`, `img/` y sus cambios existentes se conservan.
Se pueden consultar mediante `npm run dev:legacy`, `build:legacy` y
`start:legacy`. Sus pruebas anteriores continúan separadas. No se mezclan
sus textos, imágenes, APIs o configuración de publicación con la Home recuperada.

La ruta externa histórica `home-refined.html` documentada aquí antes de la
recuperación ya no existe. Vercel conservaba las fuentes subidas del despliegue
`dpl_8GnZiT4XQpcpssqysL4aWshmfB9t`; fueron recuperadas y verificadas por hash.
No se ha identificado un commit Git original asociado a ese despliegue CLI.
Véase [la trazabilidad de recuperación](docs/PUBLISHED_SITE_RECOVERY.md).

Esta integración es local. No autoriza ni ejecuta un nuevo despliegue,
publicación, cambio de dominio o eliminación del trabajo anterior.
