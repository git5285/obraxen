import Link from "next/link";
import suppliedAnchors from "../../img/solutions/extraccion-anclajes-2015.jpg";
import suppliedCrack from "../../img/solutions/fisura-2060.jpg";
import suppliedEpoxy from "../../img/solutions/desbastado-epoxi-2067.jpg";
import suppliedJoint from "../../img/solutions/junta-dilatacion-2089.jpg";
import temporaryLevelLaser from "../../img/temporary/level-laser-pexels-6473976.jpg";
import temporaryLevelSmoothing from "../../img/temporary/level-smoothing-pexels-37121407.jpg";
import temporaryLevelSpreading from "../../img/temporary/level-spreading-pexels-19913288.jpg";
import temporaryLevelTrowel from "../../img/temporary/level-trowel-pexels-2219024.jpg";
import temporaryPrepareGrinding from "../../img/temporary/prepare-grinding-pexels-20872013.jpg";
import temporaryPreparePriming from "../../img/temporary/prepare-priming-pexels-5777354.jpg";
import temporaryRenewFloor from "../../img/temporary/hero-floor-pexels-36230779.jpg";
import temporaryRenewLogistics from "../../img/temporary/renew-logistics-pexels-221047.jpg";
import temporaryRenewPolished from "../../img/temporary/renew-polished-pexels-29482812.jpg";
import temporaryRenewReflective from "../../img/temporary/renew-reflective-pexels-31272229.jpg";
import temporaryRenewWarehouse from "../../img/temporary/renew-warehouse-pexels-36217325.jpg";
import temporaryRepairCrack from "../../img/temporary/repair-crack-pexels-14887766.jpg";
import temporaryRepairJoint from "../../img/temporary/repair-joint-pexels-14535071.jpg";
import { brand } from "@/lib/brand";
import { architectureCompany as company } from "@/lib/architecture-content";
import { getImageDimensions } from "@/lib/media";
import { getPath, locales } from "@/lib/i18n";
import { ArchitectureContact, ArchitectureInquiryProvider, ArchitectureSolutionLink } from "./architecture-controls";
import { ArchitectureLanguage, ArchitectureMenu } from "./architecture-interactions";
import { LogoMark } from "./logo-mark";
import { ResponsiveImage } from "./responsive-image";

const languageNames = { es: "Español", en: "English", de: "Deutsch", fr: "Français" };
const languages = locales.map((code) => ({
  code,
  label: languageNames[code],
  href: code === "es" ? "/es/soluciones/" : null,
}));

const navigation = [
  ["Inicio", "/es/"],
  ["Soluciones", "#soluciones"],
  ["Proyectos", "/es/#projects"],
  ["Contacto", "#contact"],
] as const;

