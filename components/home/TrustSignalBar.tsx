"use client"

import { motion } from "framer-motion"
import { CheckCircle, Shield, Smartphone } from "lucide-react"

const trustItems = [
  {
    icon: Shield,
    title: "Bank-level encryption",
    desc: "256-bit AES encryption. Your data is never sold or shared.",
  },
  {
    icon: CheckCircle,
    title: "Free forever",
    desc: "No hidden fees, no premium tiers. All features, always free.",
  },
  {
    icon: Smartphone,
    title: "Works everywhere",
    desc: "Fully responsive web app. Install as PWA on any device.",
  },
]

export function TrustSignalBar() {
  return (
    <motion.section
      className="py-10 px-4 bg-[#F8FAFB] border-y border-gray-100"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        {trustItems.map((item, index) => (
          <motion.div
            key={item.title}
            className="flex flex-col items-center gap-3 p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.15 }}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#E6F7F6] flex items-center justify-center">
              <item.icon className="w-5 h-5 text-[#00B9A7]" />
            </div>
            <p className="text-sm font-bold text-[#0D1F1E]">{item.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
