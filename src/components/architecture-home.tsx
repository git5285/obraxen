import hero from "../../img/hero-nave.jpg";
import architectureHall from "../../img/architecture-hall-illustrative.png";
import joints from "../../img/juntas.jpg";
import cracks from "../../img/fisuras.jpg";
import polish from "../../img/pulido.jpg";
import inspection from "../../img/diagnostico.jpg";
import screed from "../../img/recrecidos.jpg";
import logisticsSector from "../../img/sectors/logistica.jpg";
import industrySector from "../../img/sectors/industria.jpg";
import automotiveSector from "../../img/sectors/automocion.jpg";
import distributionSector from "../../img/sectors/distribucion.jpg";
import foodSector from "../../img/sectors/alimentacion.jpg";
import parkingSector from "../../img/sectors/aparcamientos.jpg";
import suppliedJoint from "../../img/solutions/junta-dilatacion-2089.jpg";
import suppliedCrack from "../../img/solutions/fisura-2060.jpg";
import suppliedEpoxy from "../../img/solutions/desbastado-epoxi-2067.jpg";
import suppliedAnchors from "../../img/solutions/extraccion-anclajes-2015.jpg";
import { brand } from "@/lib/brand";
import { architectureCompany as company } from "@/lib/architecture-content";
import { getPath, locales } from "@/lib/i18n";
import { getImageDimensions } from "@/lib/homepage";
import { ArchitectureCaseDetails, ArchitectureContact, ArchitectureInquiryProvider, ArchitectureMenu, ArchitectureSolutionLink } from "./architecture-controls";
import { LogoMark } from "./logo-mark";
import { ResponsiveImage } from "./responsive-image";

