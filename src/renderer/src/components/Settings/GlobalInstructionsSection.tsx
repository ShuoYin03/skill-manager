import { useState, useEffect } from 'react'
import type { InstructionFile, InstructionTool } from '../../../../shared/types'
import { InstructionsEditor } from '../Skills/InstructionsEditor'

const TOOL_ICONS: Record<InstructionTool, JSX.Element> = {
  claude: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l3 3" />
    </svg>
  ),
  cursor: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7 7-4 4 11 8-8-11-4 4z" />
    </svg>
  ),
  windsurf: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18l9-15 9 15" />
      <path d="M12 3v15" />
    </svg>
  ),
  copilot: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}

interface Props {
  homeDir: string
}

export function GlobalInstructionsSection({ homeDir }: Props): JSX.Element {
  const [files, setFiles] = useState<InstructionFile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<InstructionFile | null>(null)

  const loadFiles = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = await window.electronAPI.scanInstructionFiles(homeDir)
      setFiles(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (homeDir) loadFiles()
  }, [homeDir])

  const handleSaved = (): void => {
    setEditing(null)
    loadFiles()
  }

  if (editing) {
    return (
      <InstructionsEditor
        file={editing}
        repoPath={homeDir}
        onSave={handleSaved}
        onCancel={() => setEditing(null)}
      />
    )
  }

  if (loading) {
    return <div className="instructions-loading">Loading...</div>
  }

  return (
    <div className="settings-section">
      <div className="settings-section-title">Global Instructions</div>
      <div className="settings-row-description" style={{ padding: '0 0 8px', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
        Applies to every project. Stored in your home directory.
      </div>
      <div className="global-instructions-cards">
        {files.map((file) => (
          <div key={file.tool} className="instructions-file-card">
            <div className="instructions-file-card-header">
              <div className="instructions-file-tool">
                <span className="instructions-file-tool-icon">{TOOL_ICONS[file.tool]}</span>
                <span className="instructions-file-tool-label">{file.label}</span>
              </div>
              <span className={`instructions-file-status ${file.exists ? 'exists' : 'missing'}`}>
                {file.exists ? 'Exists' : 'Not created'}
              </span>
            </div>
            <div className="instructions-file-path">~/{file.relativePath}</div>
            <div className="instructions-file-actions">
              <button
                className="instructions-file-btn primary"
                onClick={() => setEditing(file)}
              >
                {file.exists ? 'Edit' : 'Create'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
