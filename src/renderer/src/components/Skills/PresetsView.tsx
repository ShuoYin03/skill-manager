import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { SkillPreset, SkillFile, AITool, RepoEntry } from '../../../../shared/types'
import { useAppContext } from '../../context/AppContext'
import { PresetCard } from './PresetCard'
import { PresetEditorDialog } from './PresetEditorDialog'
import { ApplyPresetDialog } from './ApplyPresetDialog'

interface PresetsViewProps {
  /** Override repo path; falls back to selectedRepo in context */
  repoPath?: string
  /** Current skills to save as preset; falls back to repoSkills in context */
  currentSkills?: SkillFile[]
  /** Called after a preset is applied (for refreshing parent state) */
  onApplied?: () => Promise<void>
  /** Available repos for preset application */
  repos?: RepoEntry[]
}

export function PresetsView({ repoPath: repoPathProp, currentSkills: currentSkillsProp, onApplied, repos }: PresetsViewProps = {}): JSX.Element {
  const { state, dispatch } = useAppContext()
  const repoPath = repoPathProp ?? state.selectedRepo?.path
  const currentSkills = currentSkillsProp ?? (state.repoSkills?.skills ?? [])

  const [presets, setPresets] = useState<SkillPreset[]>([])
  const [loading, setLoading] = useState(true)
  // null = dialog closed, undefined = new preset, SkillPreset = editing
  const [editorPreset, setEditorPreset] = useState<SkillPreset | null | undefined>(null)
  // Preset apply dialog
  const [applyTarget, setApplyTarget] = useState<SkillPreset | null>(null)
  const [applyingRepo, setApplyingRepo] = useState<string | null>(null)

  useEffect(() => {
    async function load(): Promise<void> {
      const data = await window.electronAPI.getSkillPresets()
      setPresets(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleApply = (preset: SkillPreset): void => {
    // If repos list available, open dialog; otherwise fall back to current repoPath
    if (repos && repos.length > 0) {
      setApplyTarget(preset)
    } else {
      handleApplyToRepo(preset, repoPath)
    }
  }

  const handleApplyToRepo = async (preset: SkillPreset, targetPath: string | undefined): Promise<void> => {
    if (!targetPath) return
    if (!confirm(`Apply preset "${preset.name}" to this repo? This will create ${preset.skills.length} skill file(s).`)) return
    await window.electronAPI.applySkillPreset(preset.id, targetPath)
    if (onApplied) {
      await onApplied()
    } else {
      // Fallback: update context (when used in launcher panel)
      const repoSkills = await window.electronAPI.scanRepoSkills(
        state.selectedRepo!.id,
        targetPath
      )
      dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
    }
    alert(`Preset "${preset.name}" applied!`)
  }

  const handleConfirmApply = async (targetRepoPath: string): Promise<void> => {
    if (!applyTarget) return
    setApplyingRepo(targetRepoPath)
    try {
      await handleApplyToRepo(applyTarget, targetRepoPath)
      setApplyTarget(null)
    } finally {
      setApplyingRepo(null)
    }
  }

  const handleDelete = async (preset: SkillPreset): Promise<void> => {
    if (!confirm(`Delete preset "${preset.name}"?`)) return
    await window.electronAPI.deleteSkillPreset(preset.id)
    setPresets((prev) => prev.filter((p) => p.id !== preset.id))
  }

  const handlePresetSave = async (
    name: string,
    description: string,
    skills: Array<{ tool: AITool; name: string; content: string }>
  ): Promise<void> => {
    if (editorPreset === undefined) {
      // Creating new preset
      const preset: SkillPreset = { id: uuidv4(), name, description, skills }
      await window.electronAPI.saveSkillPreset(preset)
      setPresets((prev) => [...prev, preset])
    } else if (editorPreset !== null) {
      // Editing existing preset
      const updated: SkillPreset = { ...editorPreset, name, description, skills }
      await window.electronAPI.updateSkillPreset(updated as unknown as Record<string, unknown>)
      setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    }
    setEditorPreset(null) // close dialog
  }

  if (loading) {
    return <div className="presets-loading">Loading presets...</div>
  }

  return (
    <div className="presets-view">
      <div className="presets-header">
        <span className="presets-header-title">Presets</span>
        <button className="presets-save-btn" onClick={() => setEditorPreset(undefined)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          New Preset
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="presets-empty">
          <div className="presets-empty-title">No presets saved</div>
          <div className="presets-empty-subtitle">
            Create a preset to quickly set up skills for any repo
          </div>
        </div>
      ) : (
        <div className="presets-list">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onApply={() => handleApply(preset)}
              onEdit={() => setEditorPreset(preset)}
              onDelete={() => handleDelete(preset)}
            />
          ))}
        </div>
      )}

      {editorPreset !== null && (
        <PresetEditorDialog
          preset={editorPreset ?? undefined}
          availableSkills={currentSkills}
          onSave={handlePresetSave}
          onClose={() => setEditorPreset(null)}
        />
      )}

      {applyTarget && repos && repos.length > 0 && (
        <ApplyPresetDialog
          preset={applyTarget}
          repos={repos}
          applying={applyingRepo}
          onApply={handleConfirmApply}
          onClose={() => setApplyTarget(null)}
        />
      )}
    </div>
  )
}
