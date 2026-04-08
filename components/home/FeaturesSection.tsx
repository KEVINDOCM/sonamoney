"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "@/lib/hooks/useReducedMotion"
import { features } from "./data"

export function FeaturesSection() {
  const prefersReducedMotion = useReducedMotion()
  return (
    <section id="features" className="py-16 lg:py-24 px-4 lg:px-6 max-w-6xl mx-auto">
      {/* Section header */}
      <motion.div
        className="text-center mb-12"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
      >
        <div className="inline-flex items-center gap-2 bg-[#E6F7F6] rounded-full px-4 py-1.5 mb-4">
          <span className="text-xs font-semibold text-[#00B9A7]">Everything you need</span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] leading-tight">
          Powerful features, <span className="text-[#00B9A7]">zero complexity</span>
        </h2>
        <p className="text-base text-[#6B7280] mt-4 max-w-xl mx-auto">
          Everything you need to understand and control your finances — without the learning curve.
        </p>
      </motion.div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : index * 0.1 }}
            whileHover={prefersReducedMotion ? undefined : {
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            className="relative bg-white rounded-2xl border border-gray-100 p-6 space-y-4 cursor-default group overflow-hidden"
          >
            {/* Bento Grid hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00B9A7]/5 via-transparent to-[#6366F1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <div className="mt-4">
                <h3 className="text-base font-bold text-[#1A1A2E] mb-1">{feature.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
