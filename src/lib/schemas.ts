import { z } from "zod";

const text = z.string().trim().min(1);
const nullableText = text.nullable();
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const uniqueTextList = z.array(text).min(1).refine(
  (items) => new Set(items).size === items.length,
  "La lista no puede contener duplicados",
);

const contactNumber = nullableText.refine(
  (value) => value === null || value.replace(/\D/g, "").length >= 9,
  "El teléfono debe contener al menos nueve dígitos",
);

export const brandSchema = z.object({
  nombreTemporalNoPublicable: nullableText,
  nombre: nullableText,
  nombreLegal: nullableText,
  cif: nullableText,
  empresaConstituida: z.boolean(),
  formaJuridicaPrevista: nullableText,
  claim: text,
  dominio: nullableText.refine(
    (value) => value === null || /^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(value),
    "El dominio no es válido",
  ),
  email: z.union([z.email(), z.null()]),
  telefono: contactNumber,
  whatsapp: contactNumber,
  direccion: nullableText,
  fundadorNombre: nullableText,
  fundadorCargo: nullableText,
  experienciaAnios: z.number().int().positive().nullable(),
  respuestaHoras: z.number().int().positive().nullable(),
  equiposPropios: z.boolean(),
  areasServicio: uniqueTextList,
  mercadosPrioritarios: uniqueTextList,
  horarioTexto: nullableText,
  horarioSchema: nullableText,
  legalUrl: nullableText,
  privacidadUrl: nullableText,
  legalRevisionAprobada: z.boolean(),
  formularioProveedor: nullableText,
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

const projectTranslation = z.object({
  titulo: text,
  problema: text,
  solucion: text,
  resultado: text,
}).strict();

const projectPublicationAuthorizationSchema = z.object({
  estado: z.enum([
    "pendiente",
    "confirmada_internamente",
    "documentada",
    "denegada",
  ]),
  alcanceDeclarado: z.array(z.enum([
    "nombre_cliente",
    "fotografias_web",
    "logotipo",
  ])).refine(
    (items) => new Set(items).size === items.length,
    "El alcance de publicación no puede contener duplicados",
  ),
  fuente: nullableText,
  confirmadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  referenciaDocumento: nullableText,
  revisionLegal: z.enum(["pendiente", "aprobada", "no_aplica"]),
}).strict().superRefine((authorization, context) => {
  if (
    ["confirmada_internamente", "documentada"].includes(authorization.estado) &&
    (!authorization.fuente || !authorization.confirmadoEl)
  ) {
    context.addIssue({
      code: "custom",
      message: "Una autorización confirmada necesita fuente y fecha",
    });
  }

  if (
    authorization.estado === "documentada" &&
    (!authorization.referenciaDocumento || authorization.revisionLegal !== "aprobada")
  ) {
    context.addIssue({
      code: "custom",
      message: "La publicación documentada necesita referencia y revisión legal aprobada",
    });
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
    confirmadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
  }).strict()).min(3),
  traducciones: z.object({ es: projectTranslation }).catchall(projectTranslation),
}).strict();

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
  traducciones: z.object({ es: offerTranslation }).catchall(offerTranslation),
}).strict();

export const offersSchema = z.array(offerSchema).min(1);

export type Brand = z.infer<typeof brandSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Offer = z.infer<typeof offerSchema>;
