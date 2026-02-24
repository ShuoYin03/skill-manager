import type { SkillPreset } from '../../../../shared/types'

interface AddToPresetDialogProps {
  skillTitle: string
  presets: SkillPreset[]
  adding: string | null          // preset id currently being added to (loading state)
  onAddToPreset: (presetId: string) => void
  onClose: () => void
}

export function AddToPresetDialog({ skillTitle, presets, adding, onAddToPreset, onClose }: AddToPresetDialogProps): JSX.Element {
  return (
    <div className="add-preset-overlay" onClick={onClose}>
      <div className="add-preset-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="add-preset-header">
          <span className="add-preset-title">Add to Preset</span>
          <button className="add-preset-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="add-preset-skill-name">{skillTitle}</div>

        <div className="add-preset-body">
          {presets.length === 0 ? (
            <div className="add-preset-empty">
              <div className="add-preset-empty-text">No presets yet.</div>
              <div className="add-preset-empty-sub">Go to My Presets tab to create one first.</div>
            </div>
          ) : (
            <div className="add-preset-list">
              {presets.map((preset) => (
                <div key={preset.id} className="add-preset-row">
                  <div className="add-preset-row-info">
                    <span className="add-preset-row-name">{preset.name}</span>
                    <span className="add-preset-row-meta">{preset.skills.length} skill{preset.skills.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    className="add-preset-row-btn"
                    onClick={() => onAddToPreset(preset.id)}
                    disabled={adding === preset.id}
                  >
                    {adding === preset.id ? 'Adding…' : '+ Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
