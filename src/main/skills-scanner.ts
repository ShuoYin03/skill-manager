import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { AITool, SkillFile, RepoSkills } from '../shared/types'

interface ToolConfig {
  tool: AITool
  directories: string[]
  singleFile?: string
  extensions: string[]
}

const TOOL_CONFIGS: ToolConfig[] = [
  {
    tool: 'claude',
    directories: ['.claude/skills'],
    extensions: ['.md']
  },
  {
    tool: 'cursor',
    directories: ['.cursor/rules'],
    extensions: ['.md', '.mdc']
  },
  {
    tool: 'windsurf',
    directories: ['.windsurf/rules'],
    extensions: ['.md']
  },
  {
    tool: 'codex',
    directories: [],
    singleFile: '.codex/instructions.md',
    extensions: ['.md']
  },
  {
    tool: 'copilot',
    directories: [],
    singleFile: '.github/copilot-instructions.md',
    extensions: ['.md']
  }
]

function makeSkillId(tool: AITool, repoPath: string, relativePath: string): string {
  return crypto.createHash('md5').update(`${tool}:${repoPath}:${relativePath}`).digest('hex').slice(0, 12)
}

function parseFrontmatter(content: string): Record<string, unknown> | undefined {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return undefined

  const yaml = match[1]
  const result: Record<string, unknown> = {}
  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim()
    if (key) result[key] = value
  }
  return Object.keys(result).length > 0 ? result : undefined
}

function isDisabledFile(filename: string): boolean {
  return filename.endsWith('.disabled')
}

function getBaseName(filename: string): string {
  if (isDisabledFile(filename)) {
    return filename.replace(/\.disabled$/, '')
  }
  return filename
}

/**
 * Scans .agents/skills (or similar shared dirs) which may contain either:
 * - Flat .md files directly in the directory
 * - Subdirectories where each folder has a SKILL.md entry file (skills.sh convention)
 * Returns all found skills attributed to 'claude' tool.
 */
function scanSharedSkillsDir(repoPath: string, dir: string): SkillFile[] {
  const fullDir = path.join(repoPath, dir)
  if (!fs.existsSync(fullDir)) return []

  const skills: SkillFile[] = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(fullDir, { withFileTypes: true })
  } catch {
    return []
  }

  for (const entry of entries) {
    if (entry.isFile()) {
      // Flat .md file directly in the shared dir
      const ext = path.extname(entry.name).toLowerCase()
      if (ext !== '.md') continue

      const relativePath = path.join(dir, entry.name)
      const fullPath = path.join(repoPath, relativePath)
      let content: string
      try {
        content = fs.readFileSync(fullPath, 'utf-8')
      } catch {
        continue
      }
      skills.push({
        id: makeSkillId('claude', repoPath, relativePath),
        tool: 'claude',
        name: path.basename(entry.name, ext),
        relativePath,
        content,
        enabled: true,
        frontmatter: parseFrontmatter(content)
      })
    } else if (entry.isDirectory()) {
      // skills.sh convention: subdirectory with SKILL.md as the entry point
      const skillMdPath = path.join(fullDir, entry.name, 'SKILL.md')
      if (!fs.existsSync(skillMdPath)) continue

      const relativePath = path.join(dir, entry.name, 'SKILL.md')
      let content: string
      try {
        content = fs.readFileSync(skillMdPath, 'utf-8')
      } catch {
        continue
      }
      skills.push({
        id: makeSkillId('claude', repoPath, relativePath),
        tool: 'claude',
        name: entry.name, // use directory name as skill name
        relativePath,
        content,
        enabled: true,
        frontmatter: parseFrontmatter(content)
      })
    }
  }

  return skills
}

function scanDirectory(repoPath: string, tool: AITool, dir: string, extensions: string[]): SkillFile[] {
  const fullDir = path.join(repoPath, dir)
  if (!fs.existsSync(fullDir)) return []

  const skills: SkillFile[] = []
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(fullDir, { withFileTypes: true })
  } catch {
    return []
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue

    const baseName = getBaseName(entry.name)
    const ext = path.extname(baseName).toLowerCase()
    if (!extensions.includes(ext)) continue

    const relativePath = path.join(dir, entry.name)
    const fullPath = path.join(repoPath, relativePath)

    let content: string
    try {
      content = fs.readFileSync(fullPath, 'utf-8')
    } catch {
      continue
    }

    const nameWithoutExt = path.basename(baseName, ext)

    skills.push({
      id: makeSkillId(tool, repoPath, relativePath),
      tool,
      name: nameWithoutExt,
      relativePath,
      content,
      enabled: !isDisabledFile(entry.name),
      frontmatter: parseFrontmatter(content)
    })
  }

  return skills
}

function scanSingleFile(repoPath: string, tool: AITool, singleFile: string): SkillFile[] {
  const fullPath = path.join(repoPath, singleFile)
  const disabledPath = fullPath + '.disabled'

  let actualPath = fullPath
  let enabled = true

  if (fs.existsSync(fullPath)) {
    actualPath = fullPath
    enabled = true
  } else if (fs.existsSync(disabledPath)) {
    actualPath = disabledPath
    enabled = false
  } else {
    return []
  }

  let content: string
  try {
    content = fs.readFileSync(actualPath, 'utf-8')
  } catch {
    return []
  }

  const relativePath = enabled ? singleFile : singleFile + '.disabled'
  const ext = path.extname(singleFile)
  const nameWithoutExt = path.basename(singleFile, ext)

  return [
    {
      id: makeSkillId(tool, repoPath, relativePath),
      tool,
      name: nameWithoutExt,
      relativePath,
      content,
      enabled,
      frontmatter: parseFrontmatter(content)
    }
  ]
}

export async function scanRepoSkills(
  repoId: string,
  repoPath: string,
  _skillsDir: 'tool-specific' | 'shared' = 'tool-specific'
): Promise<RepoSkills> {
  const skills: SkillFile[] = []

  for (const config of TOOL_CONFIGS) {
    // Scan tool-specific directories (always)
    for (const dir of config.directories) {
      skills.push(...scanDirectory(repoPath, config.tool, dir, config.extensions))
    }

    // Scan single file (always, regardless of skillsDir)
    if (config.singleFile) {
      skills.push(...scanSingleFile(repoPath, config.tool, config.singleFile))
    }
  }

  // Scan shared .agents/skills once (not per-tool) — handles both flat files and
  // skills.sh-style subdirectories (each folder has a SKILL.md entry file)
  skills.push(...scanSharedSkillsDir(repoPath, '.agents/skills'))

  return {
    repoId,
    repoPath,
    skills,
    lastScanned: Date.now()
  }
}
