import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { SkillPreset } from '../../../../shared/types'
import { useAppContext } from '../../context/AppContext'
import { PresetCard } from './PresetCard'
import { SavePresetDialog } from './SavePresetDialog'

export function PresetsView(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [presets, setPresets] = useState<SkillPreset[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  const repoPath = state.selectedRepo?.path

  useEffect(() => {
    async function load(): Promise<void> {
      const data = await window.electronAPI.getSkillPresets()
      setPresets(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleApply = async (preset: SkillPreset): Promise<void> => {
    if (!repoPath) return
    if (!confirm(`Apply preset "${preset.name}" to this repo? This will create ${preset.skills.length} skill file(s).`)) return
    await window.electronAPI.applySkillPreset(preset.id, repoPath)
    const repoSkills = await window.electronAPI.scanRepoSkills(
      state.selectedRepo!.id,
      repoPath
    )
    dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
    alert(`Preset "${preset.name}" applied!`)
  }

  const handleDelete = async (preset: SkillPreset): Promise<void> => {
    if (!confirm(`Delete preset "${preset.name}"?`)) return
    await window.electronAPI.deleteSkillPreset(preset.id)
    setPresets((prev) => prev.filter((p) => p.id !== preset.id))
  }

  const handleSave = async (name: string, description: string): Promise<void> => {
    const skills = state.repoSkills?.skills ?? []
    if (skills.length === 0) {
      alert('No skills to save as preset')
      return
    }

    const preset: SkillPreset = {
      id: uuidv4(),
      name,
      description,
      skills: skills.map((s) => ({
        tool: s.tool,
        name: s.name,
        content: s.content
      }))
    }

    await window.electronAPI.saveSkillPreset(preset)
    setPresets((prev) => [...prev, preset])
    setShowSaveDialog(false)
  }

  if (loading) {
    return <div className="presets-loading">Loading presets...</div>
  }

  return (
    <div className="presets-view">
      <div className="presets-header">
        <button className="presets-save-btn" onClick={() => setShowSaveDialog(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Save Current as Preset
        </button>
      </div>

      {presets.length === 0 ? (
        <div className="presets-empty">
          <div className="presets-empty-title">No presets saved</div>
          <div className="presets-empty-subtitle">
            Save your current repo's skills as a reusable preset
          </div>
        </div>
      ) : (
        <div className="presets-list">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onApply={() => handleApply(preset)}
              onDelete={() => handleDelete(preset)}
            />
          ))}
        </div>
      )}

      {showSaveDialog && (
        <SavePresetDialog
          onSave={handleSave}
          onClose={() => setShowSaveDialog(false)}
        />
      )}
    </div>
  )
}
