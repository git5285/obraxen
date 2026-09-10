import { getImageProps, type ImageProps } from "next/image";

export function ResponsiveImage(imageProps: ImageProps) {
  const { loading, priority, ...remainingProps } = imageProps;
  const loadingProps = loading ? { loading } : priority ? { priority } : { loading: "lazy" as const };
  const { props } = getImageProps({ ...remainingProps, ...loadingProps });

  // getImageProps conserva srcset, sizes, preload y optimizacion. Se elimina el
  // style="color:transparent" automatico para cumplir style-src 'self'.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} style={undefined} alt={imageProps.alt} />;
}
