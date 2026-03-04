import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { Pricing } from '@/components/Pricing'
import { Download } from '@/components/Download'
import { Footer } from '@/components/Footer'
import { HomeFaq, HOME_FAQ_ITEMS } from '@/components/HomeFaq'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL, SKILLY_ONE_LINER } from '@/lib/site'
import Link from 'next/link'

const softwareAppSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Skilly',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'macOS, Windows, Linux',
  offers: {
    '@type': 'Offer',
    price: '5',
    priceCurrency: 'USD'
  },
  description: SKILLY_ONE_LINER,
  url: SITE_URL
}

const faqSchema: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <JsonLd id="software-application-schema" data={softwareAppSchema} />
      <JsonLd id="homepage-faq-schema" data={faqSchema} />
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Download />
      <section className="border-t border-[#E5E7EB] bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl">
            Search and AI-reference resources
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-[#6B7280]">
            Core pages designed for both organic search and AI answer extraction.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Link
              href="/guides/skilly-glossary"
              className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-5 transition hover:border-[#D1D5DB] hover:shadow-sm"
            >
              <h3 className="text-base font-semibold text-[#0A0A0A]">Skilly Glossary</h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                Canonical terminology for cross-channel messaging consistency.
              </p>
            </Link>
            <Link
              href="/vs/manual-setup"
              className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-5 transition hover:border-[#D1D5DB] hover:shadow-sm"
            >
              <h3 className="text-base font-semibold text-[#0A0A0A]">
                Skilly vs Manual Setup
              </h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                Side-by-side workflow comparison for migration decisions.
              </p>
            </Link>
            <Link
              href="/guides/ai-coding-skills-taxonomy"
              className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-5 transition hover:border-[#D1D5DB] hover:shadow-sm"
            >
              <h3 className="text-base font-semibold text-[#0A0A0A]">
                AI Coding Skills Taxonomy
              </h3>
              <p className="mt-2 text-sm text-[#6B7280]">
                Job-to-be-done taxonomy to organize skills and presets.
              </p>
            </Link>
          </div>
        </div>
      </section>
      <HomeFaq />
      <Footer />
    </main>
  )
}
