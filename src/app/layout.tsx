import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Accessibility Auditor",
  description:
    "Scan any web page for WCAG issues and get plain-language explanations and code fixes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-blue-800"
        >
          Skip to content
        </a>
        <header className="border-b border-gray-200">
          <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
            <Link href="/" className="rounded text-lg font-semibold text-gray-900">
              AI Accessibility Auditor
            </Link>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-700">
          Powered by axe-core and Claude
        </footer>
      </body>
    </html>
  );
}
