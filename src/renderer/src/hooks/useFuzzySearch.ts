import { useMemo } from 'react'
import Fuse from 'fuse.js'
import type { RepoEntry } from '../../../shared/types'

export function useFuzzySearch(
  repos: RepoEntry[],
  query: string,
  tagFilter: string | null
): RepoEntry[] {
  return useMemo(() => {
    let filtered = repos

    if (tagFilter) {
      filtered = filtered.filter((r) => r.tags.includes(tagFilter))
    }

    if (!query.trim()) {
      return [...filtered].sort((a, b) => {
        if (a.lastOpened && b.lastOpened) return b.lastOpened - a.lastOpened
        if (a.lastOpened) return -1
        if (b.lastOpened) return 1
        return a.name.localeCompare(b.name)
      })
    }

    const fuse = new Fuse(filtered, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'path', weight: 0.3 },
        { name: 'tags', weight: 0.2 }
      ],
      threshold: 0.4,
      includeScore: true
    })

    return fuse.search(query).map((result) => result.item)
  }, [repos, query, tagFilter])
}
