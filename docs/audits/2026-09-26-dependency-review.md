# Revisión de dependencias pendientes — 26 de septiembre de 2026

Base revisada: `470cb2ce4e3b64a74836ce5796a6f8e87741cdfb`.
Candidata: `codex/dependency-review-20260926`.
La revisión no autoriza fusiones ni actualiza servicios remotos.

## Resultado local

Se actualizan juntos `vitest` y `@vitest/coverage-v8` a `5.0.1`, y `zod` a
`4.6.5`. El lockfile se resolvió con Node 24.18.0/npm 11.16.0, sin auditoría
remota ni scripts de instalación. Después se aplicó el parche local revisado
de los dos bundles de Vercel mediante el script del repositorio.

Dependabot agrupa Vitest y sus paquetes relacionados para evitar propuestas
que rompan sus peers exactos. Los tipos de Node permanecen en la línea 24,
con actualizaciones mayores excluidas mientras el runtime siga fijado en 24.

Validación ejecutada: instalación limpia, lint, tipos, 801 tests/43 suites con
cobertura, build de Home y seis vistas ES/EN/DE a 1440/390, todos correctos.
Cobertura: 95.45% statements, 91.42% branches, 95.23% functions, 95.38% lines.
El primer arranque de Chromium falló por la restricción local de puertos Mach;
la repetición autorizada pasó. No se omitió ninguna aserción del navegador.
Se mantiene el aviso conocido de ESLint sobre la ausencia de `pages/`.
La auditoría npm, el gate completo de entrega y el CI de esta nueva candidata
siguen pendientes de autorización de entrega.

## Decisión por propuesta

| PR | Evidencia | Decisión de revisión |
| --- | --- | --- |
| [103](https://github.com/git5285/obraxen/pull/103) | `npm ci` falla porque coverage-v8 5.0.0 exige Vitest 5.0.0, mientras la PR solo cambia Vitest a 5.0.1. | Sustituir por la actualización conjunta validada en esta candidata. |
| [101](https://github.com/git5285/obraxen/pull/101) | Zod 4.6.5; Quality gate verde y validación acumulada local correcta. | Incluida en esta candidata; no integrar dos veces el mismo cambio. |
| [102](https://github.com/git5285/obraxen/pull/102) | Propone `@types/node` 26.6.2 con runtime Node 24.18.0. CI verde no verifica que las APIs añadidas por esos tipos existan en Node 24. | No fusionar este salto de línea; mantener tipos 24. |
| [97](https://github.com/git5285/obraxen/pull/97) | Runtime gate rechaza el árbol: ESLint 10.11.0 incumple peers, incluido eslint-plugin-react 7.37.5 que admite hasta `^9.7`. | No fusionar la propuesta aislada. Requiere actualización compatible del conjunto de plugins. |
| [95](https://github.com/git5285/obraxen/pull/95) | Runtime gate rechaza TypeScript 7.0.2; typescript-eslint 8.64.0 exige `>=4.8.4 <6.1.0`. | No fusionar la propuesta aislada. Requiere actualizar y validar el analizador antes del compilador. |
| [94](https://github.com/git5285/obraxen/pull/94) | Solo cambia upload-artifact en Quality a SHA `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`; CI verde; versión ya utilizada por el workflow generado actual. | Apta para decisión humana de fusión del SHA revisado `b55a221dec5806c3bac1eb0a6c2eeb00359aed46`. |
| [90](https://github.com/git5285/obraxen/pull/90) | Actualiza setup-node en workflows manuales y generado; el manifiesto `gh-aw-manifest` sigue declarando el SHA anterior. | No fusionar el diff actual sin regenerar y verificar el workflow con su compilador. |
| [93](https://github.com/git5285/obraxen/pull/93) | Actualiza checkout; manifiesto generado conserva el SHA anterior y algunos comentarios siguen indicando v5. | No fusionar el diff actual sin regenerar y revisar el manifiesto. |
| [91](https://github.com/git5285/obraxen/pull/91) | Cambia cache/save en el workflow generado pero no su manifiesto. | No fusionar el diff actual sin regeneración coherente. |
| [92](https://github.com/git5285/obraxen/pull/92) | Cambia gh-aw-actions/setup a 0.89.17; metadatos y manifiesto conservan compilador/setup 0.81.6. | No fusionar la actualización aislada del runtime generado. Recompilar con una versión coherente y auditar el resultado. |

Los checks verdes de Quality no ejecutan íntegramente el workflow autónomo;
no prueban su compatibilidad ni justifican ignorar las discrepancias del manifiesto.
Las PR incompatibles permanecen abiertas: no se han cerrado, modificado ni
comentado remotamente. Tampoco se han usado `--force` o `--legacy-peer-deps`.

## Fuentes consultadas

Diffs y checks de las diez PR enlazadas, logs de los jobs
107816574817 (Vitest), 107816521247 (ESLint) y 107816482065 (TypeScript),
cabecera generada del workflow en la base y releases oficiales:
[upload-artifact 7.0.1](https://github.com/actions/upload-artifact/releases/tag/v7.0.1),
[setup-node 7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0),
[checkout 7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1),
[cache 6.1.0](https://github.com/actions/cache/releases/tag/v6.1.0),
[gh-aw-actions 0.89.17](https://github.com/github/gh-aw-actions/releases/tag/v0.89.17).
