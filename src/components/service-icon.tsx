import type { ServiceIcon as ServiceIconName } from "@/lib/homepage";

const paths: Record<ServiceIconName, React.ReactNode> = {
  joint: (
    <>
      <path d="M3 12h7M14 12h7M10 12l2-3 2 3-2 3z" />
      <path d="M3 7v10M21 7v10" />
    </>
  ),
  crack: (
    <>
      <path d="M3 20L9 14l3 2 4-6 5 4" />
      <path d="M3 20h18" />
    </>
  ),
  level: (
    <>
      <path d="M4 16h16M4 20h16" />
      <path d="M6 16V9l6-4 6 4v7" />
    </>
  ),
  surface: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    </>
  ),
};

export function ServiceIcon({ name }: { name: ServiceIconName }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
