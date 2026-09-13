import { getImageProps, type ImageProps } from "next/image";

export function ResponsiveImage(imageProps: ImageProps) {
  const { props } = getImageProps(imageProps);
  const shouldPreload = Boolean(imageProps.preload || imageProps.priority);
  const imageAttributes = shouldPreload
    ? { ...props, fetchPriority: "high" as const }
    : props;

  // React/Next genera el preload del recurso cuando fetchPriority es high. Se
  // elimina el style="color:transparent" automatico para cumplir style-src
  // 'self' sin duplicar ese hint.
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...imageAttributes} style={undefined} alt={imageProps.alt} />
    </>
  );
}
