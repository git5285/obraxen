# Producto

> Documento inferido del contenido actual del repositorio (`index.html`,
> `data/brand.json`, `README.md`) a fecha 2026-07-14.
> Todo lo que **no** puede fundamentarse en el repo está marcado con `«FALTA»`.
> No se ha inventado nada: cada afirmación procede de copy o datos existentes.
>
> **Identidad (nombre, dominio, email, teléfono, razón social, dirección):**
> centralizada en [`data/brand.json`](data/brand.json). No se duplica aquí para
> mantener el punto único de verdad establecido previamente.
>
> **Nombre temporal:** “RemainOn” es solo el identificador interno heredado del
> proyecto y no puede publicarse como marca. La empresa aún no está constituida;
> únicamente está confirmada la intención de constituir una sociedad limitada.
> El naming, la razón social y el CIF están aplazados por decisión de los socios.

## Qué es la empresa

Empresa de **reparación y tratamiento técnico de pavimentos industriales de
hormigón** (footer «Actividad»; `<title>`; JSON-LD `LocalBusiness`).

- **Servicios núcleo** (sección Servicios): reparación de juntas, tratamiento de
  fisuras (estructural o superficial con resinas), recrecidos y nivelación
  (morteros autonivelantes), tratamientos superficiales (pulido, endurecimiento,
  recubrimientos continuos).
- **Catálogo extendido** (sección Servicios → catálogo): retirada de pavimento
  epoxi, reparación de suelos de resina, eliminación de señalización vial,
  retirada de anclajes/tornillos, bacheo y parcheo de hormigón, reparación de
  arañazos y desconchones, sellado de juntas de dilatación, pulido en grandes
  superficies.
- **Modelo de ejecución:** equipos propios.
- **Posicionamiento declarado:** experiencia de obra aplicada a cada reparación,
  respaldada por **más de 10 años de experiencia acumulada** del equipo en
  ejecución de pavimentos industriales.
- **Horario de atención confirmado:** lunes a viernes, 9:00–18:00. El valor
  `Mo-Fr 09:00-18:00` queda preparado en `brand.json` para incorporarse al
  JSON-LD cuando se confirme el nombre comercial.
- La forma jurídica prevista es una **sociedad limitada**, todavía no constituida.
  Razón social, CIF, fecha de constitución, tamaño del equipo, facturación y
  certificaciones: `«FALTA»` y no se publican hasta confirmarlos en `brand.json`.

## A quién vende (segmentos y decisores)

- **Modelo:** B2B — empresas con pavimento industrial de hormigón en uso.
- **Segmentos / sectores** (cinta de Sectores): Logística, Alimentación,
  Automoción, Retail, Farmacéutico, Aparcamientos.
- **Tipo de instalación:** plantas / naves industriales en operación (copy:
  «intervenciones por fases», «tu operativa», «la instalación»).
- **Decisores / comprador:** «responsables de mantenimiento y operaciones»
  (introducción de la FAQ, literal). No aparecen otros roles (compras,
  dirección de planta, facility managers): `«FALTA»` confirmar.
- Tamaño de cliente objetivo (pyme vs. gran cuenta), volumen de m² típico,
  presupuesto medio, ciclo de decisión: `«FALTA»`.

## Problema que resuelve el cliente

- **Pavimento degradado que frena la operativa** («¿Tu pavimento está frenando
  tu operativa?»): juntas dañadas por tráfico pesado, fisuras estructurales o
  superficiales, superficies degradadas, pérdida de planimetría.
- **Coste de parar la producción** para reparar (hero y propuesta giran en torno
  a reducir el impacto y planificar la mínima parada posible).
- **Reparaciones que no duran**: se repara el síntoma sin corregir la causa
  (juntas mal dimensionadas, soporte degradado, tráfico distinto al de diseño) —
  FAQ y Proceso lo plantean explícitamente.
- Cuantificación del problema para el cliente (coste de parada/hora, incidencias
  de seguridad, etc.): `«FALTA»`.

## Propuesta de valor

Fundamentado en copy de Hero, Proceso, Servicios, «Por qué», FAQ y Contacto:

- **Propuesta de intervención por fases para reducir el impacto**, cuando el daño,
  el sistema y la circulación de la instalación lo permiten.
- **Diagnóstico de causa raíz**, no solo del síntoma.
- **Valoración inicial sin visita** (con fotos/vídeo) + inspección in situ para
  el presupuesto definitivo.
