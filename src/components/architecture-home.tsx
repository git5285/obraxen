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
import temporaryRepairJoint from "../../img/temporary/repair-joint-pexels-14535071.jpg";
import temporaryRepairCrack from "../../img/temporary/repair-crack-pexels-14887766.jpg";
import temporaryLevelSmoothing from "../../img/temporary/level-smoothing-pexels-37121407.jpg";
import temporaryLevelTrowel from "../../img/temporary/level-trowel-pexels-2219024.jpg";
import temporaryLevelSpreading from "../../img/temporary/level-spreading-pexels-19913288.jpg";
import temporaryLevelLaser from "../../img/temporary/level-laser-pexels-6473976.jpg";
import temporaryRenewWarehouse from "../../img/temporary/renew-warehouse-pexels-36217325.jpg";
import temporaryRenewFloor from "../../img/temporary/hero-floor-pexels-36230779.jpg";
import temporaryRenewLogistics from "../../img/temporary/renew-logistics-pexels-221047.jpg";
import temporaryRenewPolished from "../../img/temporary/renew-polished-pexels-29482812.jpg";
import temporaryRenewReflective from "../../img/temporary/renew-reflective-pexels-31272229.jpg";
import temporaryPrepareGrinding from "../../img/temporary/prepare-grinding-pexels-20872013.jpg";
import temporaryPreparePriming from "../../img/temporary/prepare-priming-pexels-5777354.jpg";
import { brand } from "@/lib/brand";
import { architectureCompany as company } from "@/lib/architecture-content";
import { resolveContactConfig } from "@/lib/contact";
import { getDictionary, getPath, locales } from "@/lib/i18n";
import { getImageDimensions } from "@/lib/homepage";
import { ArchitectureContact, ArchitectureInquiryProvider, ArchitectureSolutionLink } from "./architecture-controls";
import { ArchitectureCaseDetails, ArchitectureLanguage, ArchitectureMenu } from "./architecture-interactions";
import { ContactForm } from "./contact-form";
import { LogoMark } from "./logo-mark";
import { ResponsiveImage } from "./responsive-image";

type PreviewProject = { name: string; city: string; country: string; sector: string; area: number | null; description: string; problem: string; result: string; duration: string | null; materials: readonly string[]; images: readonly { src: string; alt: string; stage: string; width: number; height: number }[] };
const architectureLinks = [["Soluciones", "/es/soluciones/"], ["Proyectos", "#projects"], ["Sectores", "#sectors"], ["Blog", "#blog"]] as const;
const languageNames = { es: "Español", en: "English", de: "Deutsch", fr: "Français" };
// Do not offer legacy homepages as translations of the current prototype.
const architectureLanguages = locales.map(code => ({ code, label: languageNames[code], href: code === "es" ? getPath(code, "home") : null }));
const services = [
  { need: "Juntas deterioradas", title: "Reparación de juntas", image: joints, alt: "Inspección de una junta en un pavimento industrial", scope: "Saneado, reconstrucción y sellado de juntas.", review: "Estado de los bordes, apertura, tránsito y soporte.", body: "La solución se delimita después de revisar el daño y las condiciones de uso. El trabajo por fases depende de los accesos y de la seguridad de la instalación." },
  { need: "Fisuras visibles", title: "Tratamiento de fisuras", image: cracks, alt: "Detalle de una fisura en hormigón", scope: "Tratamiento según origen, geometría y evolución.", review: "Localización, recorrido, apertura y posible movimiento.", body: "Antes de definir preparación y materiales hay que valorar el estado y el posible origen del daño. Una reparación local no elimina por sí sola una causa general." },
  { need: "Desniveles en el pavimento", title: "Nivelación y recrecidos", image: screed, alt: "Preparación de una superficie para recrecido y nivelación", scope: "Corrección de desniveles y preparación del soporte.", review: "Planimetría requerida, cotas, cargas y espesor disponible.", body: "La solución depende del soporte existente, las tolerancias necesarias y el uso previsto. La ficha definitiva debe concretar sistema, espesor y condiciones de reapertura." },
  { need: "Superficies desgastadas", title: "Pulido y rehabilitación", image: polish, alt: "Trabajo de pulido sobre un pavimento industrial", scope: "Lijado, pulido y recuperación de superficies.", review: "Desgaste, acabado esperado, polvo y continuidad operativa.", body: "La intervención puede combinar preparación, reparaciones localizadas y tratamiento superficial. El acabado debe acordarse para cada actuación." },
  { need: "Revestimientos que retirar", title: "Retirada de revestimientos", image: inspection, alt: "Inspección previa a la retirada de un revestimiento", scope: "Retirada y preparación para una nueva solución.", review: "Sistema existente, adherencia, superficie y gestión de residuos.", body: "La inspección previa permite definir el método de retirada y la preparación necesaria sin atribuir prestaciones a un sistema todavía no seleccionado." },
];

