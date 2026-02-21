import type { SkillFile } from '../../../../shared/types'
import { ToolIcon } from './ToolIcon'

interface SkillCardProps {
  skill: SkillFile
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  onGlobalize: () => void
}

export function SkillCard({ skill, onEdit, onToggle, onDelete, onGlobalize }: SkillCardProps): JSX.Element {
  return (
    <div className={`skill-card ${!skill.enabled ? 'skill-disabled' : ''}`}>
      <div className="skill-card-left">
        <ToolIcon tool={skill.tool} />
        <div className="skill-card-info">
          <span className="skill-card-name">{skill.name}</span>
          <span className="skill-card-path">{skill.relativePath}</span>
        </div>
      </div>
      <div className="skill-card-actions">
        <button className="skill-action-btn" onClick={onGlobalize} title="Apply to all repos">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </button>
        <button className="skill-action-btn" onClick={onEdit} title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <label className="skill-toggle" title={skill.enabled ? 'Disable' : 'Enable'}>
          <input type="checkbox" checked={skill.enabled} onChange={onToggle} />
          <span className="skill-toggle-slider" />
        </label>
        <button className="skill-action-btn skill-delete-btn" onClick={onDelete} title="Delete">
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
