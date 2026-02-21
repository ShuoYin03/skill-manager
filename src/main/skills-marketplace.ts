import type { MarketplaceSkill, SkillSearchParams, SkillSearchResult, SkillFilterStats } from '../shared/types'
import { getSkillsCache, fetchSkillContent, type SkillIndexEntry } from './skills-scraper'

const BUNDLED_SKILLS: MarketplaceSkill[] = [
  {
    slug: 'typescript-strict',
    title: 'TypeScript Strict Mode',
    description: 'Enforce strict TypeScript patterns: no any, explicit return types, null checks',
    author: 'community',
    tags: ['typescript', 'best-practices'],
    content: '# TypeScript Strict Mode\n\nAlways use strict TypeScript:\n- Never use `any` type, prefer `unknown` when type is uncertain\n- Always provide explicit return types for functions\n- Use strict null checks\n- Prefer `interface` over `type` for object shapes\n- Use `readonly` for properties that should not be mutated'
  },
  {
    slug: 'react-best-practices',
    title: 'React Best Practices',
    description: 'Modern React patterns: hooks, composition, performance',
    author: 'community',
    tags: ['react', 'frontend'],
    content: '# React Best Practices\n\n- Use functional components with hooks\n- Prefer composition over inheritance\n- Use `useMemo` and `useCallback` only when necessary (not prematurely)\n- Keep components small and focused\n- Use custom hooks to extract reusable logic\n- Prefer controlled components for forms'
  },
  {
    slug: 'code-review-guidelines',
    title: 'Code Review Guidelines',
    description: 'Standards for writing reviewable, maintainable code',
    author: 'community',
    tags: ['workflow', 'best-practices'],
    content: '# Code Review Guidelines\n\n- Write small, focused commits\n- Include tests with code changes\n- Document non-obvious decisions with comments\n- Follow existing patterns in the codebase\n- Avoid premature optimization\n- Keep functions under 30 lines when possible'
  },
  {
    slug: 'python-conventions',
    title: 'Python Conventions',
    description: 'PEP 8 style, type hints, docstrings',
    author: 'community',
    tags: ['python', 'style'],
    content: '# Python Conventions\n\n- Follow PEP 8 style guide\n- Use type hints for function parameters and return types\n- Write docstrings for all public functions and classes\n- Use f-strings for string formatting\n- Prefer list comprehensions over map/filter when readable\n- Use `pathlib.Path` instead of `os.path`'
  },
  {
    slug: 'git-commit-messages',
    title: 'Git Commit Messages',
    description: 'Conventional commits format and best practices',
    author: 'community',
    tags: ['git', 'workflow'],
    content: '# Git Commit Messages\n\nUse conventional commits format:\n- `feat:` for new features\n- `fix:` for bug fixes\n- `refactor:` for code restructuring\n- `docs:` for documentation\n- `test:` for test changes\n- `chore:` for maintenance tasks\n\nKeep the subject line under 72 characters. Use the body for details.'
  },
  {
    slug: 'security-checklist',
    title: 'Security Checklist',
    description: 'OWASP top 10 prevention patterns',
    author: 'community',
    tags: ['security', 'best-practices'],
    content: '# Security Checklist\n\n- Never trust user input — validate and sanitize everything\n- Use parameterized queries to prevent SQL injection\n- Escape output to prevent XSS\n- Use CSRF tokens for state-changing requests\n- Never store secrets in code or version control\n- Use HTTPS everywhere\n- Implement rate limiting on APIs'
  },
  {
    slug: 'testing-patterns',
    title: 'Testing Patterns',
    description: 'Unit test, integration test, and TDD patterns',
    author: 'community',
    tags: ['testing', 'best-practices'],
    content: '# Testing Patterns\n\n- Write tests that describe behavior, not implementation\n- Use AAA pattern: Arrange, Act, Assert\n- One assertion per test when possible\n- Mock external dependencies, not internal modules\n- Prefer integration tests over unit tests for critical paths\n- Test edge cases and error paths'
  },
  {
    slug: 'api-design',
    title: 'REST API Design',
    description: 'RESTful API conventions and patterns',
    author: 'community',
    tags: ['api', 'backend'],
    content: '# REST API Design\n\n- Use nouns for resource URLs, not verbs\n- Use proper HTTP methods (GET, POST, PUT, DELETE)\n- Return appropriate status codes\n- Use pagination for list endpoints\n- Version your API (e.g., /api/v1/)\n- Use consistent error response format\n- Document with OpenAPI/Swagger'
  }
]

function entryToMarketplaceSkill(entry: SkillIndexEntry): MarketplaceSkill {
  return {
    slug: entry.slug,
    title: entry.name,
    description: `${entry.owner}/${entry.repo}`,
    author: entry.owner,
    tags: [entry.repo],
    content: ''
  }
}

export async function searchMarketplaceSkills(params: SkillSearchParams): Promise<SkillSearchResult> {
  const { query = '', tag, author, page = 1, pageSize = 24 } = params
  const cache = await getSkillsCache()

  if (cache && cache.skills.length > 0) {
    let entries: SkillIndexEntry[] = cache.skills

    // 1. Text filter
    if (query.trim()) {
      const q = query.toLowerCase()
      entries = entries.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.skillId.toLowerCase().includes(q) ||
          s.owner.toLowerCase().includes(q) ||
          s.repo.toLowerCase().includes(q)
      )
    }

    // 2. Tag filter (repo name = collection)
    if (tag) entries = entries.filter((s) => s.repo === tag)

    // 3. Author filter (owner)
    if (author) entries = entries.filter((s) => s.owner === author)

    // Order = cache order = skills.sh rank (no sort needed)
    const total = entries.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const slice = entries.slice((safePage - 1) * pageSize, safePage * pageSize)

    return { skills: slice.map(entryToMarketplaceSkill), total, page: safePage, totalPages }
  }

  // Fall back to bundled skills
  let bundled = BUNDLED_SKILLS
  if (query.trim()) {
    const q = query.toLowerCase()
    bundled = bundled.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    )
  }
  const total = bundled.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const slice = bundled.slice((safePage - 1) * pageSize, safePage * pageSize)
  return { skills: slice, total, page: safePage, totalPages }
}

export async function getMarketplaceFilterStats(): Promise<SkillFilterStats> {
  const cache = await getSkillsCache()
  if (!cache || cache.skills.length === 0) return { tags: [], authors: [] }

  const tagCount = new Map<string, number>()
  const authorCount = new Map<string, number>()
  for (const s of cache.skills) {
    tagCount.set(s.repo, (tagCount.get(s.repo) ?? 0) + 1)
    authorCount.set(s.owner, (authorCount.get(s.owner) ?? 0) + 1)
  }

  const sortDesc = (m: Map<string, number>): { name: string; count: number }[] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))

  return { tags: sortDesc(tagCount).slice(0, 20), authors: sortDesc(authorCount).slice(0, 15) }
}

export async function getMarketplaceSkillContent(slug: string): Promise<string | null> {
  // Check bundled skills first
  const bundled = BUNDLED_SKILLS.find((s) => s.slug === slug)
  if (bundled) return bundled.content

  // Fetch from skills.sh / GitHub
  return await fetchSkillContent(slug)
}