type PreviewProject = { name: string; city: string; country: string; sector: string; area: number | null; description: string; problem: string; result: string; duration: string | null; materials: readonly string[]; images: readonly { src: string; alt: string; stage: string; width: number; height: number }[] };
const architectureLinks = [["Soluciones", "services"], ["Experiencia", "projects"], ["Sectores", "sectors"], ["Blog", "blog"]] as const;
const services = [
  { need: "Juntas deterioradas", title: "Reparación de juntas", image: joints, alt: "Inspección de una junta en un pavimento industrial", scope: "Saneado, reconstrucción y sellado de juntas.", review: "Estado de los bordes, apertura, tránsito y soporte.", body: "La solución se delimita después de revisar el daño y las condiciones de uso. El trabajo por fases depende de los accesos y de la seguridad de la instalación." },
  { need: "Fisuras visibles", title: "Tratamiento de fisuras", image: cracks, alt: "Detalle de una fisura en hormigón", scope: "Tratamiento según origen, geometría y evolución.", review: "Localización, recorrido, apertura y posible movimiento.", body: "Antes de definir preparación y materiales hay que valorar el estado y el posible origen del daño. Una reparación local no elimina por sí sola una causa general." },
  { need: "Desniveles en el pavimento", title: "Nivelación y recrecidos", image: screed, alt: "Preparación de una superficie para recrecido y nivelación", scope: "Corrección de desniveles y preparación del soporte.", review: "Planimetría requerida, cotas, cargas y espesor disponible.", body: "La solución depende del soporte existente, las tolerancias necesarias y el uso previsto. La ficha definitiva debe concretar sistema, espesor y condiciones de reapertura." },
  { need: "Superficies desgastadas", title: "Pulido y rehabilitación", image: polish, alt: "Trabajo de pulido sobre un pavimento industrial", scope: "Lijado, pulido y recuperación de superficies.", review: "Desgaste, acabado esperado, polvo y continuidad operativa.", body: "La intervención puede combinar preparación, reparaciones localizadas y tratamiento superficial. El acabado debe acordarse para cada actuación." },
  { need: "Revestimientos que retirar", title: "Retirada de revestimientos", image: inspection, alt: "Inspección previa a la retirada de un revestimiento", scope: "Retirada y preparación para una nueva solución.", review: "Sistema existente, adherencia, superficie y gestión de residuos.", body: "La inspección previa permite definir el método de retirada y la preparación necesaria sin atribuir prestaciones a un sistema todavía no seleccionado." },
];
const solutions = [
  { id: "repair", title: "Reparación de pavimentos", need: "Juntas deterioradas, fisuras y daños localizados.", photos: [
    { image: suppliedJoint, alt: "Detalle de una junta de dilatación en un pavimento de hormigón", supplied: true },
    { image: suppliedCrack, alt: "Fisura abierta con bordes deteriorados en un pavimento de hormigón", supplied: true },
    services[4], services[2]],
    items: ["Reparación de juntas", "Tratamiento de fisuras", "Parches de hormigón, según diagnóstico"], services: [services[0], services[1]],
    extra: "Los parches de hormigón pueden formar parte del alcance cuando el diagnóstico lo requiera." },
  { id: "level", title: "Nivelación y recrecidos", need: "Desniveles en el pavimento.", photos: [services[2], services[4], services[3], { image: hero, alt: "Pavimento de hormigón en una nave" }],
    items: ["Corrección de desniveles", "Recrecidos"], services: [services[2]], extra: null },
  { id: "renew", title: "Pulido y rehabilitación", need: "Superficies desgastadas que recuperar.", photos: [services[3], services[0], services[1], { image: hero, alt: "Superficie de hormigón en una nave" }],
    items: ["Lijado y pulido", "Recuperación de superficies desgastadas"], services: [services[3]], extra: null },
  { id: "prepare", title: "Retirada y preparación del soporte", need: "Revestimientos existentes que retirar.", photos: [
    { image: suppliedEpoxy, alt: "Desbastado de epoxi sobre un pavimento industrial azul", supplied: true },
    { image: suppliedAnchors, alt: "Huecos de anclajes retirados en un pavimento de hormigón", supplied: true },
    services[2], services[0]],
    items: ["Retirada de revestimientos", "Retirada de anclajes, según diagnóstico", "Preparación del soporte"], services: [services[4]],
    extra: "La retirada de anclajes puede formar parte del alcance cuando el diagnóstico lo requiera." },
];
const sectors = [
  { title: "Logística", image: logisticsSector, alt: "Pasillo de almacén con estanterías y contenedores de preparación de pedidos", body: "Almacenes, centros logísticos y zonas de carga." },
  { title: "Industria", image: industrySector, alt: "Detalle de una máquina mecanizando una pieza de metal", body: "Plantas de fabricación y áreas de producción." },
  { title: "Automoción", image: automotiveSector, alt: "Carrocería de automóvil rodeada de brazos robotizados", body: "Instalaciones del automóvil y sus componentes." },
  { title: "Distribución", image: distributionSector, alt: "Pasillo de una gran superficie con mercancías en estanterías y palés", body: "Grandes superficies y comercio mayorista." },
  { title: "Alimentación", image: foodSector, alt: "Depósitos de acero inoxidable en una planta de producción de bebidas", body: "Producción de alimentos y bebidas." },
  { title: "Aparcamientos", image: parkingSector, alt: "Aparcamiento cubierto con plazas y zona central de circulación", body: "Plazas, zonas de circulación y accesos de vehículos." },
];
const topics = [
  { title: "Juntas o fisuras: qué observar", image: cracks, body: "Tema propuesto: estado visible, localización y contexto del daño. No sustituye una valoración técnica." },
  { title: "Cómo preparar una consulta de rehabilitación", image: inspection, body: "Tema propuesto: describir el uso, la superficie aproximada, la actividad y los accesos." },
  { title: "Qué documentar en un antes y después", image: polish, body: "Tema propuesto: fotografías comparables, alcance y condiciones, sin atribuir resultados no acreditados." },
];

function firstSentence(text: string) {
  return text.trim().split(/(?<=[.!?])\s+/)[0] || "Sin dato";
}

function caseSummary(text: string, maximum = 120) {
  const complete = text.trim() || "Sin dato";
  if (complete.length <= maximum) return complete;
  const sentence = firstSentence(complete);
  if (sentence.length <= maximum) return sentence;
  const cut = sentence.slice(0, maximum + 1).replace(/\s+\S*$/, "").trim();
  return `${cut}…`;
}

