import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { PostHogProvider } from "@/components/posthog-provider";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Accessibility Auditor",
  description:
    "Scan any web page for WCAG issues and get plain-language explanations and code fixes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <PostHogProvider>
          <MotionProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:border-2 focus:border-ink focus:bg-yellow focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
              {children}
            </main>
            <SiteFooter />
          </MotionProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