- **Propuesta adaptada a cada caso:** solución, alcance, materiales, plazos y
  fases se concretan según el diagnóstico; no se promete un formato universal
  de presupuesto cerrado.
- **Materiales seleccionados según el sistema**; homologaciones concretas: `«FALTA»`.
- **Primera respuesta en menos de 48 horas.**
- Las medidas específicas de control de polvo, residuos o protección se mantienen
  como `«FALTA»` hasta disponer de un protocolo verificable.
- El plazo de reapertura depende del sistema y se concreta en la propuesta técnica.
- **Método declarado:** «Diagnosticar · Reparar · Rendir», estructurado en 4
  fases (valoración → propuesta técnica → ejecución → entrega y seguimiento).
- **Métricas publicadas:** más de 10 años de experiencia acumulada, primera
  respuesta inferior a 48 horas y las cuatro fases del método. No se publican
  porcentajes de continuidad operativa ni otras cifras sin evidencia.

## Competencia y referencias

- **Competencia:** `«FALTA»` — el repo no menciona competidores ni
  posicionamiento comparativo.
- **Proyectos ejecutados:** Delticom, TP-Link, dadada GmbH, L’Oréal, Blitz y
  Hologram Bâtiment están publicados desde `data/proyectos.json`, con ejecución,
  ubicación, unidades principales y permiso para identificar al cliente confirmados.
  La redacción distingue alcance ejecutado de resultado documentado: solo describe
  lo visible en las fotografías y no afirma plazos, continuidad ni rendimiento sin
  una confirmación específica.
- **Auditoría de imágenes:** `PHOTO_AUDIT.md` registra la revisión de 640 fotos y
  un vídeo, las exclusiones de privacidad, la selección de 18 imágenes y la decisión
  de no alterar evidencia de obra mediante IA generativa.
- **Equipo:** el bloque queda preparado, pero no se genera mientras falten nombre
  y cargo del fundador. Testimonios de cliente: `«FALTA»`.
- **Recursos / contenido técnico:** `«FALTA»`; no se publican plantillas vacías.

## Tono de voz

Inferido de rasgos observables del copy (no existe guía de estilo documentada en
el repo):

- **Tuteo / segunda persona** constante («tu operativa», «cuéntanos»). El CTA es
  contextual: «Ver proyectos» mientras no exista contacto y «Pide una evaluación»
  cuando se confirme al menos un canal.
- **Directo y conciso**, con imperativos y frases nominales cortas
  («Diagnosticar. Reparar. Rendir.»).
- **Técnico pero traducido a beneficio operativo** (habla de resinas y morteros,
  pero el foco es «no parar la producción»).
- **Tranquilizador / reductor de riesgo**: valoración inicial, alcance definido y
  planificación por fases sin convertir posibilidades técnicas en promesas absolutas.
- **Autoridad por oficio**: «Oficio de siempre», «Conocemos los suelos porque
  los hemos construido».
- Guía de estilo formal, do's & don'ts, léxico permitido/prohibido, tratamiento
  en otros idiomas: `«FALTA»`.

## Register: brand

- Registro del documento: **marca** (nivel de marca, no de producto concreto ni
  de campaña puntual).
- Registro lingüístico observado: **profesional cercano en B2B, con tuteo**
  (informal en la forma, técnico en el fondo). Coincide con «Tono de voz».
- Directrices de registro por canal, formalidad por mercado/idioma, o variantes
  (comercial vs. técnico vs. legal): `«FALTA»`.

## Platform: web

- **Sitio web estático** (HTML + CSS + JavaScript nativo), con portada-hub, seis
  páginas de caso y validación en Node sin dependencias de terceros.
- **Despliegue:** proyecto Vercel conservado, sin despliegue público y con
  auto-deploy desactivado hasta aprobar la publicación (README).
- **Estado actual:** preview `noindex,nofollow`; sin nombre, dominio ni canales de
  contacto inventados; datos desconocidos omitidos y publicación estricta
  bloqueada hasta completarlos.
- **Evolución prevista** (README, «Decisiones»): valorar Astro cuando se active
  i18n o crezcan nuevas colecciones; hero de vídeo solo con metraje propio de obra.
- Otras plataformas (app, redes sociales, landing de campañas, portal de
  cliente): `«FALTA»`.

## Mercados objetivo

- **Toda la Unión Europea** — cobertura operativa confirmada.
- **Mercados principales:** Alemania, Países Bajos, Bélgica, Francia, España,
  Portugal e Italia.
- La prioridad comercial entre esos países y los idiomas de publicación siguen
  pendientes de planificación.
