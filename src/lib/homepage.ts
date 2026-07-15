import type { StaticImageData } from "next/image";
import diagnosticoImage from "../../img/diagnostico.jpg";
import fisurasImage from "../../img/fisuras.jpg";
import heroImage from "../../img/hero-nave.jpg";
import juntasImage from "../../img/juntas.jpg";
import blitzInitial from "../../img/proyectos/blitz/estado-inicial-junta.webp";
import blitzRepair from "../../img/proyectos/blitz/reparacion.webp";
import blitzResult from "../../img/proyectos/blitz/resultado-pasillo.webp";
import dadadaDetail from "../../img/proyectos/dadada/detalle-refuerzo.webp";
import dadadaInitial from "../../img/proyectos/dadada/estado-inicial.webp";
import dadadaRepair from "../../img/proyectos/dadada/refuerzo-junta.webp";
import delticomInitial from "../../img/proyectos/delticom/estado-inicial.webp";
import delticomResult from "../../img/proyectos/delticom/resultado.webp";
import delticomTreatment from "../../img/proyectos/delticom/tratamiento.webp";
import hologramInitial from "../../img/proyectos/hologram/estado-inicial-huecos.webp";
import hologramTreatment from "../../img/proyectos/hologram/maquinaria-tratamiento.webp";
import hologramResult from "../../img/proyectos/hologram/resultado.webp";
import lorealInitial from "../../img/proyectos/loreal/estado-inicial.webp";
import lorealResult from "../../img/proyectos/loreal/resultado.webp";
import lorealTreatment from "../../img/proyectos/loreal/tratamiento.webp";
import tpLinkDetail from "../../img/proyectos/tp-link/detalle-retiradas.webp";
import tpLinkGeneral from "../../img/proyectos/tp-link/resultado-general.webp";
import tpLinkZone from "../../img/proyectos/tp-link/resultado-zona.webp";
import pulidoImage from "../../img/pulido.jpg";
import recrecidosImage from "../../img/recrecidos.jpg";
import { brand, getBrandTranslation } from "./brand";
import { getDictionary, getPath, type Locale } from "./i18n";
import { projects } from "./projects";

export type ServiceIcon = "joint" | "crack" | "level" | "surface";

export type NavigationItem = {
  href: string;
  label: string;
  section?: "process" | "services" | "company" | "faq";
};

const serviceImages = [juntasImage, fisurasImage, recrecidosImage, pulidoImage] as const;
const serviceIcons: readonly ServiceIcon[] = ["joint", "crack", "level", "surface"];

const projectImages: Record<string, StaticImageData> = {
  "img/proyectos/blitz/estado-inicial-junta.webp": blitzInitial,
  "img/proyectos/blitz/reparacion.webp": blitzRepair,
  "img/proyectos/blitz/resultado-pasillo.webp": blitzResult,
  "img/proyectos/dadada/detalle-refuerzo.webp": dadadaDetail,
  "img/proyectos/dadada/estado-inicial.webp": dadadaInitial,
  "img/proyectos/dadada/refuerzo-junta.webp": dadadaRepair,
  "img/proyectos/delticom/estado-inicial.webp": delticomInitial,
  "img/proyectos/delticom/resultado.webp": delticomResult,
  "img/proyectos/delticom/tratamiento.webp": delticomTreatment,
  "img/proyectos/hologram/estado-inicial-huecos.webp": hologramInitial,
  "img/proyectos/hologram/maquinaria-tratamiento.webp": hologramTreatment,
  "img/proyectos/hologram/resultado.webp": hologramResult,
  "img/proyectos/loreal/estado-inicial.webp": lorealInitial,
  "img/proyectos/loreal/resultado.webp": lorealResult,
  "img/proyectos/loreal/tratamiento.webp": lorealTreatment,
  "img/proyectos/tp-link/detalle-retiradas.webp": tpLinkDetail,
  "img/proyectos/tp-link/resultado-general.webp": tpLinkGeneral,
  "img/proyectos/tp-link/resultado-zona.webp": tpLinkZone,
};