function CompactProject({ project }: { project: PreviewProject }) {
  const cover = project.images.find(image => image.stage === "Resultado documentado") ?? project.images[0];
  const additionalImages = project.images.filter(image => image !== cover);
  return <article className="ar-project ar-project-compact">
    <div className="ar-case-overview">
      <h3>{project.name}</h3>
      <p className="ar-case-location">{project.city}, {project.country} · {project.sector}</p>
      {cover ? <figure className="ar-case-cover">
        <ResponsiveImage src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} loading="lazy" sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1000px) calc(100vw - 64px), 40vw" />
        <figcaption>{cover.stage}</figcaption>
      </figure> : <p className="ar-empty">Sin fotografías disponibles para esta selección.</p>}
      <div className="ar-case-summary">
        <p><strong>Problema</strong>{caseSummary(project.problem)}</p>
        <p><strong>Intervención</strong>{caseSummary(project.description)}</p>
        <p><strong>Resultado documentado</strong>{caseSummary(project.result)}</p>
      </div>
    </div>
    <ArchitectureCaseDetails name={`${project.name}, ${project.city}`}>
      <dl className="ar-case-readiness">
        {project.problem.trim() !== caseSummary(project.problem) && project.problem.trim() ? <div><dt>Problema completo</dt><dd>{project.problem}</dd></div> : null}
        {project.description.trim() !== caseSummary(project.description) && project.description.trim() ? <div><dt>Intervención completa</dt><dd>{project.description}</dd></div> : null}
        <div><dt>Superficie</dt><dd>{project.area !== null ? `${new Intl.NumberFormat("es-ES").format(project.area)} m² documentados` : "Sin superficie total confirmada"}</dd></div>
        <div><dt>Materiales documentados</dt><dd>{project.materials.filter(material => material.trim()).join(", ") || "Sin dato"}</dd></div>
        <div><dt>Duración documentada</dt><dd>{project.duration?.trim() || "Sin dato"}</dd></div>
        {project.result.trim() !== caseSummary(project.result) && project.result.trim() ? <div><dt>Resultado completo</dt><dd>{project.result}</dd></div> : null}
      </dl>
      {additionalImages.length > 0 ? <div className="ar-case-additional">{additionalImages.map(image => <figure key={image.stage}>
        <ResponsiveImage src={image.src} width={image.width} height={image.height} alt={image.alt} loading="lazy" sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1000px) calc(100vw - 64px), 40vw" />
        <figcaption>{image.stage}</figcaption>
      </figure>)}</div> : null}
      <p className="ar-note">Intervención anterior de integrantes del equipo.</p>
      {additionalImages.length > 0 ? <p className="ar-note">Encuadres distintos, no una comparación del mismo punto de vista.</p> : null}
    </ArchitectureCaseDetails>
  </article>;
}

