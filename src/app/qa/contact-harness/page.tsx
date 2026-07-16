import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { getDictionary, getPath } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ContactHarnessPage() {
  if (process.env.QA_CONTACT_HARNESS !== "local-playwright" || process.env.VERCEL) {
    notFound();
  }

  const locale = "en";
  const copy = getDictionary(locale).contact;
  return (
    <main className="contact-page" id="contact-content">
      <p className="kicker">{copy.kicker}</p>
      <h1>{copy.title}</h1>
      <p className="contact-intro">{copy.intro}</p>
      <ContactForm
        locale={locale}
        copy={copy}
        privacyUrl={getPath(locale, "privacy")}
      />
    </main>
  );
}
