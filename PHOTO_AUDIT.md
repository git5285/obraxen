# Auditoría fotográfica de proyectos

Fecha de actualización: 12 de septiembre de 2026

## Estado actual

La selección web de fotografías de proyectos se retiró del árbol de trabajo como
medida preventiva de privacidad. No quedan copias WebP de proyectos en
`img/proyectos/` ni referencias a ellas en `data/proyectos.json`. Los seis
registros internos conservan únicamente sus datos técnicos y sus arrays de
imágenes están vacíos; ningún caso puede entrar en el catálogo público sin una
nueva autorización explícita y assets revisados.

La retirada afecta a 18 copias WebP que ocupaban 1.702.898 bytes. Las copias
JPEG intermedias ya no formaban parte del árbol actual.

## Alcance de la decisión

- No se conserva en el repositorio ninguna fotografía de obra de los lotes
  revisados.
- Se eliminan también las referencias descriptivas de etapa y texto alternativo
  asociadas a esas copias.
- Los originales, ZIP o archivos fuera de este repositorio no están incluidos
  en esta operación y deben gestionarse en su ubicación de origen.
- Cualquier nueva incorporación exige autorización documental para el caso,
  revisión legal, limpieza de metadatos y registro del asset público aprobado.

## Comprobación

- `data/proyectos.json`: seis registros válidos y cero imágenes por registro y
  por idioma.
- `img/proyectos/`: no contiene assets de proyectos.
- `publicProjectImages`: permanece vacío, por lo que el selector público sigue
  fallando cerrado.
