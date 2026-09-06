import type { StaticImageData } from "next/image";
import diagnosticoImage from "../../img/diagnostico.jpg";
import fisurasImage from "../../img/fisuras.jpg";
import heroImage from "../../img/hero-nave.jpg";
import juntasImage from "../../img/juntas.jpg";
import pulidoImage from "../../img/pulido.jpg";
import recrecidosImage from "../../img/recrecidos.jpg";
import { brand, getBrandTranslation } from "./brand";
import { resolveContactConfig } from "./contact";
import { getDictionary, getPath, type Locale } from "./i18n";
import { getPublicProjectImage } from "./public-project-assets";
import { publicProjects } from "./projects";

export type ServiceIcon = "joint" | "crack" | "level" | "surface";

export type NavigationItem = {
  href: string;
  label: string;
  section?: "process" | "services" | "company" | "faq";
};

const serviceImages = [juntasImage, fisurasImage, recrecidosImage, pulidoImage] as const;
const serviceIcons: readonly ServiceIcon[] = ["joint", "crack", "level", "surface"];

export const getProjectImage = getPublicProjectImage;

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
  const contactFormEnabled = resolveContactConfig(process.env).enabled;
  const navigationItems: readonly NavigationItem[] = dictionary.navigation.items
    .filter((item) => item.route !== "projects" || publicProjects.length > 0)
    .sort((left, right) => Number(right.section === "services") - Number(left.section === "services"))
    .map((item) =>
    item.section
      ? { label: item.label, href: `#${item.section}`, section: item.section }
      : { label: item.label, href: getPath(locale, item.route) },
  ).concat({ label: dictionary.footer.contact, href: "#contact" });
  const cta = {
    href: contactFormEnabled
      ? getPath(locale, "contact")
      : publicProjects.length
        ? getPath(locale, "projects")
        : "#services",
    text: contactFormEnabled
      ? dictionary.cta.assessment
      : publicProjects.length
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
    projects: publicProjects,
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
    contactFormEnabled,
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
