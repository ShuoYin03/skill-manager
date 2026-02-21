import { useState, useEffect, useCallback } from 'react'
import type { MarketplaceSkill, AITool } from '../../../../shared/types'
import { useAppContext } from '../../context/AppContext'
import { MarketplaceCard } from './MarketplaceCard'

export function MarketplaceView(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MarketplaceSkill[]>([])
  const [loading, setLoading] = useState(false)

  const repoPath = state.selectedRepo?.path

  // Load initial results
  useEffect(() => {
    async function loadInitial(): Promise<void> {
      setLoading(true)
      try {
        const skills = await window.electronAPI.searchMarketplace('')
        setResults(skills)
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  const handleSearch = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const skills = await window.electronAPI.searchMarketplace(query)
      setResults(skills)
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleInstall = async (skill: MarketplaceSkill, tool: AITool): Promise<void> => {
    if (!repoPath) return
    const content = skill.content || (await window.electronAPI.getMarketplaceSkill(skill.slug)) || ''
    await window.electronAPI.installMarketplaceSkill(repoPath, tool, skill.slug, content)
    // Re-scan
    const repoSkills = await window.electronAPI.scanRepoSkills(
      state.selectedRepo!.id,
      repoPath
    )
    dispatch({ type: 'SET_REPO_SKILLS', payload: repoSkills })
    alert(`"${skill.title}" installed!`)
  }

  return (
    <div className="marketplace-view">
      <div className="marketplace-search">
        <input
          className="marketplace-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search skills..."
        />
        <button className="marketplace-search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      {loading ? (
        <div className="marketplace-loading">Loading...</div>
      ) : results.length === 0 ? (
        <div className="marketplace-empty">No skills found</div>
      ) : (
        <div className="marketplace-grid">
          {results.map((skill) => (
            <MarketplaceCard
              key={skill.slug}
              skill={skill}
              onInstall={(tool) => handleInstall(skill, tool)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
