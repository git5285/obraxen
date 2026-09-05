type LogoMarkProps = {
  brandName: string | null;
  href?: string;
  className?: string;
  homeLabel?: string;
};

export function LogoMark({
  brandName,
  href = "#inicio",
  className = "logo",
  homeLabel = "Home",
}: LogoMarkProps) {
  if (brandName) {
    const accent = brandName.toLocaleLowerCase().indexOf("x");
    const accentAt = accent >= 0 ? accent : Math.max(0, brandName.length - 1);
    return (
      <a className={className} href={href} aria-label={`${brandName}, ${homeLabel}`}>
        <svg className="logo-symbol" viewBox="0 0 32 32" aria-hidden="true">
          <path className="logo-symbol-slab" d="M3 3h10l3 13-3 13H3zM29 3H19l-3 13 3 13h10z" />
          <path className="logo-symbol-seam" d="M13 3h5l-2 9 4-9h5l-7 13 7 13h-5l-4-9-2 9h-5l7-13z" />
        </svg>
        <span className="logo-word">
          <span className="logo-name">{brandName.slice(0, accentAt)}</span>
          <span className="logo-emphasis">{brandName.charAt(accentAt)}</span>
          <span className="logo-name">{brandName.slice(accentAt + 1)}</span>
        </span>
      </a>
    );
  }

  return (
    <a className={className} href={href} aria-label={homeLabel}>
      <svg className="logo-provisional" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="5" width="24" height="22" rx="7" />
        <path d="M8 21l6-5 4 3 6-7" />
      </svg>
    </a>
  );
}
