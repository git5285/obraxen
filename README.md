# RemainOn — Web corporativa

Web estática (HTML + CSS + GSAP) de RemainOn, reparación de pavimentos
industriales. Sin build ni dependencias: `index.html` es el sitio completo.

## Estructura

- `index.html` — la página entera (estilos y JS incluidos)
- `img/` — fotografías optimizadas (JPEG progresivo) *(pendiente de añadir)*

## Despliegue

Conectado a Vercel (proyecto `remainon-web`). Cada push a `main`
despliega automáticamente.

## Pendiente antes de producción

- [ ] Añadir `img/` desde `remainon-web.zip` y reactivar las referencias
      a fotos en hero, servicios y panel Empresa
- [ ] Conectar el formulario de contacto a un backend (p. ej. Formspree)
- [ ] Rellenar placeholders: años de experiencia (+XX), nombre del
      fundador, teléfono, datos legales del footer
- [ ] Secciones ocultas (`hidden`): Proyectos, Equipo y Recursos —
      instrucciones de activación en comentarios del propio HTML

## Decisiones

- Un solo HTML hasta que se activen Proyectos/Recursos; entonces,
  migración a generador estático (Astro) con i18n para Europa
- Hero de vídeo: solo con metraje propio de obra (ver guía de grabación)
