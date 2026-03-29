"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Navbar } from "@/components/home/Navbar"
import { HeroSection } from "@/components/home/HeroSection"
import { StatsStrip } from "@/components/home/StatsStrip"
import { FeaturesSection } from "@/components/home/FeaturesSection"
import { TrustSignalBar } from "@/components/home/TrustSignalBar"
import { CTASection } from "@/components/home/CTASection"
import { FAQSection } from "@/components/home/FAQSection"
import { Footer } from "@/components/home/Footer"
import { jsonLd, getFaqPageLd, faqs } from "@/components/home/data"

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqPageLd = getFaqPageLd(faqs)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageLd),
        }}
      />
      <main className="min-h-screen bg-white text-[#1A1A2E] pb-16 md:pb-0">
        <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <HeroSection />
        <StatsStrip />
        <FeaturesSection />
        <TrustSignalBar />
        <CTASection />
        <FAQSection openFaq={openFaq} setOpenFaq={setOpenFaq} />
        <Footer />
      </main>

      {/* Sticky mobile CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-3">
        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 h-12 w-full bg-[#00B9A7] text-white rounded-full font-semibold text-sm hover:bg-[#007A6E] active:scale-95 transition-all duration-200 shadow-md shadow-[#00B9A7]/25"
        >
          Get started free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  )
}
