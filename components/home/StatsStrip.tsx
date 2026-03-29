"use client"

import { motion } from "framer-motion"
import { AnimatedNumber } from "./AnimatedNumber"

const stats = [
  { value: "100%", label: "Free forever" },
  { value: "256-bit", label: "Encryption" },
  { value: "∞", label: "Transactions" },
]

export function StatsStrip() {
  return (
    <motion.section
      className="bg-[#0D1F1E] border-y border-gray-800 py-8 px-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center divide-x divide-white/10">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <p className="text-2xl lg:text-3xl font-extrabold text-[#00B9A7]">
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
