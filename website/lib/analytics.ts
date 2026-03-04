'use client'

import type { MarketingEventName } from '@/lib/site'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(
  eventName: MarketingEventName,
  properties: Record<string, string | number | boolean | undefined> = {}
): void {
  if (typeof window === 'undefined') return

  window.dataLayer?.push({ event: eventName, ...properties })
  window.gtag?.('event', eventName, properties)

  if (process.env.NODE_ENV !== 'production') {
    // Keep visibility when analytics tooling is not wired yet.
    console.info('[analytics]', eventName, properties)
  }
}
