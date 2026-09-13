type ProjectJsonLdProps = {
  value: string | null;
};

export function ProjectJsonLd({ value }: ProjectJsonLdProps) {
  if (!value) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: value.replace(/</g, "\\u003c") }}
    />
  );
}
