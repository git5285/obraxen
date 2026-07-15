import type { Dictionary } from "@/lib/dictionaries/types";
import type { NavigationItem } from "@/lib/homepage";
import type { LanguageLink } from "./language-switcher";
import { LanguageSwitcher } from "./language-switcher";
import { LogoMark } from "./logo-mark";

type SiteFooterProps = {
  brandName: string | null;
  serviceAreaLabel: string;
  priorityMarketsLabel: string;
  hasContactChannel: boolean;
  contactHref: string;
  homeHref: string;
  navigation: readonly NavigationItem[];
  languageLabel: string;
  languageLinks: readonly LanguageLink[];
  copy: Dictionary["footer"];
  common: Dictionary["common"];
  contactCopy: Pick<Dictionary["contact"], "kicker" | "title" | "intro" | "submit">;
  contact: {
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    schedule: string | null;
  };
  legal: {
    businessName: string | null;
    taxId: string | null;
    address: string | null;
    legalUrl: string;
    privacyUrl: string;
    cookiesUrl: string;
  };
};

export function SiteFooter({
  brandName,
  serviceAreaLabel,
  priorityMarketsLabel,
  hasContactChannel,
  contactHref,
  homeHref,
  navigation,
  languageLabel,
  languageLinks,
  copy,
  common,
  contactCopy,
  contact,
  legal,
}: SiteFooterProps) {
  const phoneHref = contact.phone?.replace(/[^+\d]/g, "");
  const whatsappHref = contact.whatsapp?.replace(/\D/g, "");

  return (
    <footer className="cierre" id="contact">
      {hasContactChannel ? (
        <div className="cta-fila">
          <div>
            <p className="kicker">{contactCopy.kicker}</p>
            <h2>{contactCopy.title}</h2>
            <p>{contactCopy.intro}</p>
          </div>
          <a
            className="btn btn-acento"
            href={contactHref}
            data-analytics-event="cta_select"
            data-analytics-location="footer"
            data-analytics-destination={contactHref}
          >
            {contactCopy.submit}
          </a>
        </div>
      ) : null}

      <div className="foot">
        <div className="marca">
          <LogoMark brandName={brandName} href={homeHref} homeLabel={common.home} className="logo logo-footer" />
          <p>{copy.industrialRepair.replace("{area}", serviceAreaLabel)}</p>
          <p>{copy.primaryMarkets.replace("{markets}", priorityMarketsLabel)}</p>
          <p className="legal-details">
            {legal.businessName ? <><strong>{copy.legalName}</strong> {legal.businessName}<br /></> : null}
            {legal.taxId ? <><strong>{copy.taxId}</strong> {legal.taxId}<br /></> : null}
            {legal.address ? <><strong>{copy.address}</strong> {legal.address}<br /></> : null}
            <strong>{copy.activity}</strong> {copy.activityBody}
          </p>
        </div>
        <div>
          <h3>{copy.general}</h3>
          <ul>
            <li><a href={homeHref}>{common.home}</a></li>
            {navigation.filter((item) => item.section).map((item) => (
              <li key={item.href}><a href={`${homeHref}${item.href}`}>{item.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{copy.services}</h3>
          <ul>
            <li><a href={`${homeHref}#services`}>{copy.services}</a></li>
            <li><a href={legal.legalUrl}>{copy.legalNotice}</a></li>
            <li><a href={legal.privacyUrl}>{copy.privacy}</a></li>
            <li><a href={legal.cookiesUrl}>{copy.cookies}</a></li>
          </ul>
        </div>
        {contact.email || contact.phone || contact.whatsapp || contact.schedule ? (
          <div>
            <h3>{hasContactChannel ? copy.contact : copy.hours}</h3>
            <ul>
              {contact.email ? <li><a href={`mailto:${contact.email}`} data-analytics-event="contact_channel_select" data-analytics-channel="email">{contact.email}</a></li> : null}
              {contact.whatsapp && whatsappHref ? <li><a href={`https://wa.me/${whatsappHref}`} rel="noopener" data-analytics-event="contact_channel_select" data-analytics-channel="whatsapp">WhatsApp</a></li> : null}
              {contact.phone && phoneHref ? <li><a href={`tel:${phoneHref}`} data-analytics-event="contact_channel_select" data-analytics-channel="phone">{contact.phone}</a></li> : null}
              {contact.schedule ? <li>{contact.schedule}</li> : null}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="legal">
        <span>{brandName ? `© 2026 ${brandName}. ${copy.rights}` : copy.fallbackCopyright}</span>
        <span>
          <a href={legal.legalUrl}>{copy.legalNotice}</a> ·{" "}
          <a href={legal.privacyUrl}>{copy.privacy}</a> ·{" "}
          <a href={legal.cookiesUrl}>{copy.cookies}</a>
        </span>
      </div>
      <LanguageSwitcher label={languageLabel} links={languageLinks} />
    </footer>
  );
}
