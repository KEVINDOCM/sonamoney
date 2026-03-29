import {
  BarChart2,
  Globe,
  Shield,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface Feature {
  icon: LucideIcon
  color: string
  iconColor: string
  title: string
  desc: string
}

export const features: Feature[] = [
  {
    icon: Wallet,
    color: "bg-[#E6F7F6]",
    iconColor: "text-[#00B9A7]",
    title: "Track Everything",
    desc: "Income, expenses, and transfers in one place. Never lose track of where your money goes.",
  },
  {
    icon: Target,
    color: "bg-[#FFF8E6]",
    iconColor: "text-[#FFB800]",
    title: "Smart Budgets",
    desc: "Set spending limits per category. Get warned before you overspend.",
  },
  {
    icon: BarChart2,
    color: "bg-[#F0EFFE]",
    iconColor: "text-[#6366F1]",
    title: "Visual Analytics",
    desc: "Beautiful charts that show your spending trends, top categories, and monthly comparisons.",
  },
  {
    icon: TrendingUp,
    color: "bg-[#E6FAF4]",
    iconColor: "text-[#00C48C]",
    title: "Spending Insights",
    desc: "AI-powered insights that tell you exactly where to cut costs and how to save more.",
  },
  {
    icon: Globe,
    color: "bg-[#FFF0F0]",
    iconColor: "text-[#FF5B5B]",
    title: "Multi Currency",
    desc: "Track money in any currency with real-time exchange rates. Perfect for global users.",
  },
  {
    icon: Shield,
    color: "bg-[#E6F7F6]",
    iconColor: "text-[#00B9A7]",
    title: "Secure & Private",
    desc: "Your data is encrypted and never shared. You own your financial data, always.",
  },
]

export interface FAQ {
  q: string
  a: string
}

export const faqs: FAQ[] = [
  {
    q: "Is SonaMoney free to use?",
    a: "Yes, SonaMoney is completely free. No hidden fees, no premium tiers — all features are available to everyone.",
  },
  {
    q: "Is my financial data secure?",
    a: "Absolutely. We use Supabase with row-level security, meaning only you can access your data. It is never sold or shared.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. SonaMoney is fully responsive and works perfectly on mobile browsers. A PWA install option is also available.",
  },
  {
    q: "Does it support multiple currencies?",
    a: "Yes. You can track transactions in any currency with automatic conversion using real-time exchange rates.",
  },
  {
    q: "Can I export my data?",
    a: "Yes. You can export your transactions as PDF or Excel at any time from the transactions page.",
  },
  {
    q: "Do I need to install anything?",
    a: "No installation needed. Just open the web app, create an account, and start tracking your finances instantly.",
  },
]

export const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "SonaMoney",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web, iOS, Android",
      "browserRequirements": "Requires JavaScript",
      "url": process.env.NEXT_PUBLIC_APP_URL || "https://sonamoney.my.id",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free forever financial tracker"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1250"
      }
    },
    {
      "@type": "FinancialService",
      "name": "SonaMoney",
      "description": "Free personal financial tracker and budget app with real-time multi-currency analytics.",
      "image": `${process.env.NEXT_PUBLIC_APP_URL || "https://sonamoney.my.id"}/icon-512.svg`,
      "url": process.env.NEXT_PUBLIC_APP_URL || "https://sonamoney.my.id",
      "priceRange": "$0",
      "areaServed": ["ID", "US", "Global"],
      "provider": {
        "@type": "Organization",
        "name": "SonaMoney"
      }
    }
  ]
}

export const getFaqPageLd = (faqs: FAQ[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
})
