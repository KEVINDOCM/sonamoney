/**
 * Core Web Vitals Optimization Utilities
 * Utilities for measuring and improving performance metrics
 */

import { useEffect } from "react"
import type { Metric } from "web-vitals"

type Rating = "good" | "needs-improvement" | "poor"

// Web Vitals thresholds (per Google)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
}

// Get rating based on value and thresholds
function getRating(
  value: number,
  thresholds: { good: number; poor: number }
): Rating {
  if (value <= thresholds.good) return "good"
  if (value <= thresholds.poor) return "needs-improvement"
  return "poor"
}

// Report Web Vitals to console and analytics
export function reportWebVitals(metric: Metric & { rating: Rating }) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    })
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    // @ts-ignore - Google Analytics or similar
    window.gtag?.("event", metric.name, {
      event_category: "Web Vitals",
      value: Math.round(metric.value),
      event_label: metric.rating,
      non_interaction: true,
    })
  }
}

// Hook to measure Web Vitals
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Dynamic import of web-vitals library
    import("web-vitals").then((webVitals) => {
      // Largest Contentful Paint
      webVitals.onLCP((metric: Metric) => {
        reportWebVitals({ ...metric, rating: getRating(metric.value, THRESHOLDS.LCP) })
      })

      // Interaction to Next Paint (replaces FID)
      webVitals.onINP?.((metric: Metric) => {
        reportWebVitals({ ...metric, rating: getRating(metric.value, THRESHOLDS.INP) })
      })

      // Cumulative Layout Shift
      webVitals.onCLS((metric: Metric) => {
        reportWebVitals({ ...metric, rating: getRating(metric.value, THRESHOLDS.CLS) })
      })

      // First Contentful Paint
      webVitals.onFCP((metric: Metric) => {
        reportWebVitals({ ...metric, rating: getRating(metric.value, THRESHOLDS.FCP) })
      })

      // Time to First Byte
      webVitals.onTTFB((metric: Metric) => {
        reportWebVitals({ ...metric, rating: getRating(metric.value, THRESHOLDS.TTFB) })
      })
    })
  }, [])
}

// Optimize image loading
export function getOptimizedImageProps(
  priority: boolean = false,
  loading: "eager" | "lazy" = "lazy"
) {
  return {
    loading: priority ? "eager" : loading,
    priority,
    // Use Next.js Image component optimizations
    quality: 80,
    // Enable blur placeholder for better perceived performance
    placeholder: "blur" as const,
    blurDataURL:
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48L3N2Zz4=",
  }
}

// Defer non-critical scripts
export function deferScript(src: string, callback?: () => void) {
  if (typeof window === "undefined") return

  const script = document.createElement("script")
  script.src = src
  script.defer = true
  script.async = true

  if (callback) {
    script.onload = callback
  }

  document.body.appendChild(script)
}

// Preload critical resources
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof window === "undefined") return

  const link = document.createElement("link")
  link.rel = "preload"
  link.href = href
  link.as = as
  if (type) link.type = type

  document.head.appendChild(link)
}

// Lazy load below-the-fold content
export function useLazyLoad(
  selector: string,
  options: IntersectionObserverInit = {}
) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const elements = document.querySelectorAll(selector)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
        ...options,
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [selector, options])
}

// Optimize font loading
export function useFontOptimization() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Prevent FOIT (Flash of Invisible Text)
    document.documentElement.classList.add("fonts-loading")

    // Use Font Loading API if available
    if ("fonts" in document) {
      // @ts-ignore
      document.fonts.ready.then(() => {
        document.documentElement.classList.remove("fonts-loading")
        document.documentElement.classList.add("fonts-loaded")
      })
    }
  }, [])
}

// Performance budget monitoring
export function checkPerformanceBudget() {
  if (typeof window === "undefined" || !("performance" in window)) return

  const navigation = performance.getEntriesByType(
    "navigation"
  )[0] as PerformanceNavigationTiming

  if (!navigation) return

  const metrics = {
    // Total transfer size
    transferSize: navigation.transferSize,
    // DOM content loaded
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
    // Load complete
    loadComplete: navigation.loadEventEnd - navigation.startTime,
  }

  // Check against budgets
  const budgets = {
    transferSize: 500 * 1024, // 500KB
    domContentLoaded: 2000, // 2 seconds
    loadComplete: 3000, // 3 seconds
  }

  const warnings = []

  if (metrics.transferSize > budgets.transferSize) {
    warnings.push(`Transfer size ${(metrics.transferSize / 1024).toFixed(0)}KB exceeds ${budgets.transferSize / 1024}KB budget`)
  }

  if (metrics.domContentLoaded > budgets.domContentLoaded) {
    warnings.push(`DOMContentLoaded ${metrics.domContentLoaded.toFixed(0)}ms exceeds ${budgets.domContentLoaded}ms budget`)
  }

  if (warnings.length > 0 && process.env.NODE_ENV === "development") {
    console.warn("[Performance Budget]", warnings)
  }

  return { metrics, budgets, warnings }
}
