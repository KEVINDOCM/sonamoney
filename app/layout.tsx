import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { getSiteUrl } from "@/lib/utils/url";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";
import { TranslationProvider } from "@/lib/contexts/TranslationContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "SonaMoney — Best Free Financial Tracker & Budget App 2026",
    template: "%s | SonaMoney",
  },
  description:
    "Track income, expenses, and budgets easily with SonaMoney, the ultimate free financial tracker. " +
    "Aplikasi keuangan pribadi gratis dengan analytics real-time, " +
    "multi-currency, AI assistant & bank-level security. " +
    "Free personal financial tracker app for everyone. No credit card required.",
  keywords: [
    "financial tracker",
    "free financial tracker",
    "personal financial tracker",
    "best financial tracker",
    "budget tracker app",
    "expense tracker free",
    "money management app",
    "financial planning tools",
    "free finance app 2026",
    "best budget app",
    "spending tracker",
    "income expense tracker",
    "aplikasi keuangan indonesia",
    "catat pengeluaran harian",
    "aplikasi budgeting gratis",
    "manajemen keuangan pribadi",
    "tracker pengeluaran",
    "aplikasi finansial terbaik",
    "SonaMoney",
    "mint alternative",
    "ynab alternative free",
  ],
  authors: [{ name: "SonaMoney", url: getSiteUrl() }],
  creator: "SonaMoney",
  publisher: "SonaMoney",
  applicationName: "SonaMoney",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    alternateLocale: ["en_US"],
    url: getSiteUrl(),
    siteName: "SonaMoney",
    title: "SonaMoney — Best Free Financial Tracker & Budget App 2026",
    description:
      "Track income, expenses, and budgets easily. " +
      "Free financial tracker with real-time analytics, multi-currency, and AI assistant.",
    images: [
      {
        url: `${getSiteUrl()}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SonaMoney — Best Free Financial Tracker & Budget App",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@sonamoney",
    creator: "@sonamoney",
    title: "SonaMoney — Best Free Financial Tracker & Budget App 2026",
    description:
      "Free financial tracker. Track income, expenses, budgets, and insights with AI assistance.",
    images: {
      url: `${getSiteUrl()}/og-image.png`,
      alt: "SonaMoney — Best Free Financial Tracker & Budget App",
      width: 1200,
      height: 630,
    },
  },
  alternates: {
    canonical: getSiteUrl(),
    languages: {
      "en-US": getSiteUrl(),
      "id-ID": `${getSiteUrl()}/id`,
    },
  },
  category: "finance",
  classification: "Business > Financial Services > Personal Finance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SonaMoney",
    startupImage: "/icon-192.svg",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
  },
  other: {
    google: "notranslate",
    "google-site-verification": "-1WWLDq0PJVgp_CH-yJj5W87y_5zBlw4yw4DQUmjBpU",
    "msvalidate.01": "",
    "facebook-domain-verification": "",
    "og:email": "support@sonamoney.my.id",
  },
};

export const viewport: Viewport = {
  themeColor: "#00B9A7",
  width: "device-width",
  initialScale: 1,
}

export interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" translate="no">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                document.body.classList.add('hydrated');
              });
            `,
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SonaMoney",
              url: getSiteUrl(),
              logo: `${getSiteUrl()}/icon-512.svg`,
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                availableLanguage: ["English", "Indonesian"],
              },
            }),
          }}
        />

        {/* Preconnect to Supabase */}
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
        />

        {/* DNS prefetch for external APIs */}
        <link
          rel="dns-prefetch"
          href="https://generativelanguage.googleapis.com"
        />
        <link
          rel="dns-prefetch"
          href="https://open.er-api.com"
        />
      </head>
      <body className={`${inter.className} bg-brand-background text-brand-textPrimary dark:bg-darkSurface dark:text-slate-200`}>
        <ToastProvider>
          <TranslationProvider>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </TranslationProvider>
        </ToastProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}


