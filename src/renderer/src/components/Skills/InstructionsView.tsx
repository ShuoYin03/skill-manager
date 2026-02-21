import { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'
import type { InstructionFile, InstructionTool } from '../../../../shared/types'
import { InstructionsEditor } from './InstructionsEditor'

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

export function InstructionsView(): JSX.Element {
  const { state } = useAppContext()
  const [files, setFiles] = useState<InstructionFile[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<InstructionFile | null>(null)
  const [globalizing, setGlobalizing] = useState<InstructionTool | null>(null)

  const repoPath = state.selectedRepo?.path ?? ''

  const loadFiles = async (): Promise<void> => {
    if (!repoPath) return
    setLoading(true)
    try {
      const result = await window.electronAPI.scanInstructionFiles(repoPath)
      setFiles(result)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [repoPath])

  const handleEdit = (file: InstructionFile): void => {
    setEditing(file)
  }

  const handleSaved = (): void => {
    setEditing(null)
    loadFiles()
  }

  const handleGlobalize = async (file: InstructionFile): Promise<void> => {
    if (!confirm(`Copy ${file.relativePath} to all other repos?`)) return
    setGlobalizing(file.tool)
    try {
      const count = await window.electronAPI.globalizeInstructionFile(repoPath, file.tool)
      alert(`Copied to ${count} repo${count === 1 ? '' : 's'}.`)
    } finally {
      setGlobalizing(null)
    }
  }

  if (editing) {
    return (
      <InstructionsEditor
        file={editing}
        repoPath={repoPath}
        onSave={handleSaved}
        onCancel={() => setEditing(null)}
      />
    )
  }

  if (loading) {
    return <div className="instructions-loading">Loading...</div>
  }

  return (
    <div className="instructions-view">
      <div className="instructions-view-hint">
        Project-level instructions read by each AI tool at the start of every session.
      </div>
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
          <div className="instructions-file-path">{file.relativePath}</div>
          <div className="instructions-file-actions">
            <button
              className="instructions-file-btn primary"
              onClick={() => handleEdit(file)}
            >
              {file.exists ? 'Edit' : 'Create'}
            </button>
            {file.exists && (
              <button
                className="instructions-file-btn"
                onClick={() => handleGlobalize(file)}
                disabled={globalizing === file.tool}
                title="Copy to all other repos"
              >
                {globalizing === file.tool ? 'Copying...' : 'Copy to all repos'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
