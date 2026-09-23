import { NotFoundContent } from "@/components/not-found-content";
import { defaultLocale, getDictionary } from "@/lib/i18n";

export default function NotFound() {
  const copy = getDictionary(defaultLocale).notFound;

  return (
    <NotFoundContent copy={copy} href={"/en/"} />
  );
}
