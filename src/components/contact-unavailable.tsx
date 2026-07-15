import type { Dictionary } from "@/lib/dictionaries/types";

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
      <a href={projectsUrl}>{copy.projectsLink} →</a>
    </div>
  );
}
