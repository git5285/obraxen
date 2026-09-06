import type { Dictionary } from "@/lib/dictionaries/types";
import { brand } from "@/lib/brand";
import { publicProjects } from "@/lib/projects";

export function ContactUnavailable({
  copy,
  projectsUrl,
}: {
  copy: Dictionary["contact"];
  projectsUrl: string;
}) {
  return (
    <div className="form form-pendiente contact-unavailable">
      <p className="form-estado">{copy.kicker}</p>
      <h2>{copy.unavailableTitle}</h2>
      <p>{copy.unavailableBody}</p>
      <div className="contact-channels">
        {brand.email ? (
          <a href={`mailto:${brand.email}`} data-analytics-event="contact_channel_select" data-analytics-channel="email">{brand.email}</a>
        ) : null}
        {brand.telefono ? (
          <a href={`tel:${brand.telefono.replace(/[^+\d]/g, "")}`} data-analytics-event="contact_channel_select" data-analytics-channel="phone">{brand.telefono}</a>
        ) : null}
      </div>
      {publicProjects.length ? <a href={projectsUrl}>{copy.projectsLink} →</a> : null}
    </div>
  );
}
