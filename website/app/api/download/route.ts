import { NextRequest, NextResponse } from 'next/server'

interface GitHubAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  assets: GitHubAsset[]
}

const PLATFORM_PATTERNS: Record<string, RegExp> = {
  mac: /\.dmg$/,
  win: /(-setup|-win).*\.exe$/,
  linux: /\.AppImage$/,
}

export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get('platform')
  if (!platform || !PLATFORM_PATTERNS[platform]) {
    return NextResponse.json({ error: 'Invalid platform. Use: mac, win, linux' }, { status: 400 })
  }

  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO
  if (!repo || repo === 'YOUR_GITHUB_USERNAME/skilly') {
    return NextResponse.json(
      { error: 'GitHub repo not configured. Set NEXT_PUBLIC_GITHUB_REPO in .env.local' },
      { status: 503 }
    )
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 300 }, // cache for 5 min
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'No releases found. Build and publish a release first.' },
        { status: 404 }
      )
    }

    const release: GitHubRelease = await res.json()
    const pattern = PLATFORM_PATTERNS[platform]
    const asset = release.assets.find((a) => pattern.test(a.name))

    if (!asset) {
      return NextResponse.json(
        { error: `No ${platform} asset found in release ${release.tag_name}` },
        { status: 404 }
      )
    }

    return NextResponse.redirect(asset.browser_download_url)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch release info' }, { status: 500 })
  }
}
