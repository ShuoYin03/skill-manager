import { useState } from 'react'
import type { SkillPreset, AITool, SkillFile } from '../../../../shared/types'
import { TOOL_LABELS } from './ToolIcon'

interface PresetEditorDialogProps {
  preset?: SkillPreset           // undefined = creating new
  availableSkills: SkillFile[]   // kept for backward compat, not used in UI
  onSave: (name: string, description: string, skills: Array<{ tool: AITool; name: string; content: string }>) => void
  onClose: () => void
}

export function PresetEditorDialog({ preset, onSave, onClose }: PresetEditorDialogProps): JSX.Element {
  const isEditing = !!preset
  const [name, setName] = useState(preset?.name ?? '')
  const [description, setDescription] = useState(preset?.description ?? '')
  const [presetSkills, setPresetSkills] = useState<Array<{ tool: AITool; name: string; content: string }>>(
    preset?.skills ?? []
  )

  const handleRemovePresetSkill = (index: number): void => {
    setPresetSkills((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="preset-editor-overlay" onClick={onClose}>
      <div className="preset-editor-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="preset-editor-header">
          <span className="preset-editor-title">{isEditing ? 'Edit Preset' : 'New Preset'}</span>
          <button className="preset-editor-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="preset-editor-body">
          {/* Metadata */}
          <div className="preset-editor-meta">
            <div className="preset-editor-field">
              <label className="preset-editor-label">Preset Name</label>
              <input
                className="preset-editor-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. TypeScript Full-Stack"
                autoFocus
              />
            </div>
            <div className="preset-editor-field">
              <label className="preset-editor-label">
                Description <span className="preset-editor-optional">(optional)</span>
              </label>
              <input
                className="preset-editor-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this preset"
              />
            </div>
          </div>

          {/* Skills — single column: In Preset */}
          <div className="preset-editor-skills-section preset-editor-skills-section--single">
            <div className="preset-editor-skills-col">
              <div className="preset-editor-col-header">
                <span className="preset-editor-col-label">In Preset</span>
                <span className="preset-editor-col-count">{presetSkills.length}</span>
              </div>
              <div className="preset-editor-skills-list">
                {presetSkills.length === 0 ? (
                  <div className="preset-editor-skills-empty">No skills added yet. Use "Save to Preset…" from the marketplace to add skills.</div>
                ) : (
                  presetSkills.map((skill, idx) => (
                    <div key={`${skill.name}-${idx}`} className="preset-editor-skill-row">
                      <span className="preset-editor-skill-tool">{TOOL_LABELS[skill.tool]}</span>
                      <span className="preset-editor-skill-name">{skill.name}</span>
                      <button
                        className="preset-editor-skill-btn preset-editor-skill-btn--remove"
                        onClick={() => handleRemovePresetSkill(idx)}
                        title="Remove from preset"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="preset-editor-actions">
          <button className="preset-editor-cancel" onClick={onClose}>Cancel</button>
          <button
            className="preset-editor-save"
            onClick={() => onSave(name, description, presetSkills)}
            disabled={!name.trim()}
          >
            {isEditing ? 'Save Changes' : 'Create Preset'}
          </button>
        </div>
      </div>
    </div>
  )
}