const solutions = [
  {
    id: "repair",
    title: "Reparación de pavimentos",
    intro: "Juntas, fisuras y daños localizados que requieren delimitar el alcance antes de intervenir.",
    services: ["Reparación de juntas", "Tratamiento de fisuras", "Parches de hormigón, según diagnóstico"],
    review: "Estado de los bordes, apertura, recorrido del daño, tránsito y soporte.",
    scope: "El trabajo se concreta tras revisar el daño y las condiciones de uso. Una reparación local no elimina por sí sola una causa general.",
    photos: [
      { image: suppliedJoint, alt: "Junta de dilatación deteriorada en un pavimento de hormigón" },
      { image: suppliedCrack, alt: "Fisura abierta con bordes deteriorados en un pavimento de hormigón" },
      { image: temporaryRepairJoint, alt: "Junta longitudinal abierta sobre una superficie de hormigón" },
      { image: temporaryRepairCrack, alt: "Grieta con pérdida de material en una losa de hormigón" },
    ],
  },
  {
    id: "level",
    title: "Nivelación y recrecidos",
    intro: "Cuando el pavimento necesita corregir desniveles o recuperar cotas para el uso previsto.",
    services: ["Corrección de desniveles", "Recrecidos", "Preparación del soporte"],
    review: "Planimetría requerida, cotas, cargas, espesor disponible y condiciones del soporte.",
    scope: "La solución depende del soporte existente, las tolerancias necesarias y el uso previsto. Sistema, espesor y condiciones de reapertura se concretan para cada actuación.",
    photos: [
      { image: temporaryLevelSmoothing, alt: "Equipo extendiendo y nivelando hormigón fresco" },
      { image: temporaryLevelTrowel, alt: "Regleado manual de una superficie de hormigón fresco" },
      { image: temporaryLevelSpreading, alt: "Operario distribuyendo hormigón antes de nivelarlo" },
      { image: temporaryLevelLaser, alt: "Nivel láser proyectado sobre un pavimento" },
    ],
  },
  {
    id: "renew",
    title: "Pulido y rehabilitación",
    intro: "Para superficies desgastadas que necesitan recuperar continuidad y un acabado definido para su uso.",
    services: ["Lijado y pulido", "Recuperación de superficies desgastadas", "Reparaciones localizadas, cuando proceda"],
    review: "Desgaste, estado superficial, acabado esperado, polvo y continuidad operativa.",
    scope: "La intervención puede combinar preparación, reparaciones localizadas y tratamiento superficial. El acabado se acuerda para cada actuación.",
    photos: [
      { image: temporaryRenewWarehouse, alt: "Pavimento continuo en una nave industrial" },
      { image: temporaryRenewFloor, alt: "Superficie continua de hormigón en una nave diáfana" },
      { image: temporaryRenewPolished, alt: "Pavimento pulido entre pilares de acero" },
      { image: temporaryRenewReflective, alt: "Superficie pulida con acabado reflectante" },
    ],
  },
  {
    id: "prepare",
    title: "Retirada y preparación del soporte",
    intro: "Cuando hay revestimientos, anclajes o capas existentes que condicionan la siguiente solución.",
    services: ["Retirada de revestimientos", "Retirada de anclajes, según diagnóstico", "Preparación del soporte"],
    review: "Sistema existente, adherencia, huecos, superficie y gestión de residuos.",
    scope: "La inspección previa permite definir el método de retirada y la preparación necesaria sin atribuir prestaciones a un sistema todavía no seleccionado.",
    photos: [
      { image: suppliedEpoxy, alt: "Desbastado de epoxi sobre un pavimento industrial azul" },
      { image: suppliedAnchors, alt: "Huecos de anclajes retirados en un pavimento de hormigón" },
      { image: temporaryPrepareGrinding, alt: "Corte y preparación mecánica de una superficie industrial" },
      { image: temporaryPreparePriming, alt: "Aplicación de una imprimación sobre una superficie de hormigón" },
    ],
  },
] as const;

