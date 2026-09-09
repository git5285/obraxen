# Ciclo Impeccable: arquitectura local

Objetivo: preview privada `http://127.0.0.1:3011/es/architecture-preview/`.
Confirmación humana de shape y transferencia: mensaje «confirmo», 2026-09-09.
No publicar, desplegar, enviar consultas ni alterar la portada vigente.

## Límites confirmados

Hero exacto; cuatro soluciones con cuatro fotos; casos antes de seis sectores;
contacto inmediatamente después; tres campos de demostración sin almacenamiento.
Preservar fotos aportadas, procedencia y datos reales. Precision no se rediseña.
El naranja y las familias existentes siguen siendo la autoridad visual.

## Secuencia y evidencia

1. Critique entregada en chat: 26/32, revisión dual; tres P2 de diferenciación
   fotográfica, continuidad hacia contacto real y cambio de versión por idiomas.
2. Audit entregada: 15/20, evaluación acotada; sin P0/P1 confirmados. Reflow
   320/390/768/1440, foco y demo verificados. Detector: un falso positivo de imagen.
   HTML de desarrollo antes de cambios: 1.314.116 bytes sin comprimir. Fotografías
   documentales: 441.704 bytes binarios; no equivale a Core Web Vitals.
3. Shape confirmada: preservar estructura, mejorar claridad, tipografía, ritmo,
   estados y rendimiento, movimiento funcional reducido; overdrive por elección.
4. Polish: aislamiento `.ar-home`, márgenes técnicos coherentes, pies de foto con
   escala de etiquetas y objetivos de idioma de 44px. Verificado.
5. Bolder: casos como punto de mayor presencia: encabezado hasta2.75rem,
   nombres hasta2rem y relación de columnas1.2:1 en escritorio.
6. Quieter: perímetros de solución más discretos y desplegables secundarios
   con pesos500/600; sin degradar contraste de texto ni foco.
7. Distill: no repetir en los detalles un problema, intervención o resultado
   que ya está completo en el resumen. Se conservan los párrafos ampliados y
   todos los datos documentales. Los valores desconocidos siguen explícitos.
8. Typeset: dos evaluaciones separadas, detector type sin hallazgos antes y
   después. Prosa16px, metadatos14px, interlínea1.6 y tipos fluidos con componente
   rem; hero y familias intactos. Zoom de texto200% probado.
9. Layout: intervalos64px de escritorio y40px de móvil entre secciones;
   grupos internos24/32/48px. OrdenDOM y lectura visual conservados.
10. Colorize: selección con borde y subrayado de marca, aria-current y texto
    de estado; no depende solo de color. Acento claro sobre contacto oscuro.
11. Adapt: fotografías3:2 en móvil, objetivos táctiles48px y cabecera no fija
    en ventanas de poca altura. Matriz320/390/768/1440 y844x390 verificada.
12. Clarify: advertencia de cambio de versión junto a idiomas y explicación
    de que correo/WhatsApp no reciben automáticamente la selección de la demo.
13. Animate: señal lineal de selección240ms y giro del indicador de details;
    reduce-motion conserva la señal estática. Sin entradas de secciones,
    listeners de scroll, bibliotecas nuevas ni cambios de CSP.
14. Delight: retorno del resumen a la solución elegida conservando texto,
    selección y foco. Verificado para las cuatro soluciones y cuatro anchos.
15. Overdrive: el usuario eligió «Cuaderno de obra». Abrir «Ver caso» extiende
    ese caso a todo el ancho de la rejilla; imagen y relato en dos columnas en
    escritorio, lectura apilada en móvil. Cierre por teclado, foco conservado y
    transición breve de240ms con alternativa estática. Sin dependencias nuevas.
16. Harden: límites con mensajes en español, email254/teléfono30 antes de la
    validación semántica, nombre/localidad/país100 y necesidad2000. Ayuda visible
    y asociada al campo; Unicode y fronteras de longitud/archivo verificadas.
    Se mantienen preparación, error, revisión local y recuperación sin envío.
17. Onboard: alternativa contextual para quien no sabe elegir solución y
    enlace real al contacto cuando no hay casos. Sin tour, cuenta ni persistencia.
18. Optimize: fotos documentales fuera del HTML y con carga diferida. Endpoint
    privado restringido a desarrollo, flag local-only, sin VERCEL, host loopback,
    idioma/proyecto/etapa permitidos. Respuesta private/no-store, noindex y CORP
    same-origin. Los cuatro archivos originales se sirven sin alteración.
19. Live: pendiente de autorización para habilitar el selector local frente
    a la CSP de next.config.ts. No se ha iniciado/incrustado el helper ni se ha
    modificado la política de seguridad. No hay alternativas generadas todavía.

## Verificación de fases4–14

- Vitest50/50; se actualizan pruebas de no duplicación y se exige que los datos
  desconocidos sigan visibles en el resumen, no se eliminan esas garantías.
- Playwright16/16 en14.2s: errores, resumen, edición, borrado, hidratación
  retardada, sinJS, selección, retorno, menú, responsive y texto200%.
