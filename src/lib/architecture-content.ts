import { z } from "zod";

// User-confirmed draft, 2026-09-07; does not change the shared publication data.
export const architectureCompany = {
  legalName: "Obraxen Surface S.L.", taxId: "B93963841",
  address: "Calle Federico García Lorca, 22, Málaga", postalCode: null,
  email: "info@obraxen.com", phone: "+34 653 91 69 70", phoneHref: "tel:+34653916970",
  whatsappHref: "https://wa.me/34653916970", phoneTemporary: true,
  response: "Respondemos en un plazo de 24 horas laborables.",
  languages: "Español, inglés, alemán, francés e italiano",
  experience: "Algunas personas del equipo cuentan con hasta una década de experiencia en pavimentos industriales.",
  priority: "Nuestra prioridad comercial a corto plazo es Europa occidental.",
} as const;

const optionalText = (max: number) => z.string().trim().max(max, `Escribe como máximo ${max} caracteres.`);
export const architectureContactSchema = z.object({
  name: z.string().trim().min(1, "Escribe tu nombre.").max(100, "El nombre no puede superar los 100 caracteres."),
  email: z.string().trim().max(254, "El correo no puede superar los 254 caracteres.").pipe(z.union([z.literal(""), z.email("Revisa el correo electrónico.")])),
  phone: z.string().trim().max(30, "El teléfono no puede superar los 30 caracteres.").refine(value => !value || (/^\+?[\d ()-]+$/.test(value) && /^[\d]{7,15}$/.test(value.replace(/\D/g, ""))), "Revisa el número de teléfono."),
  city: z.string().trim().min(1, "Indica la localidad.").max(100, "La localidad no puede superar los 100 caracteres."),
  country: z.string().trim().min(1, "Indica el país.").max(100, "El país no puede superar los 100 caracteres."),
  need: z.string().trim().min(1, "Describe la necesidad.").max(2000, "Resume la necesidad en un máximo de 2000 caracteres."),
  company: optionalText(150), area: optionalText(100), deadline: optionalText(150),
}).refine(value => Boolean(value.email || value.phone), { message: "Indica un correo electrónico o un teléfono.", path: ["email"] });

export const architectureQuickContactSchema = z.object({
  name: architectureContactSchema.shape.name,
  contact: z.string().trim().min(1, "Indica un email o teléfono.").max(254, "El dato de contacto es demasiado largo.").refine(
    value => z.email().safeParse(value).success || (/^\+?[\d ()-]+$/.test(value) && /^[\d]{7,15}$/.test(value.replace(/\D/g, ""))),
    "Escribe un email o teléfono válido.",
  ),
  need: architectureContactSchema.shape.need,
});

export function validateArchitecturePhotos(files: readonly { size: number; type: string }[]) {
  if (files.length > 5) return "Selecciona un máximo de cinco fotografías.";
  if (files.some(file => file.size > 10 * 1024 * 1024 || file.size === 0)) return "Cada fotografía debe ocupar entre 1 byte y 10 MB.";
  if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) return "Selecciona fotografías JPG, PNG o WebP.";
  return "";
}
