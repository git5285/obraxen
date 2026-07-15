type CtaLinkProps = {
  href: string;
  children: string;
  className?: string;
  eventLocation?: string;
};

export function CtaLink({
  href,
  children,
  className = "btn btn-acento",
  eventLocation = "unknown",
}: CtaLinkProps) {
  return (
    <a
      className={className}
      href={href}
      data-analytics-event="cta_select"
      data-analytics-location={eventLocation}
      data-analytics-destination={href}
    >
      {children}
    </a>
  );
}
