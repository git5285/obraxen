"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { architectureContactSchema, architectureQuickContactSchema, validateArchitecturePhotos } from "@/lib/architecture-content";

const subscribe = () => () => {};

const InquiryContext = createContext<{ solution: string | null; selectSolution: (solution: string | null) => void } | null>(null);

export function ArchitectureInquiryProvider({ children }: { children: ReactNode }) {
  const [solution, selectSolution] = useState<string | null>(null);
  return <InquiryContext.Provider value={{ solution, selectSolution }}>{children}</InquiryContext.Provider>;
}

export function ArchitectureSolutionLink({ title }: { title: string }) {
  const inquiry = useContext(InquiryContext);
  return <a className="ar-solution-consult" href="#contact" aria-label={`Consultar esta solución: ${title}`} aria-current={inquiry?.solution === title ? "true" : undefined} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    inquiry?.selectSolution(title);
    // Apply native hash navigation before focus; its default action would otherwise reset it.
    window.location.hash = "contact";
    document.getElementById("contact")?.scrollIntoView({ block: "start" });
    document.getElementById("ar-contact-title")?.focus({ preventScroll: true });
  }}>Consultar esta solución<span aria-hidden="true" className="ar-link-arrow" /></a>;
}

export function ArchitectureSheetLink({ id, title }: { id: string; title: string }) {
  return <a className="ar-service-link" href={`#${id}`} aria-label={`Ver ficha técnica: ${title}`} onClick={(event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const sheet = document.getElementById(id);
    if (!(sheet instanceof HTMLDetailsElement)) return;
    event.preventDefault();
    sheet.closest(".ar-technical-sheets")?.querySelectorAll("details").forEach(detail => { detail.open = detail === sheet; });
    window.location.hash = id;
    sheet.querySelector("summary")?.focus({ preventScroll: true });
  }}>Ver ficha técnica</a>;
}

