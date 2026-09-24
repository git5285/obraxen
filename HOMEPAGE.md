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

El verificador exige cero errores de navegador. Comprueba foco al abrir/cerrar
el menú y al cambiar entre móvil y escritorio, navegación sin JavaScript y
conservación del texto de consulta al borrar su contexto. También sirve una
variante editorial en memoria para comprobar que un cambio de texto no rompe
el contrato de navegación ni las traducciones con clave estable.

La incidencia de foco de la recuperación está corregida en la fuente local.
Los hashes originales siguen siendo evidencia histórica, no una excepción
para admitir errores. `--compare-production` conserva su exigencia de igualdad
exacta y detectará las diferencias deliberadas mientras producción no cambie.

## Mantener traducciones

Las claves `data-i18n` de navegación y titular se resuelven con `message(key)`
en `home-i18n.js`; pueden cambiarse sus textos españoles sin perder EN/DE.
La clave del titular traduce solo su nodo de texto directo y conserva el `span`.
El catálogo conserva las coincidencias de texto para las zonas aún no migradas.
Al editar esas zonas, actualizar las traducciones o introducir una clave estable.
`missingTranslations` enumera texto inicial y mensajes dinámicos sin traducción;
`test:published` falla si la lista no está vacía. Los nombres propios e
identificadores invariables se enumeran explícitamente, no mediante una exclusión
genérica de textos desconocidos. `npm run test:home` comprueba el traductor,
las claves del HTML y los rangos de carruseles.

La cobertura porcentual de `test:coverage` corresponde a bibliotecas del legado,
no al HTML o JavaScript de esta Home. Para esta aplicación, la evidencia de
comportamiento procede de `test:home` y `test:published`.

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
