# Handoff: contratos JSON Schema ejecutables

- thread_id: codex-test-json-schema-contracts-20260722
- fecha: 2026-07-22 16:14 Europe/Madrid
- estado: candidata_local_verificada
- base: `3fe4b295471d2460176b8c09e25018f9bd325963`
- rama: `codex/test-json-schema-contracts-20260722`

## Resultado

- Ajv `8.20.0` queda fijado como dependencia de desarrollo para ejecutar los
  contratos Draft 2020-12 de proyectos y ofertas.
- `tests/schema-contracts.test.ts` valida los datos actuales con JSON Schema y
  Zod, y exige que ambos rechacen corrupciones estructurales representativas.
- La prueba documenta la frontera intencional: JSON Schema es el contrato
  estructural portable y Zod sigue siendo canonico para invariantes semanticas,
  como enlazar una revision legal con un documento del mismo expediente.
- Los archivos `data/*.schema.json` y `data/*.json` no se modifican.
- `COORDINATION.md` queda reconciliado hasta la PR `#34`.

## Dependencias y seguridad

- La version estable publicada consultada para Ajv fue `8.20.0` y se instalo de
  forma exacta con npm `11.16.0`.
- `npm audit` informa las mismas dos vulnerabilidades altas en base y candidata:
  `next` y su dependencia `sharp`; Ajv no incorpora vulnerabilidades nuevas.
- No se ejecuto `npm audit fix --force`: la propuesta observada implica cambiar
  Next a otra rama mayor y queda fuera de este alcance.

## Gobernanza

- `package.json`, `package-lock.json` y `COORDINATION.md` son rutas protegidas;
  esta entrega es manual y procede de la decision humana
  `user-approved-audit-remediation-order-20260722`.
- Commit, push y PR borrador se limitan a una autorizacion agrupada exacta;
  merge, despliegue, publicacion, borrado y cambios de Vercel quedan fuera.

## Verificacion local

- Runtime gobernado: Node `24.18.0`, npm `11.16.0`, fingerprint
  `ee1386cdbc155e2c6cc621fd8c4b2131aa639516b9dd68fc3a6c08470ce6f647`.
- `git diff --check`, ESLint y TypeScript: correctos.
- Prueba focalizada: 4 contratos correctos.
- Activacion base/candidata: salida identica, SHA-256
  `6e1f82b3ce68ddc43a5bf4e73ab25e06deea59d0e512d4bca62d9436e0130d63`,
  `NO-GO`, 24 bloqueos y publicacion no autorizada.
- `npm run check:quality`: correcto; 276 unitarias, build de 52 paginas, 2 E2E
  de contacto, 89 E2E estandar correctas, 8 omisiones previstas y smoke WebKit.
- Lighthouse: `/en/`, `/de/projekte/` y `/fr/projets/blitz-bremen/` dentro de
  presupuesto.

## Pendiente

- Crear commit, subir la rama y abrir PR borrador bajo la autorizacion agrupada.
- Esperar el `Quality gate` remoto del SHA exacto antes de solicitar fusion.
- No desplegar, publicar ni cambiar Vercel.
