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
import { brand } from "./brand";
import { projects } from "./projects";

export const navigationItems = [
  { href: "#proceso", label: "Proceso", section: "proceso" },
  { href: "#servicios", label: "Servicios", section: "servicios" },
  { href: "/proyectos/", label: "Proyectos" },
  { href: "#empresa", label: "Empresa", section: "empresa" },
  { href: "#faq", label: "FAQ", section: "faq" },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "Valoración inicial a distancia",
    description:
      "La primera valoración puede partir de fotos o un vídeo de la zona afectada. Si hace falta concretar el alcance, inspeccionamos el pavimento in situ para estudiar la causa del daño.",
  },
  {
    number: "02",
    title: "Propuesta técnica",
    description:
      "Definimos qué necesita la intervención —preparación, reparación, nivelación o tratamiento—, además del alcance, los materiales, los plazos y, cuando procede, un plan de fases.",
  },
  {
    number: "03",
    title: "Ejecución",
    description:
      "Organizamos la intervención por zonas y coordinamos la ejecución con la actividad de la instalación cuando el alcance lo permite.",
  },
  {
    number: "04",
    title: "Entrega y seguimiento",
    description:
      "Revisamos el trabajo ejecutado y dejamos las indicaciones de uso y mantenimiento que correspondan al sistema aplicado.",
  },
] as const;

export const sectors = [
  "Logística",
  "Alimentación",
  "Automoción",
  "Retail",
  "Farmacéutico",
  "Aparcamientos",
] as const;

export const services = [
  {
    title: "Reparación de juntas",
    description:
      "Saneado, reconstrucción y sellado según el daño y las exigencias de tráfico.",
    image: juntasImage,
    icon: "joint",
  },
  {
    title: "Tratamiento de fisuras",
    description:
      "Tratamiento superficial o refuerzo mecánico según el origen y la evolución de la fisura.",
    image: fisurasImage,
    icon: "crack",
  },
  {
    title: "Recrecidos y nivelación",
    description:
      "Corrección de desniveles y recuperación de cotas con morteros técnicos.",
    image: recrecidosImage,
    icon: "level",
  },
  {
    title: "Tratamientos superficiales",
    description:
      "Pulido, endurecimiento y protección del hormigón cuando el soporte y el uso lo aconsejan.",
    image: pulidoImage,
    icon: "surface",
  },
] as const;

export const otherWorks = [
  "Retirada de pavimento epoxi",
  "Preparación mecánica de superficies",
  "Reparación de suelos de resina epoxi",
  "Eliminación de señalización vial antigua",
  "Retirada de anclajes, tornillos y espárragos",
  "Bacheo y parcheo de hormigón",
  "Reparación de arañazos y desconchones",
  "Sellado de juntas de dilatación",
  "Pulido de hormigón en grandes superficies",
] as const;

export const frequentlyAskedQuestions = [
  {
    question: "¿Podéis darme una valoración sin venir a la instalación?",
    answer:
      "Sí. Las fotos o un vídeo de la zona afectada y unas medidas aproximadas permiten preparar una primera valoración orientativa. Si hace falta concretar el alcance, acordamos una inspección in situ antes de definir la propuesta.",
  },
  {
    question: "¿Puedo seguir operando durante la reparación?",
    answer:
      "Depende del daño, el sistema y la circulación de la instalación. Cuando el alcance lo permite, proponemos fases, zonas acotadas u horarios alternativos para reducir el impacto sobre la actividad.",
  },
  {
    question: "¿Cuánto tarda en poder pisarse una zona reparada?",
    answer:
      "Depende del sistema empleado. Existen morteros y resinas de curado rápido; el plazo concreto para tráfico peatonal o de carretillas queda definido en la propuesta técnica.",
  },
  {
    question: "¿Por qué se rompen las juntas y las fisuras vuelven a aparecer?",
    answer:
      "Puede ocurrir cuando se trata el síntoma sin revisar la causa: juntas mal dimensionadas, soporte degradado o un tráfico distinto al previsto. Por eso la valoración empieza por el estado del pavimento y las condiciones de uso.",
  },
  {
    question: "¿Trabajáis fuera de España?",
    answer:
      "Sí. Trabajamos en toda la Unión Europea, principalmente en Alemania, Países Bajos, Bélgica, Francia, España, Portugal e Italia.",
  },
] as const;

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

function naturalList(items: readonly string[]): string {
  if (items.length < 2) return items[0] ?? "";
  const last = items.at(-1) ?? "";
  const conjunction = /^(?:i|hi(?!e))/i.test(last) ? "e" : "y";
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${last}`;
}

export const homepage = {
  brandName: brand.nombre,
  claim: brand.claim,
  heroImage,
  diagnosticoImage,
  projects,
  cta: {
    href:
      brand.email || brand.telefono || brand.whatsapp
        ? "#contacto"
        : projects.length
          ? "/proyectos/"
          : "#servicios",
    text:
      brand.email || brand.telefono || brand.whatsapp
        ? "Pide una evaluación"
        : projects.length
          ? "Ver proyectos"
          : "Ver servicios",
  },
  stats: [
    ...(brand.experienciaAnios
      ? [{ value: `+${brand.experienciaAnios}`, label: "Años de experiencia acumulada del equipo" }]
      : []),
    ...(brand.respuestaHoras
      ? [{ value: `<${brand.respuestaHoras}h`, label: "Primera respuesta" }]
      : []),
    { value: "04", label: "Fases desde la valoración hasta el seguimiento" },
  ],
  brandKicker: brand.nombre ?? "Experiencia técnica",
  whyKicker: brand.nombre ? `Por qué ${brand.nombre}` : "Por qué este enfoque",
  serviceAreaLabel:
    brand.areasServicio.length === 1 && brand.areasServicio[0] === "Unión Europea"
      ? "la Unión Europea"
      : naturalList(brand.areasServicio),
  priorityMarketsLabel: naturalList(brand.mercadosPrioritarios),
  hasOwnTeams: brand.equiposPropios,
  hasContactChannel: Boolean(brand.email || brand.telefono || brand.whatsapp),
  contact: {
    email: brand.email,
    phone: brand.telefono,
    whatsapp: brand.whatsapp,
    schedule: brand.horarioTexto,
  },
  legal: {
    businessName: brand.nombreLegal,
    taxId: brand.cif,
    address: brand.direccion,
    legalUrl: brand.legalUrl,
    privacyUrl: brand.privacidadUrl,
  },
} as const;

export const homepageJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    ...(brand.nombre
      ? [
          {
            "@type": "LocalBusiness",
            name: brand.nombre,
            description: `${brand.claim}: juntas, fisuras, recrecidos y tratamientos superficiales.`,
            areaServed: brand.areasServicio,
            ...(brand.email ? { email: brand.email } : {}),
            ...(brand.telefono ? { telephone: brand.telefono } : {}),
            ...(brand.direccion ? { address: brand.direccion } : {}),
            ...(brand.horarioSchema ? { openingHours: brand.horarioSchema } : {}),
          },
        ]
      : []),
    {
      "@type": "FAQPage",
      mainEntity: frequentlyAskedQuestions.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ],
}).replace(/</g, "\\u003c");

export type NavigationItem = {
  readonly href: string;
  readonly label: string;
  readonly section?: string;
};
export type ServiceIcon = (typeof services)[number]["icon"];