export function getProjectImage(path: string): StaticImageData {
  const image = projectImages[path];
  if (!image) throw new Error(`No existe un import de imagen para ${path}`);
  return image;
}

export function getImageDimensions(
  image: StaticImageData | string,
  fallback: { width: number; height: number },
) {
  return typeof image === "string"
    ? fallback
    : { width: image.width, height: image.height };
}

export function naturalList(items: readonly string[], locale: Locale): string {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
}

export function getHomepage(locale: Locale) {
  const dictionary = getDictionary(locale);
  const brandCopy = getBrandTranslation(locale);
  const hasContactChannel = Boolean(brand.email || brand.telefono || brand.whatsapp);
  const navigationItems: readonly NavigationItem[] = dictionary.navigation.items.map((item) =>
    item.section
      ? { label: item.label, href: `#${item.section}`, section: item.section }
      : { label: item.label, href: getPath(locale, item.route) },
  );
  const cta = {
    href: hasContactChannel
      ? getPath(locale, "contact")
      : projects.length
        ? getPath(locale, "projects")
        : "#services",
    text: hasContactChannel
      ? dictionary.cta.assessment
      : projects.length
        ? dictionary.cta.projects
        : dictionary.cta.services,
  };

  return {
    locale,
    dictionary,
    brandName: brand.nombre,
    claim: brandCopy.claim,
    heroImage,
    diagnosticoImage,
    projects,
    navigationItems,
    cta,
    stats: [
      ...(brand.experienciaAnios
        ? [{ value: `+${brand.experienciaAnios}`, label: dictionary.intro.experienceLabel }]
        : []),
      ...(brand.respuestaHoras
        ? [{ value: `<${brand.respuestaHoras}h`, label: dictionary.intro.responseLabel }]
        : []),
      { value: "04", label: dictionary.intro.phasesLabel },
    ],
    brandKicker: brand.nombre ?? dictionary.intro.fallbackKicker,
    whyKicker: brand.nombre
      ? `${locale === "de" ? "Warum" : locale === "fr" ? "Pourquoi" : locale === "es" ? "Por qué" : "Why"} ${brand.nombre}`
      : dictionary.intro.whyFallbackKicker,
    services: dictionary.services.items.map((service, index) => ({
      ...service,
      image: serviceImages[index] ?? juntasImage,
      icon: serviceIcons[index] ?? "joint",
    })),
    serviceAreaLabel: naturalList(brandCopy.areasServicio, locale),
    priorityMarketsLabel: naturalList(brandCopy.mercadosPrioritarios, locale),
    hasOwnTeams: brand.equiposPropios,
    hasContactChannel,
    contact: {
      email: brand.email,
      phone: brand.telefono,
      whatsapp: brand.whatsapp,
      schedule: brandCopy.horarioTexto,
    },
    legal: {
      businessName: brand.nombreLegal,
      taxId: brand.cif,
      address: brand.direccion,
      legalUrl: getPath(locale, "legalNotice"),
      privacyUrl: getPath(locale, "privacy"),
      cookiesUrl: getPath(locale, "cookies"),
    },
  } as const;
}

export function getHomepageJsonLd(locale: Locale): string {
  const homepage = getHomepage(locale);
  const { dictionary } = homepage;
  const origin = brand.dominio ? `https://${brand.dominio}` : null;
  const absolute = (path: string) => origin ? new URL(path, origin).toString() : path;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      ...(brand.nombre
        ? [{
            "@type": "Organization",
            name: brand.nombre,
            description: homepage.claim,
            areaServed: getBrandTranslation(locale).areasServicio,
            ...(brand.email ? { email: brand.email } : {}),
            ...(brand.telefono ? { telephone: brand.telefono } : {}),
            ...(brand.direccion ? { address: brand.direccion } : {}),
            ...(origin ? { url: absolute(getPath(locale, "home")) } : {}),
          }]
        : []),
      {
        "@type": "FAQPage",
        inLanguage: locale,
        mainEntity: dictionary.faq.items.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  }).replace(/</g, "\\u003c");
}