- TypeScript sin emisión y ESLint de los cuatro archivos TS/TSX tocados: correctos.
- Detector final de home y controls:[]; no avala por sí mismo el juicio visual.
- Inspección visual móvil/escritorio; capturas parciales en
  `/private/tmp/obraxen-impeccable-cycle.4yRhsK`. No equivalen a revisión de
  dispositivos físicos, todos los navegadores ni métricas de producción.
- La skill React mantiene los cambios en los controles cliente existentes;
  el contenido y las fotos siguen compuestos en servidor.

## Pendientes conocidos

Las12imágenes ilustrativas de soluciones no se han sustituido por supuestas
obras reales. Persiste parte de la repetición fotográfica, con procedencia clara.
No se ha ejecutado un build de producción para esta ruta exclusiva de desarrollo.

## Verificación de fases15–18

- Vitest70/70 en cuatro suites: preview, contacto, Precision y medio privado.
- Playwright19/19 en19.3s: incluye Cuaderno de obra a390/1440 con movimiento
  normal/reducido y prueba de que las fotos iniciales ocultas no se solicitan
  hasta abrir el reportaje. Fotografías decodificadas; inspección móvil/escritorio.
- TypeScript --noEmit --incremental false y ESLint de nueve archivos: correctos.
- Revisión independiente estática de fases15–18: sin hallazgos accionables;
  ejecución y capturas verificadas por la tarea editora, no por el revisor.
- Foco de retorno a solución abierta corregido al encabezado, visible por encima
  del contenido y bajo la cabecera fija; conserva formulario y detalles abiertos.
- SHA256:19 cambios ajenos del checkout principal y fotografías preservados.
  De462 archivos de candidata del baseline, solo ocho archivos de la reserva
  cambiaron; además se crearon el endpoint, su suite y este registro.
- Capturas finales: /private/tmp/obraxen-impeccable-cycle.4yRhsK/optimized-check.

### Medición comparable de optimize

GET a la misma ruta de desarrollo, antes/después de separar las fotografías:

| Medida | Antes | Después |
|---|---:|---:|
| HTML sin comprimir, bytes | 1.313.103 | 135.495 |
| gzip calculado con Node, bytes | 918.090 | 20.417 |
| Segmentos de imagen base64 en HTML | 8 | 0 |

Reducción del documento sin comprimir89,7%. El gzip es una estimación comparable,
no el tamaño de transferencia observado en producción. Las fotos suman441.704
bytes binarios y ahora se solicitan por separado: no se afirma que esos bytes
hayan desaparecido ni que esto mida LCP/INP/CLS. Las dos fotos inicialmente
ocultas (247.448bytes) esperan la apertura del caso.

### Requisito de live (sin aplicar)

La instalación local verificada detecta CSP append-string en next.config.ts.
El selector necesita permitir http://localhost:8400 en script-src y connect-src,
solo durante desarrollo. La skill exige consentimiento antes de este cambio.
La inyección y archivos auxiliares requieren reserva adicional de rutas exactas;
la reserva actual no incluye next.config.ts ni el layout global.
No se autoriza implícitamente modificar style-src, añadir unsafe-eval, ampliar
orígenes externos, instalar dependencias ni desplegar.

La propuesta de seguridad es declarar:

```ts
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";
```

e interpolar esa cadena en script-src y connect-src de la CSP existente,
manteniendo literalmente todas las demás directivas. Se podrá retirar esa
excepción al terminar la sesión. Producción recibirá una cadena vacía.

## Coordinación

Transferencia de excellence registrada en ambas cadenas mediante la decisión
`user-confirms-shape-transfer-20260909-architecture-cycle`. Baseline SHA256 de
462 archivos de la candidata y 19 cambios ajenos del checkout de control.
Preflight: sin errores de claims, clones ni coordinación; sin lease; runtime
correcto mediante wrapper. Los límites de concurrencia del runner autónomo no
son autorización para tocar otras reservas; esta tarea manual tiene alcance propio.

## Remediación de shape, critique y audit

Se sustituye el reportaje de ancho completo de Cuaderno de obra por una ficha de
caso estable. El resumen conserva problema, intervención y resultado completos
cuando caben en 120 caracteres; el detalle nativo solo contiene texto adicional,
superficie, materiales, duración e imágenes complementarias. Abrir un caso no
reordena ni desplaza la ficha vecina.

- Se corrige el enlace «Saltar al contenido» con texto legible y foco sobre
  `main`; la nota de preview queda dentro de ese landmark.
- La marca del encabezado alcanza una zona de interacción de 44 px.
- Las fotografías privadas de los casos usan candidatos responsivos y `sizes`;
  la ruta de origen sigue cerrada fuera de la preview local.
- La verificación final da Vitest 72/72, Playwright 20/20, TypeScript sin
  emisión y ESLint de los archivos tocados sin errores.
- La crítica independiente queda en 25/32 y el audit técnico en 17/20, sin
  hallazgos P0/P1. El resultado no se fuerza a una puntuación perfecta.

Permanece como límite editorial la densidad y repetición de las 16 fotografías
de soluciones: es un requisito vigente de cuatro soluciones por cuatro fotos y
no se han inventado nuevas obras o activos para disfrazarlo. La validación live
sigue sin iniciarse porque la excepción CSP de desarrollo no forma parte de esta
remediación autorizada.
