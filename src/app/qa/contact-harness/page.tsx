import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { getDictionary, getPath } from "@/lib/i18n";
import { isLocalQaRequest, QA_ACCESS_HEADER } from "@/lib/qa-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ContactHarnessPage() {
  const requestHeaders = await headers();
  if (!isLocalQaRequest(process.env, {
    host: requestHeaders.get("host"),
    token: requestHeaders.get(QA_ACCESS_HEADER),
  })) {
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
