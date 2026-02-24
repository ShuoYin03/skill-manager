import { useRef, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'

export function SearchBar(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus on mount and whenever view switches to launcher
    if (state.currentView === 'launcher') {
      inputRef.current?.focus()
    }
  }, [state.currentView])

  // Expose a way to re-focus from parent (on launcher shown event)
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="search-bar">
      <svg className="search-bar-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        className="search-bar-input"
        type="text"
        placeholder="Search repositories..."
        value={state.searchQuery}
        onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  )
}
