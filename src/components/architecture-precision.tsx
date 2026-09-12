import Link from "next/link";
import { brand } from "@/lib/brand";
import { architectureCompany as company } from "@/lib/architecture-content";
import { getPath, locales } from "@/lib/i18n";
import { ArchitectureContact } from "./architecture-controls";
import { ArchitectureMenu } from "./architecture-interactions";
import { LogoMark } from "./logo-mark";
import { ResponsiveImage } from "./responsive-image";

type ProjectImage = { src: string; alt: string; stage: string; width: number; height: number };
export type PrecisionProject = {
  name: string; city: string; country: string; sector: string; area: number | null;
  description: string; problem: string; result: string; duration: string | null;
  materials: readonly string[]; images: readonly ProjectImage[];
};
const navigation = [["Experiencia", "projects"], ["Servicios", "services"], ["Proceso", "start"]] as const;
const services = [
  { need: "Juntas deterioradas", title: "Reparación de juntas", scope: "Saneado, reconstrucción y sellado de juntas.", review: "Estado de los bordes, apertura, tránsito y soporte.", body: "La solución se delimita después de revisar el daño y las condiciones de uso. El trabajo por fases depende de los accesos y de la seguridad de la instalación." },
  { need: "Fisuras visibles", title: "Tratamiento de fisuras", scope: "Tratamiento según origen, geometría y evolución.", review: "Localización, recorrido, apertura y posible movimiento.", body: "Antes de definir preparación y materiales hay que valorar el estado y el posible origen del daño. Una reparación local no elimina por sí sola una causa general." },
  { need: "Desniveles", title: "Nivelación y recrecidos", scope: "Corrección de desniveles y preparación del soporte.", review: "Planimetría requerida, cotas, cargas y espesor disponible.", body: "La solución depende del soporte existente, las tolerancias necesarias y el uso previsto. La ficha definitiva debe concretar sistema, espesor y condiciones de reapertura." },
  { need: "Superficies desgastadas", title: "Pulido y rehabilitación", scope: "Lijado, pulido y recuperación de superficies.", review: "Desgaste, acabado esperado, polvo y continuidad operativa.", body: "La intervención puede combinar preparación, reparaciones localizadas y tratamiento superficial. El acabado debe acordarse para cada actuación." },
  { need: "Revestimientos que retirar", title: "Retirada de revestimientos", scope: "Retirada y preparación para una nueva solución.", review: "Sistema existente, adherencia, superficie y gestión de residuos.", body: "La inspección previa permite definir el método de retirada y la preparación necesaria sin atribuir prestaciones a un sistema todavía no seleccionado." },
];
const sectors = [
  ["Logística", "Tránsito, accesos y zonas de carga."],
  ["Industria", "Actividad de la instalación y posibilidad de delimitar zonas."],
  ["Edificación", "Uso previsto, soporte existente y entrega acordada."],
] as const;

