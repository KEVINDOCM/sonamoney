"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, CheckCircle } from "lucide-react"

export function CTASection() {
  return (
    <section className="py-16 lg:py-24 px-4 lg:px-6">
      <motion.div
        className="max-w-4xl mx-auto bg-gradient-to-br from-[#00B9A7] to-[#0099A0] rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />

        <motion.div
          className="relative z-10 space-y-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-semibold text-white">Free forever — no credit card needed</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            Start tracking your money in under 2 minutes.
          </h2>

          <p className="text-white/80 text-base max-w-md mx-auto">
            Join thousands of people who use SonaMoney to take control of their financial life.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white text-[#00B9A7] rounded-full font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all duration-200 shadow-md"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white/20 text-white rounded-full font-semibold text-sm hover:bg-white/30 active:scale-95 transition-all duration-200"
            >
              Already have an account
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