export function ArchitectureSolutionsPage() {
  return <ArchitectureInquiryProvider><div className="ar-page ar-solutions" id="soluciones">
    <a href="#ar-content" className="skip">Saltar al contenido</a>
    <header className="ar-header"><div className="ar-wrap ar-header-inner">
      <LogoMark brandName={brand.nombre} href="/es/" homeLabel="inicio" className="ar-logo" />
      <nav className="ar-desktop-nav" aria-label="Navegación principal">{navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <ArchitectureLanguage languages={languages} />
      <a href="#contact" className="ar-button ar-header-cta">Cuéntanos tu caso</a><ArchitectureMenu items={navigation} />
    </div></header>
    <main id="ar-content" tabIndex={-1}>
      <section className="ar-hero ar-solutions-hero" aria-labelledby="ar-title">
        <ResponsiveImage className="ar-hero-image" src={temporaryRenewLogistics} {...getImageDimensions(temporaryRenewLogistics, { width: 960, height: 640 })} alt="Pavimento industrial en una nave logística" sizes="100vw" loading="eager" fetchPriority="high" />
        <div className="ar-wrap ar-hero-copy"><p className="ar-hero-label">Soluciones</p><h1 id="ar-title">Elegir una intervención empieza por entender el pavimento.</h1><p>Partimos del daño visible y revisamos soporte, uso y accesos antes de concretar el alcance.</p>
          <div className="ar-actions"><a className="ar-button" href="#soluciones-lista">Ver soluciones</a><a href="#contact">Cuéntanos tu caso</a></div>
        </div>
      </section>

      <section className="ar-wrap ar-solution-introduction" aria-labelledby="ar-approach-title">
        <div><p className="ar-overline">Antes de decidir</p><h2 id="ar-approach-title">El mismo daño puede exigir alcances distintos.</h2></div>
        <p>Una junta, un desnivel o una capa deteriorada no describen por sí solos una intervención. Estas cuatro vías ayudan a situar el caso; la definición final requiere revisar el estado y las condiciones de trabajo.</p>
      </section>

      <nav className="ar-wrap ar-solution-index" id="soluciones-lista" aria-label="Índice de soluciones">
        {solutions.map((solution, index) => <a href={`#${solution.id}`} key={solution.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{solution.title}</strong><i aria-hidden="true" /></a>)}
      </nav>

      <section className="ar-solution-dossiers" aria-label="Desarrollo de soluciones">
        {solutions.map((solution, index) => <article className="ar-solution-dossier" id={solution.id} key={solution.id}>
          <div className="ar-wrap ar-solution-dossier-grid">
            <div className="ar-solution-dossier-copy"><p className="ar-overline">Solución {String(index + 1).padStart(2, "0")}</p><h2>{solution.title}</h2><p className="ar-solution-dossier-intro">{solution.intro}</p>
              <ul>{solution.services.map((service) => <li key={service}>{service}</li>)}</ul>
              <details><summary>Qué revisamos y cómo se concreta</summary><dl className="ar-technical-facts"><div><dt>Qué revisar</dt><dd>{solution.review}</dd></div><div><dt>Alcance</dt><dd>{solution.scope}</dd></div></dl></details>
              <ArchitectureSolutionLink title={solution.title} />
            </div>
            <div className="ar-solution-dossier-gallery" aria-label={`Imágenes de ${solution.title}`}>
              {solution.photos.map((photo) => <div className="ar-solution-photo" key={photo.alt}>
                <ResponsiveImage src={photo.image} {...getImageDimensions(photo.image, { width: 860, height: 484 })} alt={photo.alt} sizes="(max-width: 700px) calc((100vw - 56px) / 2), (max-width: 1100px) calc((100vw - 120px) / 2), 360px" />
              </div>)}
            </div>
            <p className="ar-note">Imágenes ilustrativas; no acreditan obras realizadas por Obraxen.</p>
          </div>
        </article>)}
      </section>

      <section className="ar-solution-closeout"><div className="ar-wrap"><p className="ar-overline">¿No ves tu caso claro?</p><h2>Cuéntanos qué se aprecia en el pavimento y cómo se utiliza el espacio.</h2><p>Con localidad, uso del espacio y daño visible podemos preparar una consulta más útil. No se realiza ningún diagnóstico ni se envía información automáticamente desde esta página.</p><a className="ar-button" href="#contact">Cuéntanos tu caso</a></div></section>

      <section className="ar-contact ar-section" id="contact" aria-label="Contacto"><div className="ar-wrap ar-contact-grid">
        <h2 id="ar-contact-title" tabIndex={-1}>Cuéntanos tu caso</h2>
        <ArchitectureContact compact />
      </div></section>
    </main>
    <footer className="ar-footer"><div className="ar-wrap"><div className="ar-footer-grid">
      <div><div className="ar-footer-brand"><LogoMark brandName={brand.nombre} href="/es/" homeLabel="inicio" className="ar-logo" /></div><p>Reparación y rehabilitación de pavimentos industriales.</p></div>
      <nav aria-label="Navegación del pie"><h2>Explorar</h2>{navigation.map(([label, href]) => <a key={href} href={href}>{label}</a>)}</nav>
      <nav aria-label="Soluciones del pie"><h2>Soluciones</h2>{solutions.map((solution) => <a key={solution.id} href={`#${solution.id}`}>{solution.title}</a>)}</nav>
      <div><h2>Contacto</h2>{company.email ? <a href={`mailto:${company.email}`}>{company.email}</a> : null}{company.phone && company.phoneHref ? <a href={company.phoneHref}>{company.phone}</a> : null}{company.whatsappHref ? <a href={company.whatsappHref}>WhatsApp</a> : null}<a href="#contact">Cuéntanos tu caso</a></div>
    </div><div className="ar-footer-bottom"><nav aria-label="Información legal"><a href={getPath("es", "legalNotice")}>Aviso legal</a><a href={getPath("es", "privacy")}>Privacidad</a><a href={getPath("es", "cookies")}>Cookies</a></nav>
      <div className="ar-language-links"><nav id="ar-languages" aria-label="Idiomas"><Link href="/es/soluciones/" hrefLang="es" lang="es" aria-current="page">ES</Link></nav><span className="ar-note">Otros idiomas no disponibles.</span></div>
    </div>{company.legalName || company.taxId || company.address ? <p className="ar-note">{company.legalName ?? ""}{company.taxId ? <> · NIF {company.taxId}</> : null}<br />{company.address ?? ""}</p> : null}</div></footer>
  </div></ArchitectureInquiryProvider>;
}
