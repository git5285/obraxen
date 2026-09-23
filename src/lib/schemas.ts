import { z } from "zod";
import { locales as siteLocales } from "./locales";

const text = z.string().trim().min(1);
const nullableText = text.nullable();
const calendarDate = z.iso.date();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const uniqueTextList = z.array(text).min(1).refine(
  (items) => new Set(items).size === items.length,
  "La lista no puede contener duplicados",
);

function localized<T extends z.ZodType>(schema: T) {
  return z.object({
    en: schema,
    de: schema,
    es: schema,
    fr: schema,
  }).strict();
}

const contactNumber = nullableText.refine(
  (value) => value === null || value.replace(/\D/g, "").length >= 9,
  "El teléfono debe contener al menos nueve dígitos",
);

const editorialReview = z.object({
  estado: z.enum(["pendiente", "aprobada"]),
  revisor: nullableText,
  fecha: calendarDate.nullable(),
}).strict().superRefine((review, context) => {
  if (review.estado === "aprobada" && (!review.revisor || !review.fecha)) {
    context.addIssue({
      code: "custom",
      message: "Una traducción aprobada necesita revisor y fecha",
    });
  }
});

export const brandSchema = z.object({
  nombreTemporalNoPublicable: nullableText,
  nombre: nullableText,
  nombreRevisionAprobada: z.boolean(),
  nombreLegal: nullableText,
  cif: nullableText,
  empresaConstituida: z.boolean(),
  formaJuridicaPrevista: nullableText,
  dominio: nullableText.refine(
    (value) => value === null || /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(value),
    "El dominio no es válido",
  ),
  email: z.union([z.email(), z.null()]),
  emailPrivacidad: z.union([z.email(), z.null()]),
  telefono: contactNumber,
  whatsapp: contactNumber,
  direccion: nullableText,
  fundadorNombre: nullableText,
  fundadorCargo: nullableText,
  experienciaAnios: z.number().int().positive().nullable(),
  respuestaHoras: z.number().int().positive().nullable(),
  equiposPropios: z.boolean(),
  horarioSchema: nullableText,
  legalRevisionAprobada: z.boolean(),
  formularioProveedor: nullableText,
  formularioRevisionAprobada: z.boolean(),
  revisionTraducciones: localized(editorialReview),
  traducciones: localized(z.object({
    claim: text,
    areasServicio: uniqueTextList,
    mercadosPrioritarios: uniqueTextList,
    horarioTexto: nullableText,
  }).strict()),
  publicar: z.boolean(),
}).superRefine((brand, context) => {
  if (
    brand.nombre &&
    brand.nombreTemporalNoPublicable &&
    brand.nombre.toLocaleLowerCase("es") ===
      brand.nombreTemporalNoPublicable.toLocaleLowerCase("es")
  ) {
    context.addIssue({
      code: "custom",
      path: ["nombre"],
      message: "El nombre público no puede ser el identificador temporal",
    });
  }
});

const localizedImage = z.object({ alt: text, etapa: text }).strict();

const projectTranslation = z.object({
  titulo: text,
  problema: text,
  solucion: text,
  resultado: text,
  sector: text,
  pais: text,
  fechaEjecucion: nullableText,
  duracionReal: nullableText,
  maquinaria: z.array(text),
  materiales: z.array(text),
  magnitudes: z.array(text).min(1),
  imagenes: z.array(localizedImage),
}).strict();

const publicationScope = z.enum([
  "nombre_cliente",
  "fotografias_web",
  "logotipo",
]);

const publicationScopes = z.array(publicationScope).min(1).refine(
  (items) => new Set(items).size === items.length,
  "El alcance de publicación no puede contener duplicados",
);

const projectPublicationEvidenceSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("declaracion_responsable"),
    alcance: publicationScopes,
    fuente: text,
    declaracion: text,
    declaradoEl: calendarDate,
    referenciaInterna: text,
  }).strict(),
  z.object({
    tipo: z.literal("documento_referenciado"),
    alcance: publicationScopes,
    entidadAutorizante: text,
    emitidoEl: calendarDate,
    referenciaDocumento: text,
  }).strict(),
  z.object({
    tipo: z.literal("revision_legal_verificada"),
    documentoRevisado: text,
    revisor: text,
    revisadoEl: calendarDate,
    referenciaRevision: text,
    resultado: z.enum(["aprobada", "cambios_requeridos", "denegada"]),
  }).strict(),
]);

const projectPublicationAuthorizationSchema = z.object({
  evidencias: z.array(projectPublicationEvidenceSchema).min(1),
}).strict().superRefine((authorization, context) => {
  const documentReferences = new Set(
    authorization.evidencias
      .filter((evidence) => evidence.tipo === "documento_referenciado")
      .map((evidence) => evidence.referenciaDocumento),
  );

  for (const [index, evidence] of authorization.evidencias.entries()) {
    if (
      evidence.tipo === "revision_legal_verificada"
      && !documentReferences.has(evidence.documentoRevisado)
    ) {
      context.addIssue({
        code: "custom",
        path: ["evidencias", index, "documentoRevisado"],
        message: "Una revisión legal debe enlazar un documento referenciado en el mismo expediente",
      });
    }
  }
});

export const projectSchema = z.object({
  slug,
  referencia: z.string().regex(/^E[0-9]{6}$/),
  cliente: text,
  sector: text,
  ubicacion: z.object({ ciudad: text, pais: text }).strict(),
  superficieM2: z.number().positive().nullable(),
  superficieInstalacionM2: z.number().int().positive().nullable(),
  equipoOperarios: z.number().int().positive().nullable(),
  maquinaria: z.array(text),
  materiales: z.array(text),
  magnitudes: z.array(text).min(1),
  ejecucionConfirmada: z.literal(true),
  autorizacionPublicacion: projectPublicationAuthorizationSchema,
  plazoPrevisto: nullableText,
  cierre: z.object({
    entregaConforme: z.boolean(),
    correccionesPosteriores: z.boolean(),
    fuente: text,
    confirmadoEl: calendarDate,
    fechaEjecucion: nullableText,
    duracionReal: nullableText,
    continuidadOperativa: z.enum([
      "total",
      "parcial",
      "detenida",
      "sin_actividad",
    ]).nullable(),
    resultadoAdicional: nullableText,
  }).strict(),
  imagenes: z.array(z.object({
    src: z.string().startsWith("img/"),
    alt: text,
    etapa: text,
  }).strict()),
  traducciones: localized(projectTranslation),
}).strict().superRefine((project, context) => {
  for (const language of siteLocales) {
    if (project.traducciones[language].imagenes.length !== project.imagenes.length) {
      context.addIssue({
        code: "custom",
        path: ["traducciones", language, "imagenes"],
        message: "Cada imagen necesita alt y etapa en todos los idiomas",
      });
    }
  }
});

export const projectsSchema = z.array(projectSchema);

const offerTranslation = z.object({
  titulo: text,
  entradilla: text,
  propuesta: text,
  cta: text,
}).strict();

export const offerSchema = z.object({
  slug,
  prioridad: z.number().int().positive(),
  estadoInterno: z.enum([
    "preparar_ahora",
    "oferta_central",
    "desarrollo_controlado",
  ]),
  estadoPublicacion: z.enum([
    "borrador_interno",
    "preparada_preview",
    "publicable",
  ]),
  compradores: uniqueTextList,
  problemas: uniqueTextList,
  alcance: uniqueTextList,
  limites: uniqueTextList,
  evidencia: z.array(z.object({ proyecto: slug, acredita: text }).strict()),
  condicionesSalida: uniqueTextList,
  traducciones: localized(offerTranslation),
}).strict();

export const offersSchema = z.array(offerSchema).min(1);

export type Brand = z.infer<typeof brandSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Offer = z.infer<typeof offerSchema>;
