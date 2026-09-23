import Link from "next/link";
import type { Dictionary } from "@/lib/dictionaries/types";
import styles from "@/app/not-found.module.css";

export function NotFoundContent({ copy, href }: { copy: Dictionary["notFound"]; href: string }) {
  return (
    <main className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.content}>
        <p className={styles.code}>{copy.code}</p>
        <h1 className={styles.title} id="not-found-title">{copy.title}</h1>
        <p className={styles.body}>{copy.body}</p>
        <Link className={styles.link} href={href}>
          {copy.link} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