export function ArchitectureMenu({ items }: { items: readonly (readonly [string, string])[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  function close(event: KeyboardEvent) {
    if (event.key !== "Escape" || !menu.current) return;
    menu.current.open = false;
    menu.current.querySelector("summary")?.focus();
  }
  return <details className="ar-mobile-menu" ref={menu} onKeyDown={close} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}><span className="ar-menu-icon" aria-hidden="true" /></summary>
    <nav aria-label="Navegación móvil" onClick={(event) => {
      if (!(event.target instanceof HTMLAnchorElement) || !menu.current) return;
      menu.current.open = false;
      const target = document.getElementById(event.target.hash.slice(1));
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }}>
      {items.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
      <a href="#contact">Consultar proyecto</a>
    </nav>
  </details>;
}

export function ArchitectureCaseDetails({ name, children }: { name: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <details className="ar-case-full" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary aria-label={`${open ? "Cerrar caso" : "Ver caso"}: ${name}`}>
      {open ? "Cerrar caso" : "Ver caso"}
    </summary>
    {children}
  </details>;
}

type ContactFeedback =
  | { type: "idle" | "editing" | "cleared" }
  | { type: "error"; fieldId: string; message: string }
  | { type: "result"; summary: string };

export function ArchitectureContact({ compact = false }: { compact?: boolean }) {
  const inquiry = useContext(InquiryContext);
  const selectedSolution = compact ? inquiry?.solution : null;
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [feedback, setFeedback] = useState<ContactFeedback>({ type: "idle" });
  const result = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  // Position feedback after layout, before paint. No delayed frame can outlive a reset.
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
    return { "aria-invalid": invalid || undefined, "aria-describedby": [hint, invalid && `${id}-error`].filter(Boolean).join(" ") || undefined };
  }
  function fieldError(id: string) {
    return feedback.type === "error" && feedback.fieldId === id
      ? <span className="ar-field-error" id={`${id}-error`}>{feedback.message}</span> : null;
  }
  function showError(field: HTMLInputElement | HTMLTextAreaElement, message: string) {
    const details = field.closest("details");
    if (details) details.open = true;
    setFeedback({ type: "error", fieldId: field.id, message });
  }
  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const elements = event.currentTarget.elements;
    const value = (id: string) => (elements.namedItem(id) as HTMLInputElement).value.trim();
    if (compact) {
      const parsed = architectureQuickContactSchema.safeParse({ name: value("ar-name"), contact: value("ar-contact"), need: value("ar-need") });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        showError(elements.namedItem(`ar-${String(issue.path[0])}`) as HTMLInputElement, issue.message);
        return;
      }
      setFeedback({ type: "result", summary: [parsed.data.name, parsed.data.contact, parsed.data.need].join("\n") });
      return;
    }
    const parsed = architectureContactSchema.safeParse(Object.fromEntries(["name", "email", "phone", "city", "country", "need", "company", "area", "deadline"].map(key => [key, value(`ar-${key}`)])));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = elements.namedItem(`ar-${String(issue.path[0])}`) as HTMLInputElement;
      showError(field, issue.message); return;
    }
    const photos = elements.namedItem("ar-photos") as HTMLInputElement;
    const files = Array.from(photos.files ?? []);
    const photoError = validateArchitecturePhotos(files);
    if (photoError) { showError(photos, photoError); return; }
    const data = parsed.data;
    setFeedback({ type: "result", summary: [data.name, [data.email, data.phone].filter(Boolean).join(" · "), `${data.city}, ${data.country}`, data.need,
      data.company && `Empresa: ${data.company}`, data.area && `Superficie: ${data.area}`, data.deadline && `Plazo deseado: ${data.deadline}`,
      files.length && `Fotografías seleccionadas, no enviadas: ${files.map(file => file.name).join(", ")}`].filter(Boolean).join("\n") });
  }
  const status = !hydrated ? "Preparando la revisión local. Si no se activa, utiliza los enlaces de contacto."
    : feedback.type === "error" ? "No se ha completado la revisión. Corrige el campo indicado y pulsa Revisar ejemplo. Los demás datos se mantienen."
    : feedback.type === "result" ? "Revisión completada. El resumen está debajo; no se ha enviado ninguna solicitud."
    : feedback.type === "editing" ? "Datos listos para editar. Pulsa Revisar ejemplo para actualizar el resumen."
    : feedback.type === "cleared" ? "Formulario borrado. Puedes empezar un nuevo ejemplo."
    : compact ? "Revisión local sin envío." : "Revisión local lista. No se enviarán datos.";
  return <form ref={form} onSubmit={review} noValidate className="ar-contact-form" data-compact={compact || undefined} data-state={hydrated ? feedback.type : "preparing"} onReset={() => {
    if (compact) inquiry?.selectSolution(null);
    setFeedback({ type: "cleared" });
  }} onInput={(event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    setFeedback(previous => {
      if (previous.type === "error" && previous.fieldId !== field.id &&
        !(field.id === "ar-phone" && previous.message === "Indica un correo electrónico o un teléfono.")) return previous;
      return previous.type === "editing" ? previous : { type: "editing" };
    });
  }} aria-describedby="ar-demo-notice">
    <div className="ar-demo-notice" id="ar-demo-notice">
      <h3>Formulario de demostración</h3>
      {compact ? <p>No envía consultas ni guarda datos. Utiliza datos ficticios.</p> : <><p>Este formulario solo permite probar una revisión local. No envía consultas ni guarda datos. Para contactar, utiliza el correo, el teléfono o WhatsApp.</p><p>Utiliza datos ficticios.</p></>}
    </div>
    {selectedSolution ? <div className="ar-selected-solution" key={selectedSolution}>
      <p role="status" aria-atomic="true"><span>Solución elegida</span><strong>{selectedSolution}</strong></p>
      <button type="button" className="ar-text-button" aria-label="Quitar solución elegida" onClick={() => {
        inquiry?.selectSolution(null);
        form.current?.querySelector("input")?.focus({ preventScroll: true });
      }}>Quitar</button>
      <p className="ar-selection-help">La selección se conserva solo en esta demo. Al escribir por correo o WhatsApp, indica también la solución.</p>
    </div> : null}
    {compact ? <>
      <div className="ar-form-row">
        <label htmlFor="ar-name">Nombre<input id="ar-name" autoComplete="off" required maxLength={100} {...fieldState("ar-name")} />{fieldError("ar-name")}</label>
        <label htmlFor="ar-contact">Email o teléfono<input id="ar-contact" type="text" autoComplete="off" required maxLength={254} {...fieldState("ar-contact")} />{fieldError("ar-contact")}</label>
      </div>
      <label htmlFor="ar-need">¿Qué necesitas revisar?<textarea id="ar-need" rows={3} required maxLength={2000} placeholder="Localidad, uso del espacio y daño visible." {...fieldState("ar-need", "ar-need-limit")} />{fieldError("ar-need")}<span className="ar-note" id="ar-need-limit">Hasta 2000 caracteres. Los tres campos son obligatorios.</span></label>
    </> : <>
    <div className="ar-form-row">
      <label htmlFor="ar-name">Nombre<input id="ar-name" autoComplete="off" required maxLength={100} {...fieldState("ar-name")} />{fieldError("ar-name")}</label>
      <label htmlFor="ar-email">Correo electrónico<input id="ar-email" type="email" autoComplete="off" maxLength={254} {...fieldState("ar-email", "ar-contact-choice")} />{fieldError("ar-email")}</label>
    </div>
    <p id="ar-contact-choice" className="ar-note">Indica un correo electrónico o un teléfono.</p>
    <div className="ar-form-row"><label htmlFor="ar-phone">Teléfono<input id="ar-phone" type="tel" autoComplete="off" maxLength={30} {...fieldState("ar-phone", "ar-contact-choice")} />{fieldError("ar-phone")}</label><label htmlFor="ar-city">Localidad<input id="ar-city" required maxLength={100} autoComplete="off" {...fieldState("ar-city")} />{fieldError("ar-city")}</label></div>
    <label htmlFor="ar-country">País<input id="ar-country" required maxLength={100} autoComplete="off" {...fieldState("ar-country")} />{fieldError("ar-country")}</label>
    <label htmlFor="ar-need">¿Qué necesitas revisar?<textarea id="ar-need" required maxLength={2000} {...fieldState("ar-need")} />{fieldError("ar-need")}</label>
    <details className="ar-contact-optional"><summary>Datos adicionales (opcionales)</summary>
      <label htmlFor="ar-company">Empresa<input id="ar-company" maxLength={150} autoComplete="off" {...fieldState("ar-company")} />{fieldError("ar-company")}</label>
      <div className="ar-form-row"><label htmlFor="ar-area">Superficie aproximada<input id="ar-area" maxLength={100} {...fieldState("ar-area")} />{fieldError("ar-area")}</label><label htmlFor="ar-deadline">Plazo deseado<input id="ar-deadline" maxLength={150} {...fieldState("ar-deadline")} />{fieldError("ar-deadline")}</label></div>
      <label htmlFor="ar-photos">Fotografías<input id="ar-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple {...fieldState("ar-photos", "ar-photo-limit")} />{fieldError("ar-photos")}</label>
      <p id="ar-photo-limit" className="ar-note">Hasta cinco JPG, PNG o WebP, de 10 MB cada una. No se suben archivos.</p>
    </details>
    </>}
    <div className="ar-form-actions"><button className="ar-demo-button" type="submit" disabled={!hydrated}>Revisar ejemplo</button><button type="reset" className="ar-text-button">Borrar</button></div>
    <p className="ar-form-status" role="status" aria-atomic="true">{status}</p>
    <noscript><p>La revisión local necesita JavaScript. Puedes consultar los datos de contacto del pie.</p></noscript>
    {!compact ? <p className="ar-note">Revisión local sin envío ni almacenamiento. No introduzcas datos personales reales en esta preview.</p> : null}
    {feedback.type === "result" && <div className="ar-review" ref={result} tabIndex={-1} aria-labelledby="ar-review-heading">
      <h3 id="ar-review-heading">Resumen de demostración</h3>{selectedSolution ? <p><strong>Solución: {selectedSolution}</strong></p> : null}<p>{feedback.summary}</p><p>No se ha enviado ninguna solicitud.</p>
      <button type="button" className="ar-text-button" onClick={() => { setFeedback({ type: "editing" }); form.current?.querySelector("input")?.focus(); }}>Editar consulta</button>
      {selectedSolution ? <button type="button" className="ar-text-button" onClick={() => {
        const link = form.current?.closest(".ar-home")?.querySelector<HTMLAnchorElement>(".ar-solution-consult[aria-current=true]");
        const solution = link?.closest("article");
        if (!solution || !link) return;
        window.location.hash = solution.id;
        solution.scrollIntoView({ block: "start" });
        solution.querySelector<HTMLElement>(".ar-solution-heading")?.focus({ preventScroll: true });
      }}>Volver a la solución</button> : null}
    </div>}
  </form>;
}
