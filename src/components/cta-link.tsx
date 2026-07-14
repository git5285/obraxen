type CtaLinkProps = {
  href: string;
  children: string;
  className?: string;
};

export function CtaLink({ href, children, className = "btn btn-acento" }: CtaLinkProps) {
  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}
