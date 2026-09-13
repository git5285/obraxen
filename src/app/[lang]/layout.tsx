import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { ConsentManagerLoader } from "@/components/consent-manager-loader";
import { resolveRuntimeConfig } from "@/lib/runtime-config";
import { brand } from "@/lib/brand";
import { getDictionary, getPath, isLocale, locales } from "@/lib/i18n";
import { publicActivation } from "@/lib/public-activation";
import { getPublicPublicationState } from "@/lib/publication";
import "../globals.css";
import "../../../css/consent.css";
import "../../../css/legal.css";

const publication = getPublicPublicationState(brand, publicActivation);

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: Pick<LayoutProps<"/[lang]">, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    robots: publication.isPublic
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    ...(brand.dominio ? { metadataBase: new URL(`https://${brand.dominio}`) } : {}),
    icons: {
      icon: brand.nombre?.toLocaleLowerCase() === "obraxen"
        ? { url: "/obraxen-favicon-v14.ico", type: "image/x-icon", sizes: "16x16 32x32" }
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23EA580C'/%3E%3Cpath d='M6 21l6-5 4 3 7-7' stroke='white' stroke-width='3.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dictionary = getDictionary(lang);
  const analytics = resolveRuntimeConfig().analytics;
  const analyticsAvailable = Boolean(analytics.gaMeasurementId || analytics.clarityProjectId);

  return (
    <html lang={lang}>
      <body>
        {children}
        <ConsentManagerLoader
          analyticsAvailable={analyticsAvailable}
          copy={dictionary.consent}
          cookieUrl={getPath(lang, "cookies")}
          privacyUrl={getPath(lang, "privacy")}
        />
      </body>
    </html>
  );
}
