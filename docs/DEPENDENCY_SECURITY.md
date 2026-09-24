# Correcciones de dependencias de desarrollo (2026-09-24)

Base: `f7413952dde59f9ad3c6352f159e9ef1ad4da930`. La auditoria completa
inicial notificaba 28 paquetes afectados (1 low, 7 moderate, 19 high,
1 critical), todos a traves de la CLI `vercel@59.16.0`. Son entradas
propagadas por el grafo, no 28 vulnerabilidades independientes de la Home.
Las dependencias de produccion no cambian.

## Correccion temporal y retirada

Se mantiene la version de la CLI. En la consulta del registro, `vercel@60.0.0`
todavia declaraba `undici@5.29.0`, `smol-toml@1.5.2` y `@vercel/fun@1.3.0`;
actualizar solo la CLI no resolvia las causas. No usar `npm audit fix --force`
ni el downgrade sugerido automaticamente por npm.

| Dependencia | Resolucion correctiva | Alcance |
| --- | --- | --- |
| @tootallnate/once 2 | 2.0.1 | descendientes de Vercel |
| tar 7 | 7.5.22 | descendientes de Vercel |
| path-to-regexp 6 / 8 | 6.3.0 / 8.4.2 | conservar la API mayor de cada consumidor |
| smol-toml | 1.9.0 | Vercel y python-analysis |
| minimatch 10 | 10.2.6 | Vercel y python-analysis |
| ajv | referencia `$ajv` (8.20.0) | static-config, sin alterar ajv 6 de ESLint |
| js-yaml | 4.3.2 | python-analysis |
| undici 5 | 6.28.1 | solo resoluciones 5; no degradar undici 7 de sandbox |

El salto de Undici 5 a 6 es deliberado: las alertas incluyen versiones anteriores
a 6.28.0. No se afirma compatibilidad universal; se prueban request, fetch,
Headers y exportaciones de agentes desde los consumidores reales `vercel` y
`@vercel/node`, con red deshabilitada mediante MockAgent. Se prueban tambien
los parsers de rutas v6/v8, AJV, YAML, TOML y matching de Python.

Referencias: [path-to-regexp](https://github.com/advisories/GHSA-j3q9-mxjg-w52f),
[Undici](https://github.com/advisories/GHSA-8xcm-r25x-g524),
[tar](https://github.com/advisories/GHSA-23hp-3jrh-7fpw).

En cada futura actualizacion de Vercel, intentar retirar estos overrides en una
candidata aislada. Retirarlos solo cuando el lockfile resultante pase auditoria
completa, pruebas de compatibilidad y validacion local de Home/legado. No
ampliarlos indiscriminadamente a otras versiones mayores.

## Comprobacion reproducible

Usar Node 24.18.0 / npm 11.16.0. Tras la autorizacion de auditoria pertinente:

```sh
npm_config_registry=https://registry.npmjs.org npm run check:security:all
npm run test -- tests/dev-dependencies.test.ts
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run build:legacy
```

`check:security:all` no sustituye ni rebaja el gate existente de produccion.
Se ofrece como comprobacion explicita adicional; no se cambia CI en esta tarea.
El lockfile debe instalarse sin residuos previos y `npm ls --all` debe ser valido.

La auditoria cubre paquetes declarados, no codigo embebido en bundles. La
revision adicional identifico dos bundles de Vercel 59.16.0 que requieren
correccion fuera del lockfile. No interpretar cero alertas como certificacion
integral: el inventario parcial encontro 274 marcadores de version en 274
archivos JavaScript de `vercel/dist`; no son una SBOM exhaustiva ni 274 fallos.

## Remediacion acotada de los bundles

`scripts/patch-vercel-bundles.mjs` admite exclusivamente Vercel 59.16.0 y
comprueba SHA-256 completos antes y despues de modificar dos archivos:

- `exec-4AISDHUV.js`: se sustituye todo el modulo de extensiones por un error
  explicito, sin ejecutar comandos externos. Esto retira su Undici 5.23.0
  incrustado (multipart Math.random y cadena de descompresion sin limite).
  Los comandos personalizados `vercel-*` quedan deshabilitados; build, deploy,
  inspect y alias ordinarios no usan esta ruta de extensiones. No se afirma
  que existiera una explotacion alcanzable desde la Home.
- `chunk-7RMCBXBB.js`: la implementacion incrustada de path-to-regexp 6.1.0
  delega en la dependencia directa y fijada 6.3.0. El marcador de procedencia
  6.1.0 queda como clave interna del empaquetador, no como implementacion activa.
  Se prueba el wrapper real de routing-utils con `/:a-:b` y la proteccion
  `(?!-)`, conservando coincidencias validas. No se ejecutan cargas DoS.

La instalacion normal (`npm ci`) aplica el parche mediante `postinstall`.
Si se usa `--ignore-scripts`, ejecutar despues `npm run prepare:toolchain`.
Antes de utilizar la CLI: `npm run check:security:embedded`. Tanto el gate
local como el precheck de seguridad utilizado por CI rechazan bundles sin
corregir o desconocidos. La exportacion Home incluye la receta para conservar
ese comportamiento en instalaciones nuevas. Nunca ejecutar la CLI de una
instalacion con scripts omitidos sin preparar y comprobar el toolchain.

El script comprueba todos los archivos antes de escribir; es idempotente,
rechaza symlinks y no descarga, autentica, publica ni cambia configuracion
remota. Sus hashes y offsets requieren nueva revision cuando cambie Vercel.
No editar manualmente esos hashes para que una nueva version pase.

Alcance de la conclusion: los dos hallazgos identificados quedan corregidos
o aislados en este toolchain. No se certifican todos los componentes de
terceros ni se cambia la Home ya publicada. La remediacion debe retirarse
cuando una version upstream verificada elimine ambos hallazgos y pase las
pruebas de compatibilidad y el gate.

## Evidencia local de esta correccion

- `check:security:all`: 0 vulnerabilidades con npmjs, incluyendo desarrollo.
- `npm ci --ignore-scripts --no-audit` en exportacion nueva y `npm ls --all`: exit 0.
- Lint y tipos: exit 0; 69 suites / 1053 tests aprobados con cobertura.
- Builds Home y legado: aprobados. `test:published` local: seis vistas aprobadas.
- Vercel 59.16.0: arranque y build local de exportacion Home aprobados con
  identificadores ficticios locales y sin conectar, registrar ni desplegar.
- Comparacion del lockfile: ninguna entrada de produccion modificada.
- La primera corrida de tests en sandbox fallo por `listen EPERM` en loopback;
  la repeticion con permiso local paso completa. No se cambio ese test.
- Tras ampliar la correccion a bundles: gate completo aprobado, contacto 2/2,
  E2E legado 124 aprobados/17 omitidos y Lighthouse 4 rutas dentro de presupuesto.
  Build local Vercel con ambos bundles corregidos aprobado. El estado de CI
  posterior al push se conserva en la PR, no se presupone aqui.
