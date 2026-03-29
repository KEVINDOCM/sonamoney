"use client"

import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useTranslation } from "@/lib/i18n/useTranslation"

interface NavbarProps {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export function Navbar({ mobileMenuOpen, setMobileMenuOpen }: NavbarProps) {
  const { t } = useTranslation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#00B9A7] flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-[#1A1A2E] text-base">SonaMoney</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-200 font-medium"
          >
            Features
          </a>
          <a
            href="#faq"
            className="text-sm text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-200 font-medium"
          >
            FAQ
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-[#6B7280] hover:text-[#00B9A7] transition-colors duration-200 px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-[#00B9A7] text-white rounded-full px-5 py-2 hover:bg-[#0099A0] active:scale-95 transition-all duration-200 shadow-sm"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-[#6B7280] hover:bg-gray-100 transition-colors"
          aria-label={mobileMenuOpen ? t("common.closeMenu") : t("common.openMenu")}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#6B7280] py-2 hover:text-[#00B9A7]"
          >
            Features
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-[#6B7280] py-2 hover:text-[#00B9A7]"
          >
            FAQ
          </a>
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/login"
              className="text-center text-sm font-semibold text-[#6B7280] py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-center text-sm font-semibold bg-[#00B9A7] text-white py-2.5 rounded-xl hover:bg-[#0099A0] transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
