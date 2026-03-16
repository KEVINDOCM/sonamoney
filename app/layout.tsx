import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { CurrencyProvider } from "@/lib/contexts/CurrencyContext";
import { TranslationProvider } from "@/lib/contexts/TranslationContext";

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://sona-money.vercel.app"
  ),
  title: {
    default: "SonaMoney — Personal Finance Tracker",
    template: "%s | SonaMoney",
  },
  description:
    "Track income, expenses, and budgets easily. " +
    "Aplikasi keuangan pribadi gratis dengan analytics, " +
    "multi-currency, dan AI assistant. Free personal " +
    "finance tracker for everyone.",
  keywords: [
    "personal finance",
    "budget tracker",
    "expense tracker",
    "money management",
    "financial planning",
    "free finance app",
    "aplikasi keuangan",
    "catat pengeluaran",
    "manajemen keuangan",
    "tracker keuangan pribadi",
    "aplikasi budgeting gratis",
    "SonaMoney",
  ],
  authors: [{ name: "SonaMoney" }],
  creator: "SonaMoney",
  publisher: "SonaMoney",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    alternateLocale: ["en_US"],
    url: "https://sona-money.vercel.app",
    siteName: "SonaMoney",
    title: "SonaMoney — Personal Finance Tracker",
    description:
      "Track income, expenses, and budgets easily. " +
      "Free personal finance app with analytics and AI.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SonaMoney — Personal Finance Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SonaMoney — Personal Finance Tracker",
    description:
      "Free personal finance tracker. " +
      "Track income, expenses, budgets, and insights.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://sona-money.vercel.app",
    languages: {
      "en-US": "https://sona-money.vercel.app",
      "id-ID": "https://sona-money.vercel.app",
    },
  },
  category: "finance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SonaMoney",
    startupImage: "/icon-192.png",
  },
  icons: {
    apple: "/icon-192.png",
  },
  other: {
    google: "notranslate",
    "google-site-verification": "-1WWLDq0PJVgp_CH-yJj5W87y_5zBlw4yw4DQUmjBpU",
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
              url: "https://sona-money.vercel.app",
              logo: "https://sona-money.vercel.app/icon-512.png",
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

        {/* Preconnect to Google Fonts if used */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />

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
      <body className="bg-[#F5F7FA] text-[#1A1A2E]">
        <ToastProvider>
          <TranslationProvider>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </TranslationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}


