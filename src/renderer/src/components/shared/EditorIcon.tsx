import {
  siWebstorm,
  siPycharm,
  siIntellijidea,
  siGoland,
  siClion,
  siPhpstorm,
  siRider,
  siCursor,
  siNeovim,
  siSublimetext,
  siZedindustries,
  siVscodium
} from 'simple-icons'
import type { EditorId } from '../../../../shared/types'

interface EditorIconProps {
  editorId: EditorId
  size?: number
}

// JetBrains IDE brand colors (used as fill for evenodd icons)
const JETBRAINS_COLORS: Partial<Record<EditorId, string>> = {
  webstorm: '#00CDD7',
  pycharm: '#21D789',
  intellij: '#FC801D',
  goland: '#0DE0CE',
  clion: '#22D88F',
  phpstorm: '#B74AE5',
  rider: '#C21325'
}

function JetBrainsIcon({ path, color, size }: { path: string; color: string; size: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d={path} fill={color} fillRule="evenodd" />
    </svg>
  )
}

function SimpleIcon({ path, color, size }: { path: string; color: string; size: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d={path} fill={color} />
    </svg>
  )
}

function DarkBgIcon({ path, bg, size }: { path: string; bg: string; size: number }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect width="24" height="24" rx="4" fill={bg} />
      <path d={path} fill="white" />
    </svg>
  )
}

export function EditorIcon({ editorId, size = 16 }: EditorIconProps): JSX.Element {
  switch (editorId) {
    case 'vscode':
      return <SimpleIcon path={siVscodium.path} color="#007ACC" size={size} />

    case 'cursor':
      return <DarkBgIcon path={siCursor.path} bg="#181818" size={size} />

    case 'webstorm':
      return <JetBrainsIcon path={siWebstorm.path} color={JETBRAINS_COLORS.webstorm!} size={size} />

    case 'pycharm':
      return <JetBrainsIcon path={siPycharm.path} color={JETBRAINS_COLORS.pycharm!} size={size} />

    case 'intellij':
      return <JetBrainsIcon path={siIntellijidea.path} color={JETBRAINS_COLORS.intellij!} size={size} />

    case 'goland':
      return <JetBrainsIcon path={siGoland.path} color={JETBRAINS_COLORS.goland!} size={size} />

    case 'clion':
      return <JetBrainsIcon path={siClion.path} color={JETBRAINS_COLORS.clion!} size={size} />

    case 'phpstorm':
      return <JetBrainsIcon path={siPhpstorm.path} color={JETBRAINS_COLORS.phpstorm!} size={size} />

    case 'rider':
      return <JetBrainsIcon path={siRider.path} color={JETBRAINS_COLORS.rider!} size={size} />

    case 'rustrover':
      // JetBrains RustRover — same outer-square pattern as other JB IDEs
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <rect width="24" height="24" rx="3" fill="#FF7C00" />
          <text x="3" y="17" fontFamily="monospace" fontWeight="bold" fontSize="10" fill="white">RR</text>
        </svg>
      )

    case 'neovim':
      return <SimpleIcon path={siNeovim.path} color={`#${siNeovim.hex}`} size={size} />

    case 'sublime':
      return <SimpleIcon path={siSublimetext.path} color={`#${siSublimetext.hex}`} size={size} />

    case 'zed':
      return <SimpleIcon path={siZedindustries.path} color={`#${siZedindustries.hex}`} size={size} />

    case 'terminal':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <rect width="24" height="24" rx="4" fill="#2D2D2D" />
          <path d="M4 8l4 4-4 4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <line x1="12" y1="16" x2="20" y2="16" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )

    case 'finder':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <rect width="24" height="24" rx="4" fill="#4A90D9" />
          <circle cx="9" cy="11" r="3" fill="white" />
          <circle cx="15" cy="11" r="3" fill="white" />
          <circle cx="9" cy="11" r="1.5" fill="#4A90D9" />
          <circle cx="15" cy="11" r="1.5" fill="#4A90D9" />
          <path d="M6 15.5 Q9 17.5 12 15.5 Q15 17.5 18 15.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 24 24" width={size} height={size}>
          <rect width="24" height="24" rx="4" fill="#888" />
        </svg>
      )
  }
}
