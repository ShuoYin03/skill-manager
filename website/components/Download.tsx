'use client'

import { useState, useEffect } from 'react'

interface ReleaseAsset {
  name: string
  browser_download_url: string
  size: number
}

interface Release {
  tag_name: string
  assets: ReleaseAsset[]
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

function getAssetForPlatform(assets: ReleaseAsset[], platform: 'mac' | 'win' | 'linux'): ReleaseAsset | undefined {
  if (platform === 'mac') return assets.find(a => a.name.endsWith('.dmg') || a.name.endsWith('-mac.zip'))
  if (platform === 'win') return assets.find(a => a.name.endsWith('.exe') || a.name.endsWith('.msi'))
  if (platform === 'linux') return assets.find(a => a.name.endsWith('.AppImage') || a.name.endsWith('.deb'))
}

export function Download() {
  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('https://api.github.com/repos/ShuoYin03/skill-manager/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(r => {
        if (!r.ok) throw new Error('no release')
        return r.json() as Promise<Release>
      })
      .then(data => {
        setRelease(data)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const platforms = [
    {
      key: 'mac' as const,
      platform: 'macOS',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
      ),
    },
    {
      key: 'win' as const,
      platform: 'Windows',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
        </svg>
      ),
    },
    {
      key: 'linux' as const,
      platform: 'Linux',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.868.07 1.723-.26 2.456-.594.733-.34 1.455-.637 2.114-.737.659-.122 1.226-.015 1.753.467.127.134.248.403.376.403.136 0 .267-.134.403-.268.263-.268.33-.535.063-.936-.267-.4-.803-.534-1.136-.736-.333-.199-.47-.6-.866-.936a2.726 2.726 0 01-.468-.602c-.401-.266-.535-.936-1.135-1.602-.268-.268-.535-.737-.668-1.07-.134-.334-.2-.665-.067-.932.133-.268.465-.4.733-.601.268-.2.534-.399.7-.663.167-.268.2-.534.266-.87a4.1 4.1 0 00.066-.601c0-.602-.2-1.203-.534-1.67-.334-.466-.802-.868-1.337-1.07-.534-.2-1.135-.266-1.669-.133a.55.55 0 01.003-.064c.283-2.403-1.326-4.797-3.736-5.267A3.618 3.618 0 0012.504 0z" />
        </svg>
      ),
    },
  ]

  return (
    <section id="download" className="border-t border-[#E5E7EB] bg-white py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl">Download Skilly</h2>
        <p className="mt-4 text-lg text-[#6B7280]">
          Available for macOS, Windows, and Linux. Free 7-day trial.
        </p>

        {loading && (
          <div className="mx-auto mt-12 flex max-w-xs items-center justify-center gap-2 text-sm text-[#9CA3AF]">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Checking for latest release...
          </div>
        )}

        {!loading && (error || !release || release.assets.length === 0) && (
          <div className="mx-auto mt-12 max-w-md rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-8">
            <div className="text-[#6B7280]">
              <svg className="mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <p className="font-medium text-[#0A0A0A]">Downloads coming soon</p>
              <p className="mt-2 text-sm">No release available yet. Check back soon or watch the repository for updates.</p>
            </div>
          </div>
        )}

        {!loading && release && release.assets.length > 0 && (
          <>
            <p className="mt-2 text-sm text-[#9CA3AF]">Latest: {release.tag_name}</p>
            <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
              {platforms.map((item) => {
                const asset = getAssetForPlatform(release.assets, item.key)
                if (!asset) return null
                return (
                  <a
                    key={item.platform}
                    href={asset.browser_download_url}
                    className="group flex flex-col items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-6 transition hover:border-[#D1D5DB] hover:shadow-sm"
                  >
                    <div className="text-[#6B7280] transition group-hover:text-[#0A0A0A]">{item.icon}</div>
                    <div>
                      <div className="text-sm font-medium text-[#0A0A0A]">{item.platform}</div>
                      <div className="mt-0.5 text-xs text-[#9CA3AF]">{formatBytes(asset.size)}</div>
                    </div>
                  </a>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
