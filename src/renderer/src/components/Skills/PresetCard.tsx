import type { SkillPreset } from '../../../../shared/types'
import { TOOL_LABELS } from './ToolIcon'

interface PresetCardProps {
  preset: SkillPreset
  onApply: () => void
  onDelete: () => void
}

export function PresetCard({ preset, onApply, onDelete }: PresetCardProps): JSX.Element {
  const toolSummary = [...new Set(preset.skills.map((s) => TOOL_LABELS[s.tool]))].join(', ')

  return (
    <div className="preset-card">
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
        <button className="preset-delete-btn" onClick={onDelete}>
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
