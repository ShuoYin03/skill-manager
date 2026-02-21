import type { AITool } from '../../../../shared/types'

const TOOL_COLORS: Record<AITool, string> = {
  claude: '#D97706',
  cursor: '#00B4D8',
  windsurf: '#10B981',
  codex: '#8B5CF6',
  copilot: '#6366F1'
}

const TOOL_LABELS: Record<AITool, string> = {
  claude: 'Claude',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  codex: 'Codex',
  copilot: 'Copilot'
}

interface ToolIconProps {
  tool: AITool
  size?: number
}

export function ToolIcon({ tool, size = 16 }: ToolIconProps): JSX.Element {
  const color = TOOL_COLORS[tool]
  const label = TOOL_LABELS[tool][0] // First letter

  return (
    <span
      className="tool-icon"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.6,
        backgroundColor: color + '22',
        color: color,
        borderRadius: size * 0.25
      }}
      title={TOOL_LABELS[tool]}
    >
      {label}
    </span>
  )
}

export { TOOL_LABELS, TOOL_COLORS }
