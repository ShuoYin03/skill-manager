import simpleGit from 'simple-git'
import type { RepoEntry } from '../shared/types'

const TIMEOUT_MS = 3000

export async function getGitBranch(repoPath: string): Promise<string | null> {
  try {
    const git = simpleGit(repoPath)
    const branchSummary = await Promise.race([
      git.branchLocal(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
      )
    ])
    return branchSummary.current || null
  } catch {
    return null
  }
}

export async function isGitRepo(dirPath: string): Promise<boolean> {
  try {
    const git = simpleGit(dirPath)
    return await git.checkIsRepo()
  } catch {
    return false
  }
}

export async function refreshAllBranches(repos: RepoEntry[]): Promise<RepoEntry[]> {
  const CONCURRENCY = 5
  const results = [...repos]

  for (let i = 0; i < results.length; i += CONCURRENCY) {
    const batch = results.slice(i, i + CONCURRENCY)
    const branches = await Promise.allSettled(
      batch.map((r) => (r.isGitRepo ? getGitBranch(r.path) : Promise.resolve(null)))
    )
    branches.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results[i + idx] = { ...results[i + idx], gitBranch: result.value }
      }
    })
  }

  return results
}
