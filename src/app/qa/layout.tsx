import type { ReactNode } from "react";
import "../globals.css";

export default function QaLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