function Arrow({ down = false }: { down?: boolean }) {
  return <svg className={down ? "ap-arrow ap-arrow-down" : "ap-arrow"} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

function ProjectDetails({ project }: { project: PrecisionProject }) {
  return <details className="ap-case-details"><summary>Consultar registro de {project.name}<span className="ap-plus" aria-hidden="true" /></summary>
    <dl><div><dt>Superficie total</dt><dd>{project.area === null ? "Sin superficie total confirmada" : `${new Intl.NumberFormat("es-ES").format(project.area)} m² documentados`}</dd></div>
      <div><dt>Materiales documentados</dt><dd>{project.materials.filter(item => item.trim()).join(", ") || "Sin dato"}</dd></div>
      <div><dt>Duración documentada</dt><dd>{project.duration?.trim() || "Sin dato"}</dd></div>
      <div><dt>Resultado completo</dt><dd>{project.result.trim() || "Sin dato"}</dd></div></dl>
  </details>;
}

function ProjectCase({ project, featured }: { project: PrecisionProject; featured: boolean }) {
  const initial = project.images.find(image => image.stage === "Estado inicial");
  const result = project.images.find(image => image.stage === "Resultado documentado");
  return <article className={`ap-case${featured ? " ap-case-featured" : ""}`}>
    <header className="ap-case-heading"><h3>{project.name}<span>{project.city}, {project.country}</span></h3><p>{project.sector}</p></header>
    <div className="ap-case-photos">
      {[result, initial].filter((image): image is ProjectImage => Boolean(image)).map(image => <figure key={image.stage}>
        <ResponsiveImage src={image.src} alt={image.alt} width={image.width} height={image.height} unoptimized loading="lazy" />
        <figcaption>{image.stage}</figcaption>
      </figure>)}
      {project.images.length === 0 ? <p>Sin fotografías disponibles para esta selección.</p> : null}
    </div>
    <div className="ap-case-story"><p><strong>El punto de partida</strong>{project.problem.trim() || "Sin dato"}</p><p><strong>La intervención</strong>{project.description.trim() || "Sin dato"}</p></div>
    <ProjectDetails project={project} />
  </article>;
}

export function ArchitecturePrecision({ projects }: { projects: readonly PrecisionProject[] }) {
  const hero = projects[0]?.images.find(image => image.stage === "Resultado documentado");
  const phoneHref = brand.telefono ? `tel:${brand.telefono.replace(/[^+\d]/g, "")}` : null;
  const whatsappHref = brand.whatsapp ? `https://wa.me/${brand.whatsapp.replace(/\D/g, "")}` : null;
  const hasDirectContact = Boolean(brand.email || phoneHref || whatsappHref);
  return <div className="ap-page" id="precision">
    <a href="#ap-content" className="skip">Saltar al contenido</a>
    <div className="ap-preview"><div className="ap-wrap"><span>Alternativa local · No publicada</span><Link prefetch={false} href="/es/architecture-preview/">Versión anterior <Arrow /></Link></div></div>
    <header className="ap-header"><div className="ap-wrap ap-header-inner">
      <LogoMark brandName={brand.nombre} href="#precision" homeLabel="inicio" className="ap-logo" />
      <nav className="ap-desktop-nav" aria-label="Navegación principal">{navigation.map(([label, id]) => <a href={`#${id}`} key={id}>{label}</a>)}</nav>
      <a className="ap-header-contact" href="#contact">Hablemos del proyecto <Arrow /></a>
      <ArchitectureMenu items={navigation} />
    </div></header>
    <main id="ap-content">
      <section className="ap-hero" aria-labelledby="ap-title">
        <div className="ap-wrap ap-hero-heading"><div><p className="ap-eyebrow">Reparación y rehabilitación</p><h1 id="ap-title">Pavimentos<br />industriales.</h1></div><div className="ap-hero-intro"><p>Juntas, fisuras y superficies desgastadas. La intervención empieza por entender el soporte y su uso.</p><a href="#contact" className="ap-button">Consultar proyecto <Arrow /></a></div></div>
        {hero ? <figure className="ap-hero-photo ap-wrap"><ResponsiveImage src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} unoptimized loading="eager" fetchPriority="high" /><figcaption><span>{projects[0].name} · {projects[0].city}<small>Resultado documentado · Experiencia anterior del equipo</small></span><a href="#projects">Conocer la intervención <Arrow down /></a></figcaption></figure> : <p className="ap-wrap">Sin fotografía documental disponible.</p>}
      </section>

      <section className="ap-wrap ap-section ap-projects" id="projects" aria-labelledby="ap-projects-title">
        <div className="ap-section-heading"><h2 id="ap-projects-title">El trabajo,<br />sobre el terreno.</h2><div><p>Selección de intervenciones anteriores de integrantes del equipo.</p><p className="ap-note">{company.experience}</p></div></div>
        {projects.map((project, index) => <ProjectCase key={project.name} project={project} featured={index === 0} />)}
        {projects.length === 0 ? <p>No hay proyectos disponibles en esta selección. Puedes consultar una necesidad concreta en el apartado de contacto.</p> : <p className="ap-note ap-photo-note">Fotografías del registro documental. Los encuadres son distintos: no representan una comparación del mismo punto de vista. Selección local en revisión.</p>}
      </section>

      <section className="ap-services ap-section" id="services" aria-labelledby="ap-services-title"><div className="ap-wrap">
        <div className="ap-section-heading"><h2 id="ap-services-title">¿Qué necesita<br />tu pavimento?</h2><p>Parte del daño visible. Abre una necesidad para ver qué revisar y cómo se delimita la intervención.</p></div>
        <div className="ap-service-list">{services.map((service, index) => <details className="ap-service" name="precision-services" id={`ap-service-${index + 1}`} key={service.title}>
          <summary><h3>{service.need}</h3><span className="ap-service-method">{service.title}</span><span className="ap-plus" aria-hidden="true" /></summary>
          <div className="ap-service-body"><p className="ap-service-scope">{service.scope}</p><div><dl><div><dt>Qué revisar</dt><dd>{service.review}</dd></div><div><dt>Alcance</dt><dd>{service.body}</dd></div></dl><a href="#contact" className="ap-text-link">Consultar esta necesidad <Arrow /></a></div></div>
        </details>)}</div>
        <p className="ap-preparation">Parches de hormigón y retirada de anclajes pueden formar parte del alcance cuando el diagnóstico lo requiera.</p>
        <div className="ap-sectors" id="sectors"><h3>El uso también<br />define la solución.</h3><dl>{sectors.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl></div>
        <p className="ap-note ap-sector-note">También valoramos consultas para aparcamientos, centros de datos y otros espacios técnicos, según el soporte y las condiciones de uso.</p>
      </div></section>

      <section className="ap-wrap ap-section ap-process" id="start" aria-labelledby="ap-process-title"><div className="ap-section-heading"><h2 id="ap-process-title">Antes de intervenir,<br />entender.</h2><p>Primero reunimos el contexto necesario. Después definimos el siguiente paso técnico.</p></div>
        <ol><li><h3>Cuéntanos la necesidad</h3><p>Localidad, uso del espacio y daño visible. Incluye fotografías y superficie aproximada si dispones de ellas.</p></li><li><h3>Revisamos el contexto</h3><p>El siguiente paso depende de los datos y comprobaciones necesarios.</p></li><li><h3>Delimitamos el alcance</h3><p>Concretar la actuación requiere conocer las condiciones de la instalación, los accesos y la actividad.</p></li></ol>
      </section>

      <section className="ap-contact ap-section" id="contact" aria-labelledby="ap-contact-title"><div className="ap-wrap">
        <div className="ap-contact-heading"><h2 id="ap-contact-title">Hablemos de<br />tu superficie.</h2><div><p>{company.response ?? "El plazo de respuesta se definirá cuando los canales de contacto estén validados."}</p><p>Cuéntanos dónde está, cómo se utiliza y qué necesitas revisar.</p></div></div>
        {brand.email ? <a href={`mailto:${brand.email}`} className="ap-email">{brand.email}<Arrow /></a> : <p className="ap-note">Correo de contacto pendiente de validación.</p>}
        <div className="ap-contact-meta"><div>{brand.telefono && phoneHref ? <a href={phoneHref}>{brand.telefono}</a> : null}{whatsappHref ? <a href={whatsappHref}>WhatsApp <Arrow /></a> : null}<p>{hasDirectContact ? <>Teléfono y WhatsApp temporales.<br />Consultas atendidas por dirección.</> : "Contacto directo pendiente de validación."}</p></div><div><p>Atención comercial en {company.languages.toLowerCase()}.</p><p>{company.priority}</p></div></div>
        <details className="ap-demo"><summary>Probar el formulario de demostración<span>Sin envío ni almacenamiento</span><span className="ap-plus" aria-hidden="true" /></summary><ArchitectureContact /></details>
      </div></section>
    </main>
    <footer className="ap-footer ap-wrap"><div className="ap-footer-main"><LogoMark brandName={brand.nombre} href="#precision" homeLabel="inicio" className="ap-logo" />{brand.nombreLegal || brand.cif || brand.direccion ? <p>{brand.nombreLegal}{brand.cif ? <><br />NIF {brand.cif}</> : null}{brand.direccion ? <><br />{brand.direccion}</> : null}</p> : <p>Identidad legal pendiente de validación.</p>}<nav aria-label="Información legal"><a href={getPath("es", "legalNotice")}>Aviso legal</a><a href={getPath("es", "privacy")}>Privacidad</a><a href={getPath("es", "cookies")}>Cookies</a></nav></div><div className="ap-footer-bottom"><p>Preview privada en español. Los enlaces legales e idiomas abren las versiones vigentes.</p><nav aria-label="Idiomas de la web vigente">{locales.map(locale => <a key={locale} href={getPath(locale, "home")} hrefLang={locale} lang={locale}>{locale.toUpperCase()}</a>)}</nav></div></footer>
  </div>;
}
