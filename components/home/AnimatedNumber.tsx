"use client"

import { useState, useEffect } from "react"

interface AnimatedNumberProps {
  value: string
  suffix?: string
}

export function AnimatedNumber({ value, suffix = "" }: AnimatedNumberProps) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const numericValue = parseInt(value.replace(/[^0-9]/g, "")) || 0

  useEffect(() => {
    if (hasAnimated) return

    const duration = 2000
    const steps = 60
    const stepValue = numericValue / steps
    let current = 0
    let step = 0

    const timer = setInterval(() => {
      step++
      current = Math.min(Math.floor(step * stepValue), numericValue)
      setCount(current)

      if (step >= steps) {
        setCount(numericValue)
        setHasAnimated(true)
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [numericValue, hasAnimated])

  return <span>{value.startsWith("∞") ? "∞" : count}{suffix}</span>
}
