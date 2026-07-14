# Revisión de exposición del repositorio

Fecha: 14 de julio de 2026. Estado: repositorio público por instrucción expresa
del usuario; la web continúa sin autorización de despliegue o publicación.

## Resultado

- No se detectan secretos, tokens, claves privadas, contraseñas, archivos `.env`
  ni credenciales de Vercel o GitHub en los archivos versionados.
- La dirección que figuraba en `data/brand.json` se ha sustituido por `null`: no
  existe todavía una sociedad ni un domicilio empresarial validado para publicar.
- Los informes locales de Lighthouse, Playwright y las auditorías externas quedan
  ignorados para evitar incorporarlos accidentalmente al repositorio público.
- Los seis casos contienen nombres de clientes, ubicaciones, magnitudes y
  fotografías. La confirmación interna para identificar al cliente no equivale a
  soporte documental para publicar nombre y fotografías.
- `STRATEGY.md`, `research/sector-map.csv`, los borradores de datos y el historial
  de `.coordination/` son información operativa visible en GitHub. No contienen
  credenciales, pero sí contexto estratégico y de ejecución.

## Controles adoptados

1. Cada caso registra estado, alcance declarado, fuente, fecha, referencia
   documental y revisión legal de su autorización.
2. La puerta de publicación exige estado `documentada`, alcance para
   `nombre_cliente` y `fotografias_web`, referencia documental y revisión legal
   `aprobada` para todos los casos.
3. Los datos desconocidos se almacenan como `null`; no se publican direcciones ni
   años incompletos.
4. `vercel.json` mantiene los despliegues Git desactivados. La visibilidad del
   código no autoriza la visibilidad de la web.

## Decisión de visibilidad

Se conserva la visibilidad pública porque es el estado expresamente solicitado y
permite aplicar el check obligatorio disponible en la configuración actual. Esta
decisión acepta provisionalmente que el contenido versionado es consultable; no
convierte los casos en material autorizado para una campaña o web pública.

Eliminar archivos en un commit nuevo no los elimina del historial. Si la
estrategia, los casos o la dirección histórica no deben seguir accesibles, la
solución requiere una autorización separada para una de estas operaciones:

- cambiar el repositorio a privado y conservar la protección mediante un plan que
  la admita;
- separar los datos y documentos internos en un repositorio privado;
- reescribir el historial y rotar cualquier dato que se considere comprometido.

No se ejecuta ninguna de esas operaciones destructivas o de visibilidad como
efecto lateral de esta revisión.

## Comprobación repetible

La revisión cubre archivos versionados y patrones de claves API, secretos,
tokens, credenciales, claves privadas, emails, teléfonos y direcciones. Debe
repetirse antes de cada publicación y al incorporar un nuevo proveedor.
