import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { AITool, SkillFile } from '../shared/types'

interface ToolFileConfig {
  dir: string
  ext: string
}

const TOOL_FILE_CONFIGS: Record<AITool, ToolFileConfig> = {
  claude: { dir: '.claude/skills', ext: '.md' },
  cursor: { dir: '.cursor/rules', ext: '.mdc' },
  windsurf: { dir: '.windsurf/rules', ext: '.md' },
  codex: { dir: '.codex', ext: '.md' },
  copilot: { dir: '.github', ext: '.md' }
}

const SHARED_DIR = '.agent/skills'

function getEffectiveConfig(tool: AITool, skillsDir: 'tool-specific' | 'shared'): ToolFileConfig {
  if (skillsDir === 'shared' && tool !== 'codex' && tool !== 'copilot') {
    return { dir: SHARED_DIR, ext: '.md' }
  }
  return TOOL_FILE_CONFIGS[tool]
}

const SINGLE_FILE_TOOLS: Partial<Record<AITool, string>> = {
  codex: '.codex/instructions.md',
  copilot: '.github/copilot-instructions.md'
}

function makeSkillId(tool: AITool, repoPath: string, relativePath: string): string {
  return crypto.createHash('md5').update(`${tool}:${repoPath}:${relativePath}`).digest('hex').slice(0, 12)
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

export async function createSkill(
  repoPath: string,
  tool: AITool,
  name: string,
  content: string,
  skillsDir: 'tool-specific' | 'shared' = 'tool-specific'
): Promise<SkillFile> {
  const singleFile = SINGLE_FILE_TOOLS[tool]

  let relativePath: string
  let fullPath: string

  if (singleFile) {
    // Single-file tools: write to the single file
    relativePath = singleFile
    fullPath = path.join(repoPath, relativePath)
    ensureDir(path.dirname(fullPath))

    // If file exists, append a section separator + new content
    if (fs.existsSync(fullPath)) {
      const existing = fs.readFileSync(fullPath, 'utf-8')
      content = existing.trimEnd() + '\n\n---\n\n' + content
    }
  } else {
    const config = getEffectiveConfig(tool, skillsDir)
    const filename = name.replace(/[^a-zA-Z0-9_-]/g, '-') + config.ext
    relativePath = path.join(config.dir, filename)
    fullPath = path.join(repoPath, relativePath)
    ensureDir(path.dirname(fullPath))
  }

  fs.writeFileSync(fullPath, content, 'utf-8')

  return {
    id: makeSkillId(tool, repoPath, relativePath),
    tool,
    name,
    relativePath,
    content,
    enabled: true
  }
}

export async function updateSkill(
  repoPath: string,
  skill: SkillFile
): Promise<void> {
  const fullPath = path.join(repoPath, skill.relativePath)
  fs.writeFileSync(fullPath, skill.content, 'utf-8')
}

export async function deleteSkill(
  repoPath: string,
  skill: SkillFile
): Promise<void> {
  const fullPath = path.join(repoPath, skill.relativePath)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
  // Also try the disabled variant
  const disabledPath = fullPath + '.disabled'
  if (fs.existsSync(disabledPath)) {
    fs.unlinkSync(disabledPath)
  }
}

export async function toggleSkill(
  repoPath: string,
  skill: SkillFile
): Promise<SkillFile> {
  const currentPath = path.join(repoPath, skill.relativePath)

  let newRelativePath: string
  let newEnabled: boolean

  if (skill.enabled) {
    // Disable: add .disabled suffix
    newRelativePath = skill.relativePath + '.disabled'
    newEnabled = false
  } else {
    // Enable: remove .disabled suffix
    newRelativePath = skill.relativePath.replace(/\.disabled$/, '')
    newEnabled = true
  }

  const newPath = path.join(repoPath, newRelativePath)

  if (fs.existsSync(currentPath)) {
    fs.renameSync(currentPath, newPath)
  }

  return {
    ...skill,
    id: makeSkillId(skill.tool, repoPath, newRelativePath),
    relativePath: newRelativePath,
    enabled: newEnabled
  }
}

export async function globalizeSkill(
  skill: SkillFile,
  allRepoPaths: string[],
  skillsDir: 'tool-specific' | 'shared' = 'tool-specific'
): Promise<number> {
  let count = 0
  const config = getEffectiveConfig(skill.tool, skillsDir)
  const singleFile = SINGLE_FILE_TOOLS[skill.tool]

  for (const repoPath of allRepoPaths) {
    try {
      if (singleFile) {
        const fullPath = path.join(repoPath, singleFile)
        ensureDir(path.dirname(fullPath))
        if (fs.existsSync(fullPath)) {
          const existing = fs.readFileSync(fullPath, 'utf-8')
          if (!existing.includes(skill.content.trim())) {
            fs.writeFileSync(fullPath, existing.trimEnd() + '\n\n---\n\n' + skill.content, 'utf-8')
            count++
          }
        } else {
          fs.writeFileSync(fullPath, skill.content, 'utf-8')
          count++
        }
      } else {
        const filename = skill.name.replace(/[^a-zA-Z0-9_-]/g, '-') + config.ext
        const targetPath = path.join(repoPath, config.dir, filename)
        ensureDir(path.dirname(targetPath))
        fs.writeFileSync(targetPath, skill.content, 'utf-8')
        count++
      }
    } catch {
      // Skip repos where we can't write
    }
  }

  return count
}
