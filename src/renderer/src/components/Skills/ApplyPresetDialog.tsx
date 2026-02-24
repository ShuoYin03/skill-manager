import type { SkillPreset, RepoEntry } from '../../../../shared/types'

interface ApplyPresetDialogProps {
  preset: SkillPreset
  repos: RepoEntry[]
  applying: string | null   // repo path currently applying to (loading state)
  onApply: (repoPath: string) => void
  onClose: () => void
}

export function ApplyPresetDialog({ preset, repos, applying, onApply, onClose }: ApplyPresetDialogProps): JSX.Element {
  return (
    <div className="add-preset-overlay" onClick={onClose}>
      <div className="add-preset-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="add-preset-header">
          <span className="add-preset-title">Apply Preset</span>
          <button className="add-preset-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="add-preset-skill-name">{preset.name}</div>

        <div className="add-preset-body">
          {repos.length === 0 ? (
            <div className="add-preset-empty">
              <div className="add-preset-empty-text">No projects available.</div>
              <div className="add-preset-empty-sub">Add a project in the launcher first.</div>
            </div>
          ) : (
            <div className="add-preset-list">
              {repos.map((repo) => (
                <div key={repo.id} className="add-preset-row">
                  <div className="add-preset-row-info">
                    <span className="add-preset-row-name">{repo.name}</span>
                    <span className="add-preset-row-meta">{repo.path}</span>
                  </div>
                  <button
                    className="add-preset-row-btn"
                    onClick={() => onApply(repo.path)}
                    disabled={applying === repo.path}
                  >
                    {applying === repo.path ? 'Applying…' : 'Apply'}
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
