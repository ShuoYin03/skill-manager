import { useState } from 'react'
import type { AITool } from '../../../../shared/types'
import { useAppContext } from '../../context/AppContext'
import { TOOL_LABELS } from './ToolIcon'

const ALL_TOOLS: AITool[] = ['claude', 'cursor', 'windsurf', 'codex', 'copilot']

interface SkillCreateDialogProps {
  onClose: () => void
}

export function SkillCreateDialog({ onClose }: SkillCreateDialogProps): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [tool, setTool] = useState<AITool>('claude')
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)

  const repoPath = state.selectedRepo?.path

  const handleCreate = async (): Promise<void> => {
    if (!name.trim() || !repoPath) return
    setCreating(true)
    try {
      await window.electronAPI.createSkill(repoPath, tool, name.trim(), content || `# ${name.trim()}\n\n`)
      const repoSkills = await window.electronAPI.scanRepoSkills(
        state.selectedRepo!.id,
        repoPath
      )
      dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
      onClose()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="skill-dialog-overlay" onClick={onClose}>
      <div className="skill-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="skill-dialog-title">Create New Skill</div>

        <div className="skill-dialog-field">
          <label className="skill-dialog-label">AI Tool</label>
          <div className="skill-dialog-tools">
            {ALL_TOOLS.map((t) => (
              <button
                key={t}
                className={`skill-dialog-tool-btn ${tool === t ? 'active' : ''}`}
                onClick={() => setTool(t)}
              >
                {TOOL_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="skill-dialog-field">
          <label className="skill-dialog-label">Skill Name</label>
          <input
            className="skill-dialog-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. typescript-rules"
            autoFocus
          />
        </div>

        <div className="skill-dialog-field">
          <label className="skill-dialog-label">Content (optional)</label>
          <textarea
            className="skill-dialog-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your skill content in markdown..."
            rows={5}
          />
        </div>

        <div className="skill-dialog-actions">
          <button className="skill-dialog-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="skill-dialog-create"
            onClick={handleCreate}
            disabled={!name.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
