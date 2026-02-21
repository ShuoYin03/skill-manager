import fs from 'fs/promises'
import path from 'path'
import type { InstructionTool, InstructionFile } from '../shared/types'

export type { InstructionTool, InstructionFile }
// Backwards-compat aliases used internally
export type MemoryTool = InstructionTool
export type MemoryFile = InstructionFile

const MEMORY_FILE_CONFIG: Record<MemoryTool, { label: string; relativePath: string }> = {
  claude: { label: 'Claude Code', relativePath: 'CLAUDE.md' },
  cursor: { label: 'Cursor', relativePath: '.cursorrules' },
  windsurf: { label: 'Windsurf', relativePath: '.windsurfrules' },
  copilot: { label: 'GitHub Copilot', relativePath: '.github/copilot-instructions.md' }
}

export async function scanMemoryFiles(repoPath: string): Promise<MemoryFile[]> {
  const results: MemoryFile[] = []
  for (const [tool, config] of Object.entries(MEMORY_FILE_CONFIG) as [MemoryTool, { label: string; relativePath: string }][]) {
    const fullPath = path.join(repoPath, config.relativePath)
    let exists = false
    let content: string | null = null
    try {
      content = await fs.readFile(fullPath, 'utf-8')
      exists = true
    } catch {
      // File doesn't exist
    }
    results.push({ tool, label: config.label, relativePath: config.relativePath, exists, content })
  }
  return results
}

export async function readMemoryFile(repoPath: string, tool: MemoryTool): Promise<string> {
  const config = MEMORY_FILE_CONFIG[tool]
  const fullPath = path.join(repoPath, config.relativePath)
  try {
    return await fs.readFile(fullPath, 'utf-8')
  } catch {
    return ''
  }
}

export async function writeMemoryFile(repoPath: string, tool: MemoryTool, content: string): Promise<void> {
  const config = MEMORY_FILE_CONFIG[tool]
  const fullPath = path.join(repoPath, config.relativePath)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, content, 'utf-8')
}

export async function globalizeMemoryFile(
  sourceRepoPath: string,
  tool: MemoryTool,
  allRepoPaths: string[]
): Promise<number> {
  const content = await readMemoryFile(sourceRepoPath, tool)
  if (!content) return 0
  let count = 0
  for (const repoPath of allRepoPaths) {
    if (repoPath === sourceRepoPath) continue
    try {
      await writeMemoryFile(repoPath, tool, content)
      count++
    } catch { /* skip repos we can't write to */ }
  }
  return count
}
