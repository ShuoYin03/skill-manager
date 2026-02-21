import { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import type { SkillFile } from '../../../../shared/types'

interface Props {
  homeDir: string
}

export function GlobalSkillsSection({ homeDir }: Props): JSX.Element {
  const { state } = useAppContext()
  const [skills, setSkills] = useState<SkillFile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<SkillFile | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  const skillsDir = state.settings.skillsDir ?? 'tool-specific'

  const loadSkills = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.electronAPI.scanRepoSkills('global', homeDir)
      setSkills(result.skills)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (homeDir) loadSkills()
  }, [homeDir])

  const handleEdit = (skill: SkillFile): void => {
    setEditing(skill)
    setEditContent(skill.content)
  }

  const handleSave = async (): Promise<void> => {
    if (!editing) return
    setSaving(true)
    try {
      await window.electronAPI.updateSkill(homeDir, { ...editing, content: editContent })
      setEditing(null)
      loadSkills()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (skill: SkillFile): Promise<void> => {
    if (!confirm(`Delete global skill "${skill.name}"?`)) return
    await window.electronAPI.deleteSkill(homeDir, skill)
    loadSkills()
  }

  const dirLabel = skillsDir === 'shared' ? '.agent/skills' : '.claude/skills'

  if (editing) {
    return (
      <div className="settings-section">
        <div className="settings-section-title">Global Skills — {editing.name}</div>
        <textarea
          className="global-skill-editor-textarea"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          spellCheck={false}
        />
        <div className="global-skill-editor-actions">
          <button className="instructions-editor-cancel" onClick={() => setEditing(null)}>
            Cancel
          </button>
          <button
            className="instructions-editor-save"
            onClick={handleSave}
            disabled={saving || editContent === editing.content}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-section">
      <div className="settings-section-title">Global Skills</div>
      <div className="settings-row-description" style={{ padding: '0 0 8px', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
        Stored in <code>~/{dirLabel}/</code> and available to all projects.
      </div>

      {loading ? (
        <div className="instructions-loading">Loading...</div>
      ) : skills.length === 0 ? (
        <div className="global-skills-empty">
          No global skills yet. Create skills in <code>~/{dirLabel}/</code> to have them available everywhere.
        </div>
      ) : (
        <div className="global-skills-list">
          {skills.map((skill) => (
            <div key={skill.id} className="global-skill-item">
              <div className="global-skill-item-info">
                <span className="global-skill-item-name">{skill.name}</span>
                <span className="global-skill-item-path">{skill.relativePath}</span>
              </div>
              <div className="global-skill-item-actions">
                <button className="skill-action-btn" onClick={() => handleEdit(skill)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button className="skill-action-btn skill-delete-btn" onClick={() => handleDelete(skill)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