const solutions = [
  { id: "repair", title: "Reparación de pavimentos", need: "Juntas deterioradas, fisuras y daños localizados.", photos: [
    { image: suppliedJoint, alt: "Junta de dilatación deteriorada en un pavimento de hormigón" },
    { image: suppliedCrack, alt: "Fisura abierta con bordes deteriorados en un pavimento de hormigón" },
    { image: temporaryRepairJoint, alt: "Junta longitudinal abierta sobre una superficie de hormigón" },
    { image: temporaryRepairCrack, alt: "Grieta con pérdida de material en una losa de hormigón" }],
    items: ["Reparación de juntas", "Tratamiento de fisuras", "Parches de hormigón, según diagnóstico"], services: [services[0], services[1]],
    extra: "Los parches de hormigón pueden formar parte del alcance cuando el diagnóstico lo requiera." },
  { id: "renew", title: "Pulido y rehabilitación", need: "Superficies desgastadas que recuperar.", photos: [
    { image: temporaryRenewWarehouse, alt: "Pavimento continuo en una nave industrial" },
    { image: temporaryRenewFloor, alt: "Superficie continua de hormigón en una nave diáfana" },
    { image: temporaryRenewPolished, alt: "Pavimento pulido entre pilares de acero" },
    { image: temporaryRenewReflective, alt: "Superficie pulida con acabado reflectante" }],
    items: ["Lijado y pulido", "Recuperación de superficies desgastadas"], services: [services[3]], extra: null },
  { id: "level", title: "Nivelación y recrecidos", need: "Desniveles en el pavimento.", photos: [
    { image: temporaryLevelSmoothing, alt: "Equipo extendiendo y nivelando hormigón fresco" },
    { image: temporaryLevelTrowel, alt: "Regleado manual de una superficie de hormigón fresco" },
    { image: temporaryLevelSpreading, alt: "Operario distribuyendo hormigón antes de nivelarlo" },
    { image: temporaryLevelLaser, alt: "Nivel láser proyectado sobre un pavimento" }],
    items: ["Corrección de desniveles", "Recrecidos"], services: [services[2]], extra: null },
  { id: "prepare", title: "Retirada y preparación del soporte", need: "Revestimientos existentes que retirar.", photos: [
    { image: suppliedEpoxy, alt: "Desbastado de epoxi sobre un pavimento industrial azul" },
    { image: suppliedAnchors, alt: "Huecos de anclajes retirados en un pavimento de hormigón" },
    { image: temporaryPrepareGrinding, alt: "Corte y preparación mecánica de una superficie industrial" },
    { image: temporaryPreparePriming, alt: "Aplicación de una imprimación sobre una superficie de hormigón" }],
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
  const area = project.area !== null ? `${new Intl.NumberFormat("es-ES").format(project.area)} m²` : "Sin dato";
  const duration = project.duration?.trim() || "Sin dato";
  return <article className="ar-project ar-project-compact">
    <div className="ar-case-overview">
      <h3>{project.name}</h3>
      <p className="ar-case-location">{project.city}, {project.country} · {project.sector}</p>
      <p className="ar-case-attribution">Intervención anterior de integrantes del equipo.</p>
      {cover ? <figure className="ar-case-cover">
        <ResponsiveImage src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} loading="lazy" sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1100px) calc((100vw - 96px) / 2), (max-width: 1360px) calc((100vw - 144px) / 2), 608px" />
      </figure> : <p className="ar-empty">Sin fotografías disponibles para esta selección.</p>}
      <p className="ar-case-proof-label">Resultado documentado</p>
      <dl className="ar-case-metrics">
        <div><dt>Superficie</dt><dd>{area}</dd></div>
        <div><dt>Duración</dt><dd>{duration}</dd></div>
        <div className="ar-case-metric-wide"><dt>Intervención</dt><dd>{caseSummary(project.description, 72)}</dd></div>
      </dl>
      <div className="ar-case-summary">
        <p className="ar-case-result"><strong>Resultado</strong>{caseSummary(project.result)}</p>
      </div>
    </div>
    <ArchitectureCaseDetails name={`${project.name}, ${project.city}`}>
      <dl className="ar-case-readiness">
        <div><dt>Problema</dt><dd>{project.problem.trim() || "Sin dato"}</dd></div>
        <div><dt>Intervención</dt><dd>{project.description.trim() || "Sin dato"}</dd></div>
        <div><dt>Superficie</dt><dd>{project.area !== null ? `${new Intl.NumberFormat("es-ES").format(project.area)} m² documentados` : "Sin superficie total confirmada"}</dd></div>
        <div><dt>Materiales documentados</dt><dd>{project.materials.filter(material => material.trim()).join(", ") || "Sin dato"}</dd></div>
        <div><dt>Duración documentada</dt><dd>{project.duration?.trim() || "Sin dato"}</dd></div>
        <div><dt>Resultado documentado</dt><dd>{project.result.trim() || "Sin dato"}</dd></div>
      </dl>
      {additionalImages.length > 0 ? <div className="ar-case-additional">{additionalImages.map(image => <figure key={image.stage}>
        <ResponsiveImage src={image.src} width={image.width} height={image.height} alt={image.alt} loading="lazy" sizes="(max-width: 700px) calc(100vw - 44px), (max-width: 1100px) calc((100vw - 96px) / 2), (max-width: 1360px) calc((100vw - 144px) / 2), 608px" />
        <figcaption>{image.stage}</figcaption>
      </figure>)}</div> : null}
      {additionalImages.length > 0 ? <p className="ar-note">Encuadres distintos, no una comparación del mismo punto de vista.</p> : null}
    </ArchitectureCaseDetails>
  </article>;
}