export function ArchitectureHome({ projects, showEditorialPreview = false }: { projects: readonly PreviewProject[]; showEditorialPreview?: boolean }) {
  const navigationLinks = architectureLinks.filter(([, id]) => showEditorialPreview || id !== "blog");
  return <ArchitectureInquiryProvider><div className="ar-page ar-home" id="architecture">
    <a href="#ar-content" className="skip">Saltar al contenido</a>
    <header className="ar-header"><div className="ar-wrap ar-header-inner">
      <LogoMark brandName={brand.nombre} href="#architecture" homeLabel="inicio" className="ar-logo" />
      <nav className="ar-desktop-nav" aria-label="Navegación principal">{navigationLinks.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
      <a className="ar-language" href="#ar-languages" aria-label="Idiomas de la web vigente, español actual">ES</a>
      <a href="#contact" className="ar-button ar-header-cta">Consultar proyecto</a><ArchitectureMenu items={navigationLinks} />
    </div></header>
    <main id="ar-content" tabIndex={-1}>
      <p className="ar-preview-note">Vista privada · Propuesta en revisión</p>
<section className="ar-hero" aria-labelledby="ar-title">
        <ResponsiveImage className="ar-hero-image" src={architectureHall} {...getImageDimensions(architectureHall, { width: 1774, height: 887 })} alt="Imagen ilustrativa generada de una nave diáfana luminosa y su pavimento de hormigón" sizes="100vw" loading="eager" fetchPriority="high" />
        <div className="ar-wrap ar-hero-copy"><h1 id="ar-title">Reparación de<br />pavimentos industriales.</h1><p>Juntas, fisuras y rehabilitación de superficies.</p>
          <div className="ar-actions"><a className="ar-button" href="#contact">Consultar proyecto</a><a href="#projects">Ver proyectos</a></div>
        </div>
      </section>
      <p className="ar-wrap ar-hero-caption">Imagen ilustrativa generada. No corresponde a una obra acreditada.</p>
      <section id="services" className="ar-wrap ar-section ar-services">
        <div className="ar-section-heading"><h2>Cuatro soluciones para tu pavimento</h2><p className="ar-first-use">Elige según el daño visible o <a href="#contact">describe tu caso al contactar</a>. El alcance técnico se concreta después de revisar el soporte y el uso del espacio.</p></div>
        <div className="ar-solution-grid">{solutions.map(solution => <article className="ar-solution" id={`ar-solution-${solution.id}`} key={solution.id}>
          <div className="ar-solution-intro"><h3 className="ar-solution-heading" tabIndex={-1}>{solution.title}</h3><p className="ar-solution-need">{solution.need}</p></div>
          <figure className="ar-solution-gallery"><div className="ar-solution-photos">{solution.photos.map(photo => <ResponsiveImage key={photo.alt} src={photo.image} {...getImageDimensions(photo.image, { width: 860, height: 484 })} alt={"supplied" in photo && photo.supplied ? photo.alt : `Imagen ilustrativa: ${photo.alt}`} sizes="(max-width: 700px) 42vw, (max-width: 1400px) 21vw, 280px" />)}</div><figcaption>{solution.id === "repair" ? "Juntas y fisuras: fotografías aportadas. Las otras dos son ilustrativas." : solution.id === "prepare" ? "Epoxi y anclajes: fotografías aportadas. Las otras dos son ilustrativas." : "Imágenes ilustrativas; no acreditan obras realizadas."}</figcaption></figure>
          <ul className="ar-solution-services">{solution.items.map(item => <li key={item}>{item}</li>)}</ul>
          <details className="ar-solution-details" name="architecture-solutions"><summary aria-label={`Ver alcance técnico: ${solution.title}`}>Ver alcance técnico</summary>
            {solution.services.map(service => <div className="ar-solution-tech" key={service.title}><h4>{service.title}</h4><p>{service.scope}</p><dl className="ar-technical-facts"><div><dt>Qué revisar</dt><dd>{service.review}</dd></div><div><dt>Alcance</dt><dd>{service.body}</dd></div></dl></div>)}
            {solution.extra ? <p>{solution.extra}</p> : null}
          </details>
          <ArchitectureSolutionLink title={solution.title} />
        </article>)}</div>
      </section>
      <section id="projects" className="ar-wrap ar-section ar-projects">
        <div className="ar-section-heading"><h2>Experiencia del equipo</h2><div className="ar-experience-context"><p>Selección de intervenciones anteriores de integrantes del equipo.</p><p>{company.experience}</p></div></div>
        <div className="ar-case-grid">{projects.map(project => <CompactProject key={project.name} project={project} />)}</div>
        {projects.length === 0 ? <p className="ar-empty">No hay proyectos disponibles en esta selección. <a href="#contact">Consultar una necesidad concreta</a>.</p> : null}
        {projects.some(project => project.images.length > 0) ? <p className="ar-note">Fotografías del registro documental. Selección local en revisión.</p> : null}
      </section>
      <section id="sectors" className="ar-band ar-sectors-compact"><div className="ar-wrap">
        <div className="ar-sectors-heading"><h2>Sectores en los que trabajamos</h2><p>El uso, el tránsito y los accesos orientan la intervención.</p></div>
        <div className="ar-sector-gallery">{sectors.map(sector => <article key={sector.title}>
          <ResponsiveImage src={sector.image} {...getImageDimensions(sector.image, { width: 860, height: 484 })} alt={sector.alt} sizes="(max-width: 700px) 96px, 30vw" />
          <div><h3>{sector.title}</h3><p>{sector.body}</p></div>
        </article>)}</div>
        <p className="ar-note">Fotografías de referencia de los sectores; no corresponden a obras de Obraxen.</p>
      </div></section>
      <section className="ar-contact ar-section" id="contact"><div className="ar-wrap ar-contact-grid">
        <div className="ar-contact-heading"><h2 id="ar-contact-title" tabIndex={-1}>Cuéntanos tu proyecto</h2><p>Cuéntanos la localidad, el uso del espacio y el daño visible.</p>
          <div className="ar-contact-direct"><a className="ar-button" href={`mailto:${company.email}`}>Escribir por correo</a><a href={company.phoneHref}>Llamar al {company.phone}</a><a href={company.whatsappHref}>WhatsApp</a></div>
          <p className="ar-note">Teléfono y WhatsApp temporales. Consultas atendidas por dirección.</p>
        </div>
        <ArchitectureContact compact />
      </div></section>
      {showEditorialPreview ? <section id="blog" className="ar-blog-preview ar-band ar-section"><div className="ar-wrap"><h2>Blog · Revisión interna</h2><p className="ar-note">Temas propuestos · Artículos aún no publicados</p><div className="ar-three">
        {topics.map((topic) => <article key={topic.title}><ResponsiveImage src={topic.image} {...getImageDimensions(topic.image, { width: 860, height: 484 })} alt={`Imagen ilustrativa: ${topic.title}`} sizes="(max-width: 700px) 90vw, 23vw" /><h3>{topic.title}</h3><details><summary aria-label={`Ver tema propuesto: ${topic.title}`}>Ver tema propuesto</summary><p>{topic.body}</p></details></article>)}
      </div></div></section> : null}

    </main>
    <footer className="ar-footer"><div className="ar-wrap"><div className="ar-footer-grid">
      <div><div className="ar-footer-brand"><LogoMark brandName={brand.nombre} href="#architecture" homeLabel="inicio" className="ar-logo" /></div><p>Reparación y rehabilitación de pavimentos industriales.</p></div>
      <nav aria-label="Navegación del pie"><h2>Explorar</h2>{navigationLinks.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
      <nav aria-label="Soluciones del pie"><h2>Soluciones</h2>{solutions.map(solution => <a key={solution.id} href={`#ar-solution-${solution.id}`}>{solution.title}</a>)}</nav>
      <div><h2>Contacto</h2><a href={`mailto:${company.email}`}>{company.email}</a><a href={company.phoneHref}>{company.phone} (temporal)</a><a href={company.whatsappHref}>WhatsApp (temporal)</a><a href="#contact">Revisar una consulta</a></div>
    </div><div className="ar-footer-bottom"><nav aria-label="Información legal"><a href={getPath("es", "legalNotice")}>Aviso legal</a><a href={getPath("es", "privacy")}>Privacidad</a><a href={getPath("es", "cookies")}>Cookies</a></nav>
      <div className="ar-language-links"><p id="ar-language-notice">Idiomas de la web vigente · Saldrás de esta propuesta.</p><nav id="ar-languages" aria-label="Idiomas de la web vigente" aria-describedby="ar-language-notice">{locales.map((locale) => <a key={locale} href={getPath(locale, "home")} hrefLang={locale} lang={locale}>{locale.toUpperCase()}</a>)}</nav></div>
    </div><p className="ar-note">{company.legalName} · NIF {company.taxId}<br />{company.address}</p><p className="ar-note">El hero, parte de las soluciones, sectores y Blog utilizan imágenes ilustrativas, no acreditan obras realizadas. Las fotografías aportadas se identifican en sus soluciones. Preview privada en español; idiomas y enlaces legales abren las versiones vigentes. No publicado.</p><a className="ar-editorial-link" href={showEditorialPreview ? "?review=client#architecture" : "?review=editorial#blog"}>{showEditorialPreview ? "Volver al recorrido para clientes" : "Revisión editorial interna"}</a></div></footer>
  </div></ArchitectureInquiryProvider>;
}
