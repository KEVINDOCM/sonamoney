import Link from "next/link"
import { Shield } from "lucide-react"

const productLinks = [
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/signup" },
  { label: "Dashboard", href: "/dashboard" },
]

const features = [
  "Transaction Tracking",
  "Budget Management",
  "Analytics & Charts",
  "Multi Currency",
  "AI Assistant",
  "Export PDF & Excel",
]

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security", href: "/security" },
]

export function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-white py-12 px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#00B9A7] flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-white">SonaMoney</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Personal finance made simple. Take control of your money, one transaction at a time.
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00C48C] animate-pulse" />
              <span className="text-xs text-white/50">Free forever</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Product</p>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features list */}
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Features</p>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="text-sm text-white/60 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[#00B9A7] shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Legal</p>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">© 2026 SonaMoney. All rights reserved.</p>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Shield className="w-3 h-3" />
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
