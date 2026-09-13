import Link from "next/link";
import { defaultLocale, getDictionary } from "@/lib/i18n";
import styles from "./not-found.module.css";

export default function NotFound() {
  const copy = getDictionary(defaultLocale).notFound;

  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.content}>
        <p className={styles.code}>{copy.code}</p>
        <h1 className={styles.title} id="not-found-title">{copy.title}</h1>
        <p className={styles.body}>{copy.body}</p>
        <Link className={styles.link} href="/en/">
          {copy.link} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
