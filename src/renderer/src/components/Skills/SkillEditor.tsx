import { useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { ToolIcon } from './ToolIcon'

export function SkillEditor(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const skill = state.editingSkill
  const repoPath = state.selectedRepo?.path

  const [content, setContent] = useState(skill?.content ?? '')
  const [saving, setSaving] = useState(false)

  if (!skill || !repoPath) return <div />

  const hasChanges = content !== skill.content

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      await window.electronAPI.updateSkill(repoPath, { ...skill, content })
      // Re-scan
      const repoSkills = await window.electronAPI.scanRepoSkills(
        state.selectedRepo!.id,
        repoPath
      )
      dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
      dispatch({ type: 'SET_EDITING_SKILL', payload: null })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = (): void => {
    dispatch({ type: 'SET_EDITING_SKILL', payload: null })
  }

  return (
    <div className="skill-editor">
      <div className="skill-editor-header">
        <button className="skill-editor-back" onClick={handleCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <ToolIcon tool={skill.tool} size={18} />
        <span className="skill-editor-name">{skill.name}</span>
      </div>
      <div className="skill-editor-path">{skill.relativePath}</div>
      <textarea
        className="skill-editor-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        placeholder="Write your skill content in markdown..."
      />
      <div className="skill-editor-footer">
        <button className="skill-editor-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button
          className="skill-editor-save"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
