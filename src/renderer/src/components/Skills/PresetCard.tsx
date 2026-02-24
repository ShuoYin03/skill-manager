import type { SkillPreset } from '../../../../shared/types'
import { TOOL_LABELS } from './ToolIcon'

interface PresetCardProps {
  preset: SkillPreset
  onApply: () => void
  onEdit: () => void
  onDelete: () => void
}

const ICON_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function getPresetColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % ICON_COLORS.length
  return ICON_COLORS[idx]
}

export function PresetCard({ preset, onApply, onEdit, onDelete }: PresetCardProps): JSX.Element {
  const toolSummary = [...new Set(preset.skills.map((s) => TOOL_LABELS[s.tool]))].join(', ')
  const iconColor = getPresetColor(preset.name)

  return (
    <div className="preset-card">
      <div className="preset-card-icon" style={{ background: iconColor }}>
        {preset.name.charAt(0).toUpperCase()}
      </div>
      <div className="preset-card-info">
        <span className="preset-card-name">{preset.name}</span>
        {preset.description && (
          <span className="preset-card-desc">{preset.description}</span>
        )}
        <span className="preset-card-meta">
          {preset.skills.length} skill{preset.skills.length !== 1 ? 's' : ''} ({toolSummary})
        </span>
      </div>
      <div className="preset-card-actions">
        <button className="preset-apply-btn" onClick={onApply}>
          Apply
        </button>
        <button className="preset-edit-btn" onClick={onEdit} title="Edit preset">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button className="preset-delete-btn" onClick={onDelete} title="Delete preset">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
