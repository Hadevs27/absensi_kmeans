import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Absensi K-Means",
  description: "Sistem informasi absensi berbasis web dengan Drizzle ORM."
};

const hydrationAttributeGuard = `
(() => {
  const shouldRemove = (name) =>
    name === "bis_register" || name.startsWith("bis_") || name.startsWith("__processed_");

  const clean = (root = document) => {
    if (root.documentElement) {
      for (const attribute of Array.from(root.documentElement.attributes || [])) {
        if (shouldRemove(attribute.name)) root.documentElement.removeAttribute(attribute.name);
      }
    }
    root.querySelectorAll?.("*").forEach((node) => {
      for (const attribute of Array.from(node.attributes || [])) {
        if (shouldRemove(attribute.name)) node.removeAttribute(attribute.name);
      }
    });
  };

  clean();
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && shouldRemove(mutation.attributeName || "")) {
        mutation.target.removeAttribute(mutation.attributeName);
      }
    }
  }).observe(document.documentElement, { attributes: true, subtree: true });
})();
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: hydrationAttributeGuard }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
