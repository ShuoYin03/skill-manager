import { useState } from 'react'
import type { AITool, SkillFile } from '../../../../shared/types'
import { useAppContext } from '../../context/AppContext'
import { SkillCard } from './SkillCard'
import { TOOL_LABELS } from './ToolIcon'

const ALL_TOOLS: AITool[] = ['claude', 'cursor', 'windsurf', 'codex', 'copilot']

export function SkillsList(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [toolFilter, setToolFilter] = useState<AITool | null>(null)
  const skills = state.repoSkills?.skills ?? []
  const repoPath = state.selectedRepo?.path

  const filtered = toolFilter ? skills.filter((s) => s.tool === toolFilter) : skills

  // Group by tool
  const grouped = ALL_TOOLS
    .map((tool) => ({
      tool,
      skills: filtered.filter((s) => s.tool === tool)
    }))
    .filter((g) => g.skills.length > 0)

  const handleToggle = async (skill: SkillFile): Promise<void> => {
    if (!repoPath) return
    const updated = await window.electronAPI.toggleSkill(repoPath, skill)
    // Re-scan to refresh
    const repoSkills = await window.electronAPI.scanRepoSkills(
      state.selectedRepo!.id,
      repoPath
    )
    dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
  }

  const handleDelete = async (skill: SkillFile): Promise<void> => {
    if (!repoPath) return
    if (!confirm(`Delete "${skill.name}"?`)) return
    await window.electronAPI.deleteSkill(repoPath, skill)
    const repoSkills = await window.electronAPI.scanRepoSkills(
      state.selectedRepo!.id,
      repoPath
    )
    dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
  }

  const handleGlobalize = async (skill: SkillFile): Promise<void> => {
    if (!confirm(`Copy "${skill.name}" to all other repos?`)) return
    const count = await window.electronAPI.globalizeSkill(skill)
    alert(`Skill applied to ${count} repos`)
  }

  return (
    <div className="skills-list">
      <div className="skills-tool-filter">
        <button
          className={`skills-filter-pill ${toolFilter === null ? 'active' : ''}`}
          onClick={() => setToolFilter(null)}
        >
          All
        </button>
        {ALL_TOOLS.map((tool) => {
          const count = skills.filter((s) => s.tool === tool).length
          if (count === 0) return null
          return (
            <button
              key={tool}
              className={`skills-filter-pill ${toolFilter === tool ? 'active' : ''}`}
              onClick={() => setToolFilter(toolFilter === tool ? null : tool)}
            >
              {TOOL_LABELS[tool]} ({count})
            </button>
          )
        })}
      </div>

      {grouped.length === 0 ? (
        <div className="skills-empty">
          <div className="skills-empty-title">No skills found</div>
          <div className="skills-empty-subtitle">
            Click + to create a new skill, or browse the marketplace
          </div>
        </div>
      ) : (
        <div className="skills-groups">
          {grouped.map(({ tool, skills: groupSkills }) => (
            <div key={tool} className="skills-group">
              <div className="skills-group-header">{TOOL_LABELS[tool]}</div>
              {groupSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={() => dispatch({ type: 'SET_EDITING_SKILL', payload: skill })}
                  onToggle={() => handleToggle(skill)}
                  onDelete={() => handleDelete(skill)}
                  onGlobalize={() => handleGlobalize(skill)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
