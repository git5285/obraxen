#!/usr/bin/env node
/**
 * build.mjs — render estático sin dependencias.
 *
 * Lee los datos y plantillas del proyecto y escribe dist/ con HTML y activos
 * completamente estáticos. No hay fetch ni inyección de marca en runtime.
 *
 * Sintaxis de plantilla:
 *   {{ ruta.punteada }}    → valor escapado para HTML/atributos
 *   {{{ ruta.punteada }}}  → valor en crudo (fragmentos HTML ya seguros)
 *   {{> nombre-parcial }}  → incrusta src/partials/<nombre>.html (recursivo)
 *
 * Uso: node scripts/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'dist');   // directorio servido (outputDirectory en vercel.json)
const ASSETS = ['css', 'img'];             // activos que se copian tal cual a dist/

const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'brand.json'), 'utf8'));
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'proyectos.json'), 'utf8'));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ---- Derivados de marca (única fuente: data/brand.json) ----
const nombre = brand.nombre || '';
const claim = brand.claim || '';
const noPend = (v) => v && String(v).indexOf('PENDIENTE') < 0;
const clean = (v) => noPend(v) ? String(v).trim() : '';

function validateBrand() {
  const errors = [];
  for (const key of ['claim']) {
    if (!clean(brand[key])) errors.push(`brand.${key} es obligatorio`);
  }
  if (clean(brand.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.email)) {
    errors.push('brand.email no es válido');
  }
  if (clean(brand.dominio) && !/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(brand.dominio)) {
    errors.push('brand.dominio no es válido');
  }
  for (const key of ['telefono', 'whatsapp']) {
    const value = clean(brand[key]);
    if (value && value.replace(/\D/g, '').length < 9) errors.push(`brand.${key} no es válido`);
  }
  if (!Array.isArray(projects)) errors.push('data/proyectos.json debe contener un array');
  if (Array.isArray(projects)) {
    const slugs = projects.map((project) => project?.slug);
    const invalidSlugs = slugs.filter((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug || '')));
    const duplicateSlugs = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
    if (invalidSlugs.length) errors.push(`slugs de proyecto no válidos: ${invalidSlugs.join(', ')}`);
    if (duplicateSlugs.length) errors.push(`slugs de proyecto duplicados: ${[...new Set(duplicateSlugs)].join(', ')}`);
  }
  if (!Array.isArray(brand.areasServicio) || !brand.areasServicio.length || brand.areasServicio.some((area) => !clean(area))) {
    errors.push('brand.areasServicio debe contener al menos un mercado válido');
  }
  const temporaryName = clean(brand.nombreTemporalNoPublicable);
  if (temporaryName && clean(brand.nombre).toLocaleLowerCase('es') === temporaryName.toLocaleLowerCase('es')) {
    errors.push('brand.nombre no puede utilizar el nombre temporal no publicable');
  }

  if (brand.publicar) {
    if (brand.empresaConstituida !== true) {
      errors.push('la sociedad debe estar constituida antes de publicar');
    }
    for (const key of ['nombre', 'nombreLegal', 'cif', 'direccion', 'dominio', 'email']) {
      if (!clean(brand[key])) errors.push(`brand.${key} es obligatorio para publicar`);
    }
    if (!clean(brand.telefono) && !clean(brand.whatsapp)) {
      errors.push('hace falta teléfono o WhatsApp para publicar');
    }
    for (const key of ['legalUrl', 'privacidadUrl']) {
      if (!clean(brand[key])) errors.push(`brand.${key} es obligatorio para publicar`);
      else if (!/^(?:https:\/\/|\/(?!\/))/.test(brand[key])) errors.push(`brand.${key} debe ser una URL https o una ruta absoluta`);
    }
    if (brand.legalRevisionAprobada !== true) {
      errors.push('brand.legalRevisionAprobada debe ser true para publicar');
    }
  }
  if (errors.length) throw new Error('Datos inválidos:\n- ' + errors.join('\n- '));
}
validateBrand();

// Sin nombre final mostramos un símbolo neutro, nunca una marca inventada.
const TAIL = 2;
const cut = Math.max(0, nombre.length - TAIL);
const logoInner = nombre
  ? esc(nombre.slice(0, cut)) + '<span>' + esc(nombre.slice(cut)) + '</span>'
  : '<svg class="logo-provisional" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="7"/><path d="M8 21l6-5 4 3 6-7"/></svg><span class="sr-only">Inicio</span>';

const titleText = nombre ? `${nombre} — ${claim}` : claim;
const descText = `Reparación de pavimentos industriales: juntas, fisuras, recrecidos y tratamientos superficiales. Intervenciones planificadas para reducir el impacto en la actividad.`;
const domain = clean(brand.dominio);
const email = clean(brand.email);
const siteUrl = domain ? `https://${domain}` : '';
const ogImage = siteUrl ? `${siteUrl}/img/hero-nave.jpg` : '';
const robotsDirective = brand.publicar ? 'index,follow' : 'noindex,nofollow';
const siteName = nombre || claim;
const absoluteMetaHtml = siteUrl ? `<link rel="canonical" href="${esc(siteUrl)}/">
<meta property="og:url" content="${esc(siteUrl)}/">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:alt" content="Pavimento industrial en una nave logística">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="720">
<meta name="twitter:image" content="${esc(ogImage)}">` : '';

const FAQ = [
  ['¿Podéis darme una valoración sin venir a la instalación?', 'Sí. Las fotos o un vídeo de la zona afectada y unas medidas aproximadas permiten preparar una primera valoración orientativa. Si hace falta concretar el alcance, acordamos una inspección in situ antes de definir la propuesta.'],
  ['¿Puedo seguir operando durante la reparación?', 'Depende del daño, el sistema y la circulación de la instalación. Cuando el alcance lo permite, proponemos fases, zonas acotadas u horarios alternativos para reducir el impacto sobre la actividad.'],
  ['¿Cuánto tarda en poder pisarse una zona reparada?', 'Depende del sistema empleado. Existen morteros y resinas de curado rápido; el plazo concreto para tráfico peatonal o de carretillas queda definido en la propuesta técnica.'],
  ['¿Por qué se rompen las juntas y las fisuras vuelven a aparecer?', 'Puede ocurrir cuando se trata el síntoma sin revisar la causa: juntas mal dimensionadas, soporte degradado o un tráfico distinto al previsto. Por eso la valoración empieza por el estado del pavimento y las condiciones de uso.'],
  ['¿Trabajáis fuera de España?', 'Sí. Trabajamos en toda la Unión Europea, principalmente en Alemania, Países Bajos, Bélgica, Francia, España, Portugal e Italia.'],
];
const faqHtml = FAQ.map(([question, answer]) => `        <details data-stagger>
          <summary>${esc(question)}</summary>
          <p>${esc(answer)}</p>
        </details>`).join('\n');

// JSON-LD resuelto en build
const graph = [];
if (nombre) {
  const businessLd = {
    '@type': 'LocalBusiness',
    name: nombre,
    description: `${claim}: juntas, fisuras, recrecidos y tratamientos superficiales.`,
    areaServed: brand.areasServicio,
  };
  if (siteUrl) {
    businessLd['@id'] = `${siteUrl}/#empresa`;
    businessLd.url = siteUrl;
    businessLd.image = ogImage;
  }
  if (email) businessLd.email = email;
  if (noPend(brand.telefono)) businessLd.telephone = brand.telefono;
  if (noPend(brand.direccion)) businessLd.address = brand.direccion;
  if (noPend(brand.horarioSchema)) businessLd.openingHours = brand.horarioSchema;
  graph.push(businessLd);
}
graph.push({
  '@type': 'FAQPage',
  mainEntity: FAQ.map(([name, text]) => ({
    '@type': 'Question',
    name,
    acceptedAnswer: { '@type': 'Answer', text },
  })),
});
const ld = {
  '@context': 'https://schema.org',
  '@graph': graph,
};
const jsonld = JSON.stringify(ld, null, 2).replace(/</g, '\\u003c');

const phone = clean(brand.telefono);
const whatsapp = clean(brand.whatsapp);
const telHref = phone.replace(/[^+\d]/g, '');
const whatsappHref = whatsapp.replace(/\D/g, '');
const hasContactChannel = Boolean(email || phone || whatsapp);
const secondaryContactLinks = [
  whatsapp ? `<a href="https://wa.me/${esc(whatsappHref)}" rel="noopener">WhatsApp</a>` : '',
  phone ? `<a href="tel:${esc(telHref)}">${esc(phone)}</a>` : '',
].filter(Boolean);
const contactChannelsHtml = secondaryContactLinks.length
  ? ` También puedes contactar por ${secondaryContactLinks.join(' o ')}.`
  : '';
const footerContactItemsHtml = [
  email ? `<li><a href="mailto:${esc(email)}">${esc(email)}</a></li>` : '',
  whatsapp ? `<li><a href="https://wa.me/${esc(whatsappHref)}" rel="noopener">WhatsApp</a></li>` : '',
  phone ? `<li><a href="tel:${esc(telHref)}">${esc(phone)}</a></li>` : '',
  clean(brand.horarioTexto) ? `<li>${esc(brand.horarioTexto)}</li>` : '',
].filter(Boolean).join('\n        ');
const contactFormHtml = email ? `<form class="form" id="formContacto" action="mailto:${esc(email)}" method="post" enctype="text/plain" aria-describedby="contacto-ayuda" data-reveal>
      <label for="f-nombre">Nombre</label>
      <input id="f-nombre" name="nombre" type="text" autocomplete="name" required>
      <label for="f-email">Correo electrónico</label>
      <input id="f-email" name="email" type="email" autocomplete="email" required>
      <label for="f-msg">¿Qué le pasa a tu pavimento?</label>
      <textarea id="f-msg" name="mensaje" required></textarea>
      <button class="btn btn-acento" type="submit">Preparar solicitud por email</button>
      <small id="contacto-ayuda">Al continuar se abrirá tu aplicación de correo.${contactChannelsHtml}</small>
    </form>` : hasContactChannel ? `<div class="form form-pendiente" data-reveal>
      <p class="form-estado">Canales disponibles</p>
      <h3>Cuéntanos qué ocurre en el pavimento</h3>
      <p>${secondaryContactLinks.join('<br>')}</p>
    </div>` : '';
const footerContactColumnHtml = footerContactItemsHtml ? `<div>
      <h3>${hasContactChannel ? 'Contacto' : 'Horario'}</h3>
      <ul>
        ${footerContactItemsHtml}
      </ul>
    </div>` : '';
const legalRows = [
  clean(brand.nombreLegal) ? `<strong>Razón social:</strong> ${esc(brand.nombreLegal)}` : '',
  clean(brand.cif) ? `<strong>CIF:</strong> ${esc(brand.cif)}` : '',
  clean(brand.direccion) ? `<strong>Domicilio:</strong> ${esc(brand.direccion)}` : '',
  '<strong>Actividad:</strong> Reparación y tratamiento técnico de pavimentos industriales de hormigón',
].filter(Boolean);
const legalDetailsHtml = legalRows.join('<br>\n        ');
const legalLinks = [
  clean(brand.legalUrl) ? `<a href="${esc(brand.legalUrl)}">Aviso legal</a>` : '',
  clean(brand.privacidadUrl) ? `<a href="${esc(brand.privacidadUrl)}">Privacidad</a>` : '',
].filter(Boolean);
const legalLinksHtml = legalLinks.join(' · ');
const founderName = clean(brand.fundadorNombre);
const founderRole = clean(brand.fundadorCargo) || 'Equipo fundador';
const years = Number(brand.experienciaAnios);
const experienceStatHtml = Number.isFinite(years) && years > 0
  ? `<div class="stat" data-reveal><b>+<i data-counter="${years}">${years}</i></b><span>Años de experiencia acumulada del equipo</span></div>`
  : '';
const responseHours = Number(brand.respuestaHoras);
const responseStatHtml = Number.isFinite(responseHours) && responseHours > 0
  ? `<div class="stat" data-reveal><b>&lt;<i data-counter="${responseHours}">${responseHours}</i>h</b><span>Primera respuesta</span></div>`
  : '';
const contactResponseText = Number.isFinite(responseHours) && responseHours > 0
  ? `Recibirás una primera respuesta en menos de ${responseHours} horas con los próximos pasos para valorar el caso.`
  : 'Revisaremos la información y te indicaremos los próximos pasos para valorar el caso.';
const contactLeadHtml = hasContactChannel ? `<div class="cta-fila">
    <div>
      <p class="kicker" data-reveal>Contacto</p>
      <h2 data-reveal>¿Tu pavimento está frenando tu operativa?</h2>
      <p data-reveal>Cuéntanos qué ocurre. ${esc(contactResponseText)}</p>
    </div>
    ${contactFormHtml}
  </div>` : '';
const naturalList = (items) => {
  if (items.length < 2) return items[0] || '';
  const last = items.at(-1);
  const conjunction = /^(?:i|hi(?!e))/i.test(last) ? 'e' : 'y';
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${last}`;
};
const serviceAreas = brand.areasServicio.map(clean).filter(Boolean);
const serviceAreaLabel = serviceAreas.length === 1 && serviceAreas[0] === 'Unión Europea'
  ? 'la Unión Europea'
  : naturalList(serviceAreas);
const priorityMarketsLabel = Array.isArray(brand.mercadosPrioritarios)
  ? naturalList(brand.mercadosPrioritarios.map(clean).filter(Boolean))
  : '';
const ownTeamsAdvantageHtml = brand.equiposPropios ? `<div class="ventaja" data-stagger>
            <div class="ico" aria-hidden="true">
              <svg class="ic" viewBox="0 0 24 24"><path d="M4 18h16M6 18V9l6-4 6 4v9"/><path d="M9 18v-5h6v5"/></svg>
            </div>
            <div>
              <h3>Equipos propios</h3>
              <p>La ejecución se realiza con equipos propios, manteniendo el control directo sobre la planificación y el trabajo en obra.</p>
            </div>
          </div>` : '';
const brandKicker = nombre || 'Experiencia técnica';
const whyKicker = nombre ? `Por qué ${nombre}` : 'Por qué este enfoque';
const teamQuote = nombre
  ? `Hemos pasado más de diez años ejecutando pavimentos industriales. ${nombre} nace para hacer lo que mejor sabemos: devolverles el rendimiento cuando fallan, reduciendo el impacto en la actividad.`
  : 'Hemos pasado más de diez años ejecutando pavimentos industriales. Este proyecto nace para hacer lo que mejor sabemos: devolverles el rendimiento cuando fallan, reduciendo el impacto en la actividad.';
const teamSectionHtml = founderName ? `<section class="cita">
    <div class="wrap">
      <p class="kicker" data-reveal style="justify-content:center;display:flex">El equipo</p>
      <h2 data-reveal>Quiénes estamos detrás</h2>
      <blockquote data-reveal>«${esc(teamQuote)}»</blockquote>
      <cite data-reveal><b>${esc(founderName)}</b>${esc(founderRole)}</cite>
    </div>
  </section>` : '';
const copyrightText = nombre ? `© 2026 ${nombre}. Todos los derechos reservados.` : 'Reparación y tratamiento técnico de pavimentos industriales.';
const legalOwner = clean(brand.nombreLegal) || 'Pendiente de confirmar';
const legalTaxId = clean(brand.cif) || 'Pendiente de confirmar';
const legalContactEmail = email || 'Pendiente de confirmar';
const legalDomain = domain || 'Pendiente de confirmar';
const legalUpdatedAt = '14 de julio de 2026';

function renderProjects(items) {
  if (!items.length) return '';
  return `<section class="proyectos" id="proyectos">
    <div class="wrap">
      <div class="cab">
        <p class="kicker">Proyectos ejecutados</p>
        <h2>Alcance real y evidencia de obra</h2>
        <p class="proy-intro">Cada ficha recoge magnitudes confirmadas, fotografías de la obra y una lectura separada de la situación, la intervención ejecutada y el resultado que puede acreditarse.</p>
      </div>
      <div class="proy-grid">
${items.map((project, index) => {
  const t = project.traducciones?.es;
  const images = project.imagenes;
  if (!project.slug || !project.referencia || !project.cliente || !project.sector || !project.ubicacion?.ciudad || !project.ubicacion?.pais || !Array.isArray(project.magnitudes) || !project.magnitudes.length || !Array.isArray(images) || images.length < 3 || !t?.titulo || !t?.problema || !t?.solucion || !t?.resultado) {
    throw new Error(`Proyecto ${index + 1}: faltan campos obligatorios`);
  }
  if (project.ejecucionConfirmada !== true || project.permisoPublicarCliente !== true) {
    throw new Error(`Proyecto ${project.slug}: falta confirmar ejecución o permiso de publicación`);
  }
  if (project.superficieM2 != null && (!Number.isFinite(project.superficieM2) || project.superficieM2 <= 0)) {
    throw new Error(`Proyecto ${project.slug}: superficieM2 no es válida`);
  }
  const imageRoot = path.join(ROOT, 'img') + path.sep;
  const galleryHtml = images.map((image, imageIndex) => {
    if (!image?.src || !image?.alt || !image?.etapa) {
      throw new Error(`Proyecto ${project.slug}: imagen ${imageIndex + 1} incompleta`);
    }
    const imagePath = path.resolve(ROOT, image.src);
    if (!imagePath.startsWith(imageRoot)) throw new Error(`Proyecto ${project.slug}: la imagen debe vivir dentro de img/`);
    if (!fs.existsSync(imagePath)) throw new Error(`Proyecto ${project.slug}: no existe ${image.src}`);
    return `            <figure>
              <img src="${esc(image.src)}" alt="${esc(image.alt)}" loading="lazy" decoding="async">
              <figcaption>${esc(image.etapa)}</figcaption>
            </figure>`;
  }).join('\n');
  const magnitudeHtml = project.magnitudes.map((magnitude) => `              <li>${esc(magnitude)}</li>`).join('\n');
  return `        <article class="proy" data-stagger>
          <div class="proy-media" aria-label="Reportaje fotográfico de ${esc(project.cliente)}">
${galleryHtml}
          </div>
          <div class="cuerpo">
            <div class="meta">
              <span class="ref">${esc(project.referencia)}</span>
              <span>${esc(project.sector)}</span>
              <span>${esc(project.ubicacion.ciudad)}, ${esc(project.ubicacion.pais)}</span>
            </div>
            <h3>${esc(t.titulo)}</h3>
            <ul class="proy-cifras" aria-label="Magnitudes confirmadas">
${magnitudeHtml}
            </ul>
            <div class="proy-resumen">
              <strong>Situación</strong>
              <p>${esc(t.problema)}</p>
            </div>
            <a class="proy-enlace" href="/proyectos/${esc(project.slug)}/" aria-label="Ver el caso completo de ${esc(project.cliente)}">Ver caso completo <span aria-hidden="true">→</span></a>
          </div>
        </article>`;
}).join('\n')}
      </div>
    </div>
  </section>`;
}
const projectsSection = renderProjects(projects);

function renderProjectsHub(items) {
  return items.map((project) => {
    const t = project.traducciones.es;
    const galleryHtml = project.imagenes.map((image) => `              <figure>
                <img src="/${esc(image.src)}" alt="${esc(image.alt)}" loading="lazy" decoding="async">
                <figcaption>${esc(image.etapa)}</figcaption>
              </figure>`).join('\n');
    const magnitudeHtml = project.magnitudes
      .map((magnitude) => `              <li>${esc(magnitude)}</li>`)
      .join('\n');
    const hasConfirmedPositiveClose = project.cierre?.entregaConforme === true
      && project.cierre?.correccionesPosteriores === false;
    const closeHtml = hasConfirmedPositiveClose ? `
          <div class="dossier-close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>
            <p><strong>Cierre confirmado</strong> Entrega conforme y sin correcciones posteriores.</p>
          </div>
` : '';

    return `      <article class="project-dossier" id="${esc(project.slug)}">
        <header class="dossier-header">
          <p class="dossier-reference">Obra ${esc(project.referencia)}</p>
          <dl>
            <div><dt>Cliente</dt><dd>${esc(project.cliente)}</dd></div>
            <div><dt>Sector</dt><dd>${esc(project.sector)}</dd></div>
            <div><dt>Ubicación</dt><dd>${esc(project.ubicacion.ciudad)}, ${esc(project.ubicacion.pais)}</dd></div>
          </dl>
        </header>

        <a class="dossier-media" href="/proyectos/${esc(project.slug)}/" aria-label="Abrir la ficha completa de ${esc(project.cliente)}">
          <div class="contact-sheet" role="group" aria-label="Evidencia fotográfica de ${esc(project.cliente)}">
${galleryHtml}
          </div>
        </a>

        <div class="dossier-body">
          <div class="dossier-intro">
            <p class="projects-kicker">Situación documentada</p>
            <h2>${esc(t.titulo)}</h2>
            <p>${esc(t.problema)}</p>
          </div>

          <div class="dossier-intervention">
            <h3>Intervención ejecutada</h3>
            <p>${esc(t.solucion)}</p>
            <ul aria-label="Magnitudes confirmadas">
${magnitudeHtml}
            </ul>
          </div>

${closeHtml}
          <a class="dossier-link" href="/proyectos/${esc(project.slug)}/" aria-label="Ver el caso completo de ${esc(project.cliente)}">Abrir ficha de obra <span aria-hidden="true">→</span></a>
        </div>
      </article>`;
  }).join('\n');
}

const projectsHubHtml = renderProjectsHub(projects);
const projectsTitle = `Proyectos ejecutados — ${claim}`;
const projectsDescription = 'Archivo de obras ejecutadas con fotografías, alcance, magnitudes confirmadas y cierre documentado de cada intervención.';
const projectsPath = '/proyectos/';
const projectsUrl = siteUrl ? `${siteUrl}${projectsPath}` : '';
const projectsOgImage = projects.length ? `/${projects[0].imagenes[0].src}` : '/img/hero-nave.jpg';
const projectsOgImageAlt = projects.length ? projects[0].imagenes[0].alt : 'Pavimento industrial';
const projectsAbsoluteMetaHtml = projectsUrl ? `<link rel="canonical" href="${esc(projectsUrl)}">
<meta property="og:url" content="${esc(projectsUrl)}">
<meta property="og:image" content="${esc(siteUrl + projectsOgImage)}">
<meta property="og:image:alt" content="${esc(projectsOgImageAlt)}">` : '';
const projectsJsonLdHtml = `<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      name: 'Proyectos ejecutados',
      description: projectsDescription,
      ...(projectsUrl ? { url: projectsUrl } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: siteUrl ? `${siteUrl}/` : '/' },
        { '@type': 'ListItem', position: 2, name: 'Proyectos', item: projectsUrl || projectsPath },
      ],
    },
    {
      '@type': 'ItemList',
      numberOfItems: projects.length,
      itemListElement: projects.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: project.traducciones.es.titulo,
        url: `${siteUrl}/proyectos/${project.slug}/`,
      })),
    },
  ],
}, null, 2).replace(/</g, '\\u003c')}
</script>`;
const ctaHref = hasContactChannel ? '#contacto' : (projects.length ? '/proyectos/' : '#servicios');
const ctaText = hasContactChannel ? 'Pide una evaluación' : (projects.length ? 'Ver proyectos' : 'Ver servicios');
const capaCtaText = hasContactChannel ? 'Pedir evaluación →' : (projects.length ? 'Ver proyectos →' : 'Ver servicios →');

// Navegación: única fuente de los enlaces → se renderiza a 3 variantes.
// Añadir aquí un item lo publica en las tres barras (móvil, sticky y hero).
const NAV = [
  { href: '#proceso', label: 'Proceso', section: 'proceso' },
  { href: '#servicios', label: 'Servicios', section: 'servicios' },
  ...(projects.length ? [{ href: '/proyectos/', label: 'Proyectos' }] : []),
  { href: '#empresa', label: 'Empresa', section: 'empresa' },
  { href: '#faq', label: 'FAQ', section: 'faq' },
];
const navHeroLinks = NAV.map((item) => `<li><a href="${item.href}">${item.label}</a></li>`).join('\n      ');
const navStickyLinks = NAV.map((item) => `<li><a href="${item.href}"${item.section ? ` data-sec="${item.section}"` : ''}>${item.label}</a></li>`).join('\n      ');
const navMobileLinks = NAV.map((item) => `<a href="${item.href}">${item.label}</a>`).join('\n  ');

const ctx = {
  brand,
  logoInner,
  logoHref: '#inicio',
  ctaHref,
  ctaText,
  capaCtaText,
  titleText,
  descText,
  ogTitle: titleText,
  siteName,
  siteUrl,
  ogImage,
  absoluteMetaHtml,
  robotsDirective,
  jsonld,
  faqHtml,
  contactLeadHtml,
  footerContactItemsHtml,
  footerContactColumnHtml,
  legalDetailsHtml,
  legalLinksHtml,
  experienceStatHtml,
  responseStatHtml,
  serviceAreaLabel,
  priorityMarketsLabel,
  ownTeamsAdvantageHtml,
  brandKicker,
  whyKicker,
  teamSectionHtml,
  copyrightText,
  legalOwner,
  legalTaxId,
  legalContactEmail,
  legalDomain,
  legalUpdatedAt,
  projectsSection,
  projectsHubHtml,
  projectsTitle,
  projectsDescription,
  projectsAbsoluteMetaHtml,
  projectsJsonLdHtml,
  projectsCount: projects.length,
  navHeroLinks,
  navStickyLinks,
  navMobileLinks,
};

// ---- Motor de plantillas mínimo ----
function inlinePartials(str, depth = 0) {
  if (depth > 10) throw new Error('Recursión de parciales demasiado profunda');
  return str.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    const file = path.join(SRC, 'partials', name + '.html');
    return inlinePartials(fs.readFileSync(file, 'utf8').replace(/\n$/, ''), depth + 1);
  });
}
const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

function render(str, renderCtx = ctx) {
  str = inlinePartials(str);
  str = str.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p) => { const v = get(renderCtx, p); return v == null ? '' : String(v); });
  str = str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => { const v = get(renderCtx, p); return v == null ? '' : esc(v); });
  return str;
}

const out = render(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'));
const projectsOut = render(fs.readFileSync(path.join(SRC, 'projects.html'), 'utf8'), {
  ...ctx,
  logoHref: '/',
});
const legalPages = [
  ['aviso-legal', 'aviso-legal.html'],
  ['privacidad', 'privacidad.html'],
];
const renderedLegalPages = legalPages.map(([route, file]) => [
  route,
  render(fs.readFileSync(path.join(SRC, 'legal', file), 'utf8')),
]);
const projectTemplate = fs.readFileSync(path.join(SRC, 'project.html'), 'utf8');
const shorten = (value, max = 158) => {
  const text = String(value).trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
};
const renderedProjectPages = projects.map((project, index) => {
  const t = project.traducciones.es;
  const casePath = `/proyectos/${project.slug}/`;
  const caseUrl = siteUrl ? `${siteUrl}${casePath}` : '';
  const heroImage = `/${project.imagenes[0].src}`;
  const absoluteHeroImage = siteUrl ? `${siteUrl}${heroImage}` : '';
  const caseTitle = `${t.titulo} — Caso ejecutado`;
  const caseDescription = shorten(`${t.problema} ${t.solucion}`);
  const caseMagnitudesHtml = project.magnitudes
    .map((magnitude) => `          <li>${esc(magnitude)}</li>`)
    .join('\n');
  const continuityLabels = {
    total: 'La actividad continuó en paralelo',
    parcial: 'La actividad continuó parcialmente',
    detenida: 'La actividad no continuó durante la intervención',
    sin_actividad: 'Instalación sin actividad concurrente',
  };
  const publicExecutionDate = project.cierre.fechaEjecucion
    && !/pendiente de confirmar/i.test(project.cierre.fechaEjecucion)
    ? project.cierre.fechaEjecucion
    : '';
  const executionFacts = [
    publicExecutionDate ? ['Ejecución', publicExecutionDate] : null,
    project.cierre.duracionReal ? ['Duración real', project.cierre.duracionReal] : null,
    project.superficieInstalacionM2 ? ['Instalación aprox.', `${project.superficieInstalacionM2.toLocaleString('es-ES')} m²`] : null,
    project.equipoOperarios ? ['Equipo', `${project.equipoOperarios} operarios`] : null,
    project.cierre.continuidadOperativa ? ['Operativa', continuityLabels[project.cierre.continuidadOperativa]] : null,
  ].filter(Boolean);
  const caseExecutionFactsHtml = executionFacts
    .map(([label, value]) => `          <div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
    .join('\n');
  const resourceParts = [
    project.maquinaria.length ? `<strong>Maquinaria:</strong> ${esc(naturalList(project.maquinaria))}.` : '',
    project.materiales.length ? `<strong>Materiales:</strong> ${esc(naturalList(project.materiales))}.` : '',
  ].filter(Boolean);
  const caseResourcesHtml = resourceParts.length ? `        <article class="case-resources">
          <span>04</span>
          <div><h3>Medios confirmados</h3><p>${resourceParts.join(' ')}</p></div>
        </article>` : '';
  const caseImagesHtml = project.imagenes.map((image) => `        <figure>
          <img src="/${esc(image.src)}" alt="${esc(image.alt)}" loading="lazy" decoding="async">
          <figcaption>${esc(image.etapa)}</figcaption>
        </figure>`).join('\n');
  const previous = projects[index - 1];
  const next = projects[index + 1];
  const casePaginationHtml = [
    previous ? `    <a class="previous" href="/proyectos/${esc(previous.slug)}/"><span>← Caso anterior</span><strong>${esc(previous.cliente)} · ${esc(previous.ubicacion.ciudad)}</strong></a>` : '',
    next ? `    <a class="next" href="/proyectos/${esc(next.slug)}/"><span>Siguiente caso →</span><strong>${esc(next.cliente)} · ${esc(next.ubicacion.ciudad)}</strong></a>` : '',
  ].filter(Boolean).join('\n');
  const caseAbsoluteMetaHtml = caseUrl ? `<link rel="canonical" href="${esc(caseUrl)}">
<meta property="og:url" content="${esc(caseUrl)}">
<meta property="og:image" content="${esc(absoluteHeroImage)}">
<meta property="og:image:alt" content="${esc(project.imagenes[0].alt)}">` : '';
  const caseJsonLdHtml = caseUrl ? `<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Proyectos', item: `${siteUrl}/proyectos/` },
      { '@type': 'ListItem', position: 3, name: project.cliente, item: caseUrl },
    ],
  }, null, 2).replace(/</g, '\\u003c')}
</script>` : '';
  const caseCtx = {
    ...ctx,
    logoHref: '/',
    caseTitle,
    caseDescription,
    caseAbsoluteMetaHtml,
    caseJsonLdHtml,
    caseHeroSrc: heroImage,
    caseReference: project.referencia,
    caseClient: project.cliente,
    caseSector: project.sector,
    caseLocation: `${project.ubicacion.ciudad}, ${project.ubicacion.pais}`,
    caseHeading: t.titulo,
    caseProblem: t.problema,
    caseSolution: t.solucion,
    caseResult: t.resultado,
    caseMagnitudesHtml,
    caseExecutionFactsHtml,
    caseResourcesHtml,
    caseImagesHtml,
    casePaginationHtml,
  };
  return [project.slug, render(projectTemplate, caseCtx)];
});

// Ninguna marca de plantilla debe quedar sin resolver.
const renderedHtml = [
  ['inicio', out],
  ['proyectos', projectsOut],
  ...renderedLegalPages,
  ...renderedProjectPages.map(([slug, html]) => [`proyectos/${slug}`, html]),
];
for (const [route, html] of renderedHtml) {
  const leftover = html.match(/\{\{[^}]*\}\}/g);
  if (leftover) throw new Error(`${route}: placeholders sin resolver: ${leftover.join(', ')}`);
  if (/«PENDIENTE»|\[Nombre Apellido\]|\[B-00000000\]|\[Calle, nº, CP, Ciudad\]/.test(html)) {
    throw new Error(`${route}: la salida contiene datos ficticios visibles`);
  }
}

// dist/ contiene SOLO lo que se sirve (index.html + activos). Ni src/ ni
// scripts/ ni data/ ni *.md llegan aquí → en producción devuelven 404.
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), out);
const projectsDir = path.join(OUT_DIR, 'proyectos');
fs.mkdirSync(projectsDir, { recursive: true });
fs.writeFileSync(path.join(projectsDir, 'index.html'), projectsOut);
for (const [route, html] of renderedLegalPages) {
  const dir = path.join(OUT_DIR, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
for (const [slug, html] of renderedProjectPages) {
  const dir = path.join(OUT_DIR, 'proyectos', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
const robots = brand.publicar && siteUrl
  ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n';
fs.writeFileSync(path.join(OUT_DIR, 'robots.txt'), robots);
if (siteUrl) {
  const projectUrls = projects.map((project) => `  <url><loc>${siteUrl}/proyectos/${project.slug}/</loc></url>`).join('\n');
  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n  <url><loc>${siteUrl}/proyectos/</loc></url>\n${projectUrls}\n  <url><loc>${siteUrl}/aviso-legal/</loc></url>\n  <url><loc>${siteUrl}/privacidad/</loc></url>\n</urlset>\n`);
}
for (const dir of ASSETS) {
  fs.cpSync(path.join(ROOT, dir), path.join(OUT_DIR, dir), { recursive: true });
}
console.log(`build OK → dist/ (${brand.publicar ? 'PUBLICACIÓN' : 'PREVIEW NOINDEX'}) · portada + hub de proyectos + ${renderedProjectPages.length} casos + legales + ${ASSETS.join('/ + ')}/`);
