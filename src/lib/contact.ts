import { z } from "zod";
import { brand } from "./brand";
import type { Brand } from "./schemas";

const email = z.email().max(254);

export const contactSubmissionSchema = z.object({
  locale: z.enum(["en", "de", "es", "fr"]),
  name: z.string().trim().min(2).max(100),
  email,
  company: z.string().trim().min(2).max(160),
  country: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(20).max(4_000),
  consent: z.literal(true),
  website: z.string().max(0),
  startedAt: z.number().int().positive(),
  source: z.string().startsWith("/").max(500),
  utm: z.object({
    source: z.string().trim().max(100).optional(),
    medium: z.string().trim().max(100).optional(),
    campaign: z.string().trim().max(150).optional(),
  }).strict().optional(),
}).strict();

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>;

export type ContactConfig = {
  enabled: boolean;
  apiKey: string | null;
  toEmail: string | null;
  fromEmail: string | null;
  issues: readonly string[];
};

function validEmail(value: string | undefined): string | null {
  const parsed = email.safeParse(value?.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

export function resolveContactConfig(
  environment: Record<string, string | undefined>,
  identity: Brand = brand,
): ContactConfig {
  const apiKey = environment.RESEND_API_KEY?.trim() ?? null;
  const toEmail = validEmail(environment.CONTACT_TO_EMAIL);
  const fromEmail = validEmail(environment.CONTACT_FROM_EMAIL);
  const issues: string[] = [];

  if (environment.CONTACT_FORM_ENABLED !== "true") issues.push("CONTACT_FORM_ENABLED no está activo");
  if (!apiKey || !/^re_[A-Za-z0-9_-]{20,}$/.test(apiKey)) issues.push("RESEND_API_KEY no es válida");
  if (!toEmail) issues.push("CONTACT_TO_EMAIL no es válido");
  if (!fromEmail) issues.push("CONTACT_FROM_EMAIL no es válido");
  if (!identity.empresaConstituida || !identity.nombreLegal || !identity.cif) issues.push("falta identidad societaria validada");
  if (!identity.dominio) issues.push("falta el dominio definitivo");
  if (!identity.email) issues.push("falta el correo público del responsable");
  if (!identity.legalRevisionAprobada) issues.push("falta la revisión legal aprobada");
  if (identity.formularioProveedor !== "Resend") issues.push("el proveedor de formulario no coincide con Resend");
  if (!identity.formularioRevisionAprobada) issues.push("falta aprobar el proveedor y su tratamiento de datos");
  if (identity.email && toEmail && identity.email.toLowerCase() !== toEmail) {
    issues.push("CONTACT_TO_EMAIL no coincide con brand.email");
  }
  if (identity.dominio && fromEmail && !fromEmail.endsWith(`@${identity.dominio}`)) {
    issues.push("CONTACT_FROM_EMAIL no pertenece al dominio definitivo");
  }

  return {
    enabled: issues.length === 0,
    apiKey: apiKey && /^re_[A-Za-z0-9_-]{20,}$/.test(apiKey) ? apiKey : null,
    toEmail,
    fromEmail,
    issues,
  };
}

export function buildContactEmail(submission: ContactSubmission): string {
  const utm = submission.utm
    ? Object.entries(submission.utm)
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    : "sin atribución UTM";
  return [
    "Nueva solicitud de evaluación técnica",
    "",
    `Idioma: ${submission.locale}`,
    `Nombre: ${submission.name}`,
    `Email: ${submission.email}`,
    `Empresa: ${submission.company}`,
    `País: ${submission.country}`,
    `Teléfono: ${submission.phone || "sin dato"}`,
    `Origen: ${submission.source}`,
    "",
    "Consulta:",
    submission.message,
    "",
    "Atribución:",
    utm,
  ].join("\n");
}
