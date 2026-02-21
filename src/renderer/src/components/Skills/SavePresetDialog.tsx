import { useState } from 'react'

interface SavePresetDialogProps {
  onSave: (name: string, description: string) => void
  onClose: () => void
}

export function SavePresetDialog({ onSave, onClose }: SavePresetDialogProps): JSX.Element {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div className="skill-dialog-overlay" onClick={onClose}>
      <div className="skill-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="skill-dialog-title">Save as Preset</div>

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
            Save Preset
          </button>
        </div>
      </div>
    </div>
  )
}