export function ArchitectureHome({ projects, showEditorialPreview = false }: { projects: readonly PreviewProject[]; showEditorialPreview?: boolean }) {
  const navigationLinks = architectureLinks.filter(([, href]) => showEditorialPreview || href !== "#blog");
  const contact = getDictionary("es").contact;
  const contactEnabled = resolveContactConfig(process.env).enabled;
  return <ArchitectureInquiryProvider><div className="ar-page ar-home" id="architecture">
    <a href="#ar-content" className="skip">Saltar al contenido</a>
    <header className="ar-header"><div className="ar-wrap ar-header-inner">
      <LogoMark brandName={brand.nombre} href="#architecture" homeLabel="inicio" className="ar-logo" />
      <nav className="ar-desktop-nav" aria-label="Navegación principal">{navigationLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <ArchitectureLanguage languages={architectureLanguages} />
      <a href="#contact" className="ar-button ar-header-cta">Cuéntanos tu caso</a><ArchitectureMenu items={navigationLinks} />
    </div></header>
    <main id="ar-content" tabIndex={-1}>
<section className="ar-hero" aria-labelledby="ar-title">
        <ResponsiveImage className="ar-hero-image" src={temporaryRenewLogistics} {...getImageDimensions(temporaryRenewLogistics, { width: 960, height: 640 })} alt="Pavimento industrial en una nave logística" sizes="100vw" loading="eager" fetchPriority="high" />
        <div className="ar-wrap ar-hero-copy"><h1 id="ar-title">Reparación de<br />pavimentos industriales.</h1><p>Cuéntanos el daño visible. Revisamos soporte y uso antes de concretar el alcance.</p>
          <div className="ar-actions"><a className="ar-button" href="#contact">Cuéntanos tu caso</a><a href="#projects">Ver proyectos</a></div>
        </div>
      </section>
      <section id="services" className="ar-wrap ar-section ar-services">
        <div className="ar-section-heading"><h2>Soluciones</h2></div>
        <div className="ar-solution-grid">{solutions.map(solution => <article className="ar-solution" id={`ar-solution-${solution.id}`} key={solution.id}>
          <div className="ar-solution-intro"><h3 className="ar-solution-heading" tabIndex={-1}>{solution.title}</h3></div>
          <div className="ar-solution-gallery"><div className="ar-solution-photos">{solution.photos.map((photo, index) => <div className="ar-solution-photo" key={`${photo.alt}-${index}`}>
            <ResponsiveImage src={photo.image} {...getImageDimensions(photo.image, { width: 860, height: 484 })} alt={photo.alt} sizes="(max-width: 700px) calc((100vw - 88px) / 2), (max-width: 1100px) calc((100vw - 184px) / 4), (max-width: 1360px) calc((100vw - 248px) / 4), 278px" />
          </div>)}</div></div>
          <ul className="ar-solution-services">{solution.items.map(item => <li key={item}>{item}</li>)}</ul>
          <details className="ar-solution-details"><summary aria-label={`Ver servicios y alcance: ${solution.title}`}>Ver servicios y alcance</summary>
            {solution.services.map(service => <div className="ar-solution-tech" key={service.title}><h4>{service.title}</h4><p>{service.scope}</p><dl className="ar-technical-facts"><div><dt>Qué revisar</dt><dd>{service.review}</dd></div><div><dt>Alcance</dt><dd>{service.body}</dd></div></dl></div>)}
            {solution.extra ? <p>{solution.extra}</p> : null}
          </details>
          <ArchitectureSolutionLink title={solution.title} href="#contact" />
        </article>)}</div>
      </section>
      <section id="projects" className="ar-wrap ar-section ar-projects">
        <div className="ar-section-heading"><h2>Proyectos</h2></div>
        <div className="ar-case-grid">{projects.map(project => <CompactProject key={project.name} project={project} />)}</div>
        {projects.length === 0 ? <p className="ar-empty">No hay proyectos disponibles en esta selección. <a href="#contact">Cuéntanos tu caso</a>.</p> : null}
        {projects.some(project => project.images.length > 0) ? <p className="ar-note">Fotografías del registro documental.</p> : null}
      </section>
      <section id="sectors" className="ar-band ar-sectors-compact"><div className="ar-wrap">
        <div className="ar-sectors-heading"><h2>Sectores en los que trabajamos</h2></div>
        <div className="ar-sector-gallery">{sectors.map(sector => <article key={sector.title}>
          <ResponsiveImage src={sector.image} {...getImageDimensions(sector.image, { width: 860, height: 484 })} alt={sector.alt} sizes="(max-width: 700px) 96px, (max-width: 1100px) calc((100vw - 112px) / 3), (max-width: 1360px) calc((100vw - 176px) / 3), 395px" />
          <div><h3>{sector.title}</h3><p>{sector.body}</p></div>
        </article>)}</div>
      </div></section>
      <section className="ar-contact ar-section" id="contact" aria-label="Contacto"><div className="ar-wrap ar-contact-grid">
        <h2 id="ar-contact-title" tabIndex={-1}>Cuéntanos tu caso</h2>
        {contactEnabled ? <div className="ar-contact-form"><ContactForm locale="es" copy={contact} privacyUrl={getPath("es", "privacy")} /></div> : <ArchitectureContact compact />}
        {contactEnabled && (company.phone && company.phoneHref || company.whatsappHref) ? <div className="ar-contact-direct" aria-label="Contacto directo alternativo"><p>¿Prefieres hablar directamente?</p>{company.phone && company.phoneHref ? <a href={company.phoneHref}>Llamar al {company.phone}</a> : null}{company.whatsappHref ? <a href={company.whatsappHref}>Abrir WhatsApp</a> : null}</div> : null}
      </div></section>
      {showEditorialPreview ? <section id="blog" className="ar-blog-preview ar-band ar-section"><div className="ar-wrap"><h2>Blog · Revisión interna</h2><p className="ar-note">Temas propuestos · Artículos aún no publicados</p><div className="ar-three">
        {topics.map((topic) => <article key={topic.title}><ResponsiveImage src={topic.image} {...getImageDimensions(topic.image, { width: 860, height: 484 })} alt={`Imagen ilustrativa: ${topic.title}`} sizes="(max-width: 700px) 90vw, 23vw" /><h3>{topic.title}</h3><details><summary aria-label={`Ver tema propuesto: ${topic.title}`}>Ver tema propuesto</summary><p>{topic.body}</p></details></article>)}
      </div></div></section> : null}

    </main>
    <footer className="ar-footer"><div className="ar-wrap"><div className="ar-footer-grid">
      <div><div className="ar-footer-brand"><LogoMark brandName={brand.nombre} href="#architecture" homeLabel="inicio" className="ar-logo" /></div><p>Reparación y rehabilitación de pavimentos industriales.</p></div>
      <nav aria-label="Navegación del pie"><h2>Explorar</h2>{navigationLinks.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <nav aria-label="Soluciones del pie"><h2>Soluciones</h2>{solutions.map(solution => <a key={solution.id} href={`#ar-solution-${solution.id}`}>{solution.title}</a>)}</nav>
      <div><h2>Contacto</h2>{company.email ? <a href={`mailto:${company.email}`}>{company.email}</a> : null}{company.phone && company.phoneHref ? <a href={company.phoneHref}>{company.phone}</a> : null}{company.whatsappHref ? <a href={company.whatsappHref}>WhatsApp</a> : null}<a href="#contact">Cuéntanos tu caso</a></div>
    </div><div className="ar-footer-bottom"><nav aria-label="Información legal"><a href={getPath("es", "legalNotice")}>Aviso legal</a><a href={getPath("es", "privacy")}>Privacidad</a><a href={getPath("es", "cookies")}>Cookies</a></nav>
      <div className="ar-language-links"><p id="ar-language-notice">Idiomas disponibles en esta propuesta.</p><nav id="ar-languages" aria-label="Idiomas disponibles" aria-describedby="ar-language-notice">{architectureLanguages.filter(language => language.href).map(language => <a key={language.code} href={language.href!} hrefLang={language.code} lang={language.code} aria-label={language.label} aria-current="page">{language.code.toUpperCase()}</a>)}</nav><span className="ar-note">Otros idiomas no disponibles.</span></div>
    </div>{company.legalName || company.taxId || company.address ? <p className="ar-note">{company.legalName ?? ""}{company.taxId ? <> · NIF {company.taxId}</> : null}<br />{company.address ?? ""}</p> : null}{showEditorialPreview ? <a className="ar-editorial-link" href="?review=client#architecture">Volver al recorrido para clientes</a> : null}</div></footer>
  </div></ArchitectureInquiryProvider>;
}
