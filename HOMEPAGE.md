# Home oficial de Obraxen

Decisión del usuario del 11 de septiembre de 2026 en «Iterar homepage», ratificada
en «Optimizar la Home Page»: trabajar exclusivamente sobre esta Home y retirar
las otras versiones y prototipos.

- Vista local: <http://127.0.0.1:4387/>.
- Fuente: `/Users/danielgarcia/.codex/visualizations/2026/09/10/01a08c7f-30fb-7d60-bdc9-91197bde2666/home-refined.html`.
- SHA-256 aprobado: `d6aa44ba659cbee61d25d3f2660ae393ee9ca660afa9154b846676fc36f89623`.
- Documentación de diseño y producto: `DESIGN.md` y `PRODUCT.md` en esa misma carpeta.

Para abrir la Home, comprobar primero el puerto 4387. Si está apagado:

```sh
node /Users/danielgarcia/.codex/visualizations/2026/09/10/01a08c7f-30fb-7d60-bdc9-91197bde2666/preview-server.mjs
```

El servidor utiliza imágenes y logo de
`.vercel/candidates/architecture-gallery-contact-20260910/`. Esa carpeta también
contiene trabajo de las páginas de secciones. Conservarla mientras existan estas
dependencias. No sustituir la Home aprobada por la portada de `npm run dev`.

## Retirada y trabajo pendiente

Se eliminaron los prototipos `home-character.html` y
`.impeccable/baselines/home-refined-before.html` de la carpeta de la Home.
Las capturas y críticas antiguas quedan como evidencia histórica, no como
versiones editables ni referencias vigentes.

La implementación Next.js anterior aún existe y requiere sustitución e
integración coordinada con las páginas de secciones antes de retirar sus fuentes.
Los worktrees no son íntegramente prototipos desechables: contienen activos,
otras páginas y cambios ajenos. La limpieza completa de esas implementaciones
queda pendiente de resolver estas dependencias; no se ha borrado ese trabajo.

Esta decisión no publica la web ni activa formulario, analítica o indexación.

## Estado de la iteración 2026-09-12

La fuente HTML de referencia mantiene los cinco proyectos documentados en el
carrusel, muestra dos casos completos en escritorio y tablet y ofrece el enlace
«Ver los 5 proyectos». La consulta valida los campos y prepara un borrador de
correo `mailto:`; el visitante debe confirmar el envío en su aplicación de
correo y no se guardan datos en la página. Las Noticias de trabajo se retiran de
la Home hasta su aprobación editorial. El footer expone la identidad legal
básica disponible y referencias separadas para aviso legal, privacidad y
cookies, con la revisión profesional todavía señalada como pendiente.
