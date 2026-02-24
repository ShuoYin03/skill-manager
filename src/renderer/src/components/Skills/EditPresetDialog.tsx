import { useState } from 'react'
import type { SkillPreset } from '../../../../shared/types'

interface EditPresetDialogProps {
  preset: SkillPreset
  onSave: (name: string, description: string) => void
  onClose: () => void
}

export function EditPresetDialog({ preset, onSave, onClose }: EditPresetDialogProps): JSX.Element {
  const [name, setName] = useState(preset.name)
  const [description, setDescription] = useState(preset.description)

  return (
    <div className="skill-dialog-overlay" onClick={onClose}>
      <div className="skill-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="skill-dialog-title">Edit Preset</div>

        <div className="skill-dialog-field">
          <label className="skill-dialog-label">Preset Name</label>
          <input
            className="skill-dialog-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My TypeScript Setup"
            autoFocus
          />
        </div>

        <div className="skill-dialog-field">
          <label className="skill-dialog-label">Description (optional)</label>
          <input
            className="skill-dialog-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this preset"
          />
        </div>

        <div className="skill-dialog-actions">
          <button className="skill-dialog-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="skill-dialog-create"
            onClick={() => onSave(name, description)}
            disabled={!name.trim()}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
