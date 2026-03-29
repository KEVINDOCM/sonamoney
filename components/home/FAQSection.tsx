"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { faqs } from "./data"

interface FAQSectionProps {
  openFaq: number | null
  setOpenFaq: (index: number | null) => void
}

export function FAQSection({ openFaq, setOpenFaq }: FAQSectionProps) {
  return (
    <section id="faq" className="py-16 lg:py-24 px-4 lg:px-6 max-w-3xl mx-auto">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl lg:text-4xl font-extrabold text-[#1A1A2E]">Frequently asked questions</h2>
        <p className="text-base text-[#6B7280] mt-3">Everything you need to know about SonaMoney.</p>
      </motion.div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#00B9A7]/30 transition-colors duration-200"
          >
            <button
              onClick={() => setOpenFaq(openFaq === index ? null : index)}
              aria-expanded={openFaq === index ? "true" : "false"}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-150"
            >
              <span className="text-sm font-semibold text-[#1A1A2E] pr-4">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-[#6B7280] shrink-0 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`} />
            </button>
            {openFaq === index && (
              <AnimatePresence>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4">
                    <p className="text-sm text-[#6B7280] leading-relaxed">{faq.a}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
