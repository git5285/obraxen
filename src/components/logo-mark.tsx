type LogoMarkProps = {
  brandName: string | null;
  href?: string;
  className?: string;
};

export function LogoMark({
  brandName,
  href = "#inicio",
  className = "logo",
}: LogoMarkProps) {
  if (brandName) {
    const cut = Math.max(0, brandName.length - 2);
    return (
      <a className={className} href={href} aria-label={`${brandName}, inicio`}>
        {brandName.slice(0, cut)}
        <span>{brandName.slice(cut)}</span>
      </a>
    );
  }

  return (
    <a className={className} href={href} aria-label="Inicio">
      <svg className="logo-provisional" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="5" width="24" height="22" rx="7" />
        <path d="M8 21l6-5 4 3 6-7" />
      </svg>
    </a>
  );
}
