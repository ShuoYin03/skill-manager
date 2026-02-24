import { useState, useEffect, useRef } from 'react'
import type { MarketplaceSkill } from '../../../../shared/types'

// Deterministic colors for skill letter icons (no purple)
const ICON_COLORS = [
  '#FF6B35', // orange
  '#0EA5E9', // sky blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange-alt
  '#14B8A6', // teal
  '#6366F1', // indigo (not purple-purple)
  '#EC4899', // pink
  '#8B5CF6', // violet (subtle)
]

export function getIconColor(title: string): string {
  const idx = (title.charCodeAt(0) + title.charCodeAt(title.length - 1)) % ICON_COLORS.length
  return ICON_COLORS[idx]
}

interface MarketplaceCardProps {
  skill: MarketplaceSkill
  onInstall: () => Promise<void> | void
  onView: (skill: MarketplaceSkill) => void
  onSaveToPreset?: (skill: MarketplaceSkill) => void
  installLabel?: string
}

interface SplitInstallButtonProps {
  installing: boolean
  onInstallNow: () => void
  onSaveToPreset?: () => void
  compact?: boolean
  installLabel?: string
}

export function SplitInstallButton({
  installing,
  onInstallNow,
  onSaveToPreset,
  compact = false,
  installLabel
}: SplitInstallButtonProps): JSX.Element {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  return (
    <div className={`marketplace-install-split${compact ? ' compact' : ''}`} ref={ref}>
      <button
        className="marketplace-install-main"
        onClick={onInstallNow}
        disabled={installing}
        data-tooltip={installing ? undefined : (installLabel ?? 'Install')}
      >
        {installing ? (
          compact ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <span>Installing…</span>
          )
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            {!compact && <span>Install</span>}
          </>
        )}
      </button>
      <div className="marketplace-install-divider" />
      <button
        className="marketplace-install-chevron-btn"
        onClick={() => setDropdownOpen((v) => !v)}
        disabled={installing}
        data-tooltip="More options"
      >
        <svg
          className={`marketplace-install-chevron-icon ${dropdownOpen ? 'open' : ''}`}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {dropdownOpen && (
        <div className="marketplace-install-menu">
          {onSaveToPreset && (
            <button
              className="marketplace-install-menu-item"
              onClick={() => {
                onSaveToPreset()
                setDropdownOpen(false)
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>Save to Preset…</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function MarketplaceCard({ skill, onInstall, onView, onSaveToPreset, installLabel }: MarketplaceCardProps): JSX.Element {
  const [installing, setInstalling] = useState(false)
  const iconColor = getIconColor(skill.title)

  const handleInstall = async (): Promise<void> => {
    setInstalling(true)
    try {
      await onInstall()
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="marketplace-card" onClick={() => onView(skill)}>
      {/* Colored letter icon */}
      <div className="marketplace-card-icon" style={{ background: iconColor }}>
        {skill.title.charAt(0).toUpperCase()}
      </div>

      {/* Text content */}
      <div className="marketplace-card-content">
        <div className="marketplace-card-header">
          <span className="marketplace-card-title">{skill.title}</span>
          <span className="marketplace-card-author">by {skill.author}</span>
        </div>
        {skill.description && (
          <div className="marketplace-card-desc">{skill.description}</div>
        )}
        {skill.tags.length > 0 && (
          <div className="marketplace-card-tags">
            {skill.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="marketplace-card-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions on right */}
      <div className="marketplace-card-actions" onClick={(e) => e.stopPropagation()}>
        <SplitInstallButton
          installing={installing}
          onInstallNow={handleInstall}
          onSaveToPreset={onSaveToPreset ? () => onSaveToPreset(skill) : undefined}
          compact={true}
          installLabel={installLabel}
        />
      </div>
    </div>
  )
}
