import { useState } from 'react'
import type { InstructionFile } from '../../../../shared/types'
import { INSTRUCTIONS_TEMPLATES, type InstructionTemplate } from './InstructionsTemplates'

interface InstructionsEditorProps {
  file: InstructionFile
  repoPath: string
  onSave: () => void
  onCancel: () => void
}

export function InstructionsEditor({ file, repoPath, onSave, onCancel }: InstructionsEditorProps): JSX.Element {
  const [content, setContent] = useState(file.content ?? '')
  const [saving, setSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(!file.exists)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const hasChanges = content !== (file.content ?? '')

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      await window.electronAPI.writeInstructionFile(repoPath, file.tool, content)
      onSave()
    } finally {
      setSaving(false)
    }
  }

  const applyTemplate = (template: InstructionTemplate): void => {
    setContent(template.content)
    setSelectedTemplate(template.id)
    setShowTemplates(false)
  }

  return (
    <div className="instructions-editor">
      <div className="instructions-editor-header">
        <div className="instructions-editor-path">
          <span className="instructions-editor-tool-label">{file.label}</span>
          <span className="instructions-editor-file-path">{file.relativePath}</span>
        </div>
        <button
          className="instructions-editor-template-toggle"
          onClick={() => setShowTemplates((v) => !v)}
          title="Browse templates"
        >
          Templates
        </button>
      </div>

      {showTemplates && (
        <div className="instructions-template-picker">
          {INSTRUCTIONS_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              className={`instructions-template-item ${selectedTemplate === tpl.id ? 'selected' : ''}`}
              onClick={() => applyTemplate(tpl)}
            >
              <div className="instructions-template-name">{tpl.name}</div>
              <div className="instructions-template-desc">{tpl.description}</div>
            </button>
          ))}
        </div>
      )}

      <textarea
        className="instructions-editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`# ${file.label} Instructions\n\nDescribe this project and any conventions the AI should follow...`}
        spellCheck={false}
      />

      <div className="instructions-editor-actions">
        <button className="instructions-editor-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="instructions-editor-save"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
