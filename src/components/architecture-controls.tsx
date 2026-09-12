"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { architectureCompany, architectureQuickContactSchema } from "@/lib/architecture-content";

const subscribe = () => () => {};
const InquiryContext = createContext<{ solution: string | null; selectSolution: (solution: string | null) => void } | null>(null);
const hasDirectContact = Boolean(architectureCompany.email || (architectureCompany.phone && architectureCompany.phoneHref) || architectureCompany.whatsappHref);
const submitLabel = hasDirectContact ? "Enviar consulta" : "Preparar consulta";

export function ArchitectureInquiryProvider({ children }: { children: ReactNode }) {
  const [solution, selectSolution] = useState<string | null>(null);
  return <InquiryContext.Provider value={{ solution, selectSolution }}>{children}</InquiryContext.Provider>;
}

export function ArchitectureSolutionLink({ title, href = "#contact" }: { title: string; href?: string }) {
  const inquiry = useContext(InquiryContext);
  return <a className="ar-solution-consult" href={href} aria-label={`Consultar esta solución: ${title}`} aria-current={inquiry?.solution === title ? "true" : undefined} onClick={event => {
    if (!inquiry || href !== "#contact" || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    inquiry.selectSolution(title);
    window.location.hash = "contact";
    document.getElementById("contact")?.scrollIntoView({ block: "start" });
    document.getElementById("ar-contact-title")?.focus({ preventScroll: true });
  }}>Consultar esta solución<span aria-hidden="true" className="ar-link-arrow" /></a>;
}

type ContactFeedback =
  | { type: "idle" | "editing" | "cleared" }
  | { type: "error"; fieldId: string; message: string }
  | { type: "result"; data: { name: string; contact: string; need: string } };

function contactLinks(data: { name: string; contact: string; need: string }, solution: string | null) {
  const subject = `Consulta Obraxen${solution ? ` · ${solution}` : ""}`;
  const message = [
    `Hola, soy ${data.name}.`,
    solution ? `Solución consultada: ${solution}.` : null,
    `Necesidad: ${data.need}`,
    `Datos de contacto: ${data.contact}`,
  ].filter(Boolean).join("\n\n");
  return {
    email: architectureCompany.email ? `mailto:${architectureCompany.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` : null,
    whatsapp: architectureCompany.whatsappHref ? `${architectureCompany.whatsappHref}?text=${encodeURIComponent(message)}` : null,
  };
}

function ArchitectureQuickContact() {
  const inquiry = useContext(InquiryContext);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [feedback, setFeedback] = useState<ContactFeedback>({ type: "idle" });
  const result = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useLayoutEffect(() => {
    if (feedback.type === "error") {
      const field = form.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${feedback.fieldId}`);
      field?.focus({ preventScroll: true });
      field?.closest("label")?.scrollIntoView({ behavior: "instant", block: "center" });
    } else if (feedback.type === "result") {
      result.current?.focus({ preventScroll: true });
      result.current?.scrollIntoView({ behavior: "instant", block: "start" });
    }
  }, [feedback]);

  function fieldState(id: string, hint?: string) {
    const invalid = feedback.type === "error" && feedback.fieldId === id;
    return {
      "aria-invalid": invalid || undefined,
      "aria-describedby": [hint, invalid && `${id}-error`].filter(Boolean).join(" ") || undefined,
    };
  }

  function fieldError(id: string) {
    return feedback.type === "error" && feedback.fieldId === id
      ? <span className="ar-field-error" id={`${id}-error`}>{feedback.message}</span>
      : null;
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const elements = event.currentTarget.elements;
    const value = (id: string) => (elements.namedItem(id) as HTMLInputElement).value.trim();
    const parsed = architectureQuickContactSchema.safeParse({
      name: value("ar-name"),
      contact: value("ar-contact"),
      need: value("ar-need"),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFeedback({ type: "error", fieldId: `ar-${String(issue.path[0])}`, message: issue.message });
      return;
    }
    setFeedback({ type: "result", data: parsed.data });
  }

  const status = !hydrated
    ? hasDirectContact ? "Preparando el formulario. También puedes usar los enlaces de contacto." : "Preparando el formulario. Los canales directos están pendientes de validación."
    : feedback.type === "error"
      ? `Corrige el campo indicado y pulsa ${submitLabel}. Los demás datos se mantienen.`
      : feedback.type === "result"
        ? hasDirectContact
          ? "Consulta preparada, todavía sin enviar. Elige correo o WhatsApp para continuar."
          : "Consulta preparada, todavía sin enviar. Los canales de envío están pendientes de validación."
        : feedback.type === "editing"
          ? `Datos listos para editar. Pulsa ${submitLabel} para continuar.`
          : feedback.type === "cleared"
            ? "Formulario borrado. Puedes empezar una nueva consulta."
            : "Completa los tres campos para preparar el mensaje.";

  return <form ref={form} onSubmit={review} noValidate className="ar-contact-form" data-compact="true" data-state={hydrated ? feedback.type : "preparing"} aria-label="Formulario de contacto" onReset={() => {
    inquiry?.selectSolution(null);
    setFeedback({ type: "cleared" });
  }} onInput={event => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    setFeedback(previous => previous.type === "editing" ? previous : { type: "editing" });
  }}>
    {inquiry?.solution ? <div className="ar-selected-solution" key={inquiry.solution}>
      <p role="status" aria-atomic="true"><span>Solución elegida</span><strong>{inquiry.solution}</strong></p>
      <button type="button" className="ar-text-button" aria-label="Quitar solución elegida" onClick={() => {
        inquiry.selectSolution(null);
        form.current?.querySelector("input")?.focus({ preventScroll: true });
      }}>Quitar</button>
      <p className="ar-selection-help">Incluiremos esta solución en el mensaje preparado.</p>
    </div> : null}
    <div className="ar-form-row">
      <label htmlFor="ar-name">Nombre<input id="ar-name" name="name" autoComplete="name" required maxLength={100} {...fieldState("ar-name")} />{fieldError("ar-name")}</label>
      <label htmlFor="ar-contact">Email o teléfono<input id="ar-contact" name="contact" type="text" autoComplete="on" required maxLength={254} {...fieldState("ar-contact")} />{fieldError("ar-contact")}</label>
    </div>
    <label htmlFor="ar-need">¿Qué necesitas revisar?<textarea id="ar-need" rows={3} required maxLength={2000} placeholder="Localidad, uso del espacio y daño visible." {...fieldState("ar-need", "ar-need-limit")} />{fieldError("ar-need")}<span className="ar-note" id="ar-need-limit">Hasta 2000 caracteres. Los tres campos son obligatorios.</span></label>
    <p className="ar-send-help" id="ar-send-help">{hasDirectContact ? "Antes de enviar, revisarás el mensaje y elegirás correo o WhatsApp. No se envía automáticamente." : "Puedes preparar una consulta para revisar los datos. Los canales de envío se habilitarán cuando el contacto esté validado."}</p>
    <div className="ar-form-actions"><button className="ar-demo-button" type="submit" disabled={!hydrated} aria-describedby="ar-send-help">{submitLabel}</button><button type="reset" className="ar-text-button">Borrar</button></div>
    <div className="ar-form-support">
      <p className="ar-form-status" role="status" aria-atomic="true">{status}</p>
      <div className="ar-contact-direct" aria-label="Contacto directo alternativo">{hasDirectContact ? <><p>¿Prefieres hablar directamente?</p>{architectureCompany.phone && architectureCompany.phoneHref ? <a href={architectureCompany.phoneHref}>Llamar al {architectureCompany.phone}</a> : null}{architectureCompany.whatsappHref ? <a href={architectureCompany.whatsappHref}>Abrir WhatsApp</a> : null}</> : <p className="ar-note">Contacto directo pendiente de validación.</p>}</div>
    </div>
    <noscript><p>La revisión local necesita JavaScript. Puedes consultar los datos de contacto de esta sección.</p></noscript>
    {feedback.type === "result" ? <div className="ar-review" ref={result} tabIndex={-1} aria-labelledby="ar-review-heading">
      <h3 id="ar-review-heading">Consulta preparada</h3>
      {inquiry?.solution ? <p><strong>Solución: {inquiry.solution}</strong></p> : null}
      <p>{feedback.data.name}<br />{feedback.data.contact}<br />{feedback.data.need}</p>
      <p>{hasDirectContact ? "Todavía no se ha enviado. Elige un canal y confirma el envío en tu aplicación de correo o WhatsApp." : "Todavía no se ha enviado. Los canales de envío están pendientes de validación."}</p>
      <div className="ar-review-actions">
        {contactLinks(feedback.data, inquiry?.solution ?? null).whatsapp ? <a className="ar-button" href={contactLinks(feedback.data, inquiry?.solution ?? null).whatsapp!} target="_blank" rel="noreferrer">Enviar por WhatsApp</a> : null}
        {contactLinks(feedback.data, inquiry?.solution ?? null).email ? <a href={contactLinks(feedback.data, inquiry?.solution ?? null).email!}>Enviar por correo</a> : null}
        {!hasDirectContact ? <p className="ar-note">Los canales de envío están pendientes de validación.</p> : null}
      </div>
      <button type="button" className="ar-text-button" onClick={() => {
        setFeedback({ type: "editing" });
        form.current?.querySelector("input")?.focus();
      }}>Editar consulta</button>
    </div> : null}
  </form>;
}

export function ArchitectureContact({ compact = false }: { compact?: boolean }) {
  if (compact) return <ArchitectureQuickContact />;
  return <div className="ar-contact-route">
    <h3>Formulario de contacto</h3>
    <p>Abre el formulario de la web vigente para dejar los datos de tu consulta.</p>
    <Link className="ar-button" href="/es/contacto/">Abrir formulario de contacto</Link>
    <p className="ar-note">No envía consultas ni guarda datos.</p>
  </div>;
}
