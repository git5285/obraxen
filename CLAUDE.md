# Instrucciones para Claude Code

Trabaja en español y comunica primero el resultado. `AGENTS.md`,
`COORDINATION.md` y `.coordination/README.md` son obligatorios y prevalecen
sobre este resumen.

## Antes de editar

1. Lee completos los tres documentos de control anteriores.
2. Revisa `git status --short`, claims activas y handoffs relacionados.
3. Reserva archivos exactos en una claim propia y respeta al único escritor.
4. Preserva cambios ajenos por nombre y checksum.

## Autoridad

- No uses staging global, `--no-verify` ni comandos Git destructivos.
- Confirma antes de commit, push, PR, merge, cambios externos o borrados.
- No despliegues, publiques, actives Vercel, formulario, analítica o indexación
  sin autorización expresa y separada del usuario.
- La mejora autónoma no tiene autoridad de commit, red, PR, merge, despliegue o
  publicación aunque una prueba esté verde.

## Evidencia y cierre

- No inventes identidad, sociedad, legal, contacto, dominio o resultados.
- Mantén datos desconocidos como `null`, `sin dato` u omitidos.
- Ejecuta las pruebas proporcionales y `npm run check:quality` antes de subir.
- Fusiona solo el SHA revisado cuyo `Quality gate` remoto esté verde.
- Actualiza claim y handoff, libera la lease y deja publicación fail-closed.
