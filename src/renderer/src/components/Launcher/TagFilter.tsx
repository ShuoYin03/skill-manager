import { useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'

export function TagFilter(): JSX.Element | null {
  const { state, dispatch } = useAppContext()

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    state.repos.forEach((r) => r.tags.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [state.repos])

  if (allTags.length === 0) return null

  return (
    <div className="tag-filter">
      <button
        className={`tag-filter-pill ${state.activeTagFilter === null ? 'active' : ''}`}
        onClick={() => dispatch({ type: 'SET_TAG_FILTER', payload: null })}
      >
        All
      </button>
      {allTags.map((tag) => (
        <button
          key={tag}
          className={`tag-filter-pill ${state.activeTagFilter === tag ? 'active' : ''}`}
          onClick={() =>
            dispatch({
              type: 'SET_TAG_FILTER',
              payload: state.activeTagFilter === tag ? null : tag
            })
          }
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
