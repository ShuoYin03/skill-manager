import { useAppContext } from '../../context/AppContext'
import type { EditorId } from '../../../../shared/types'

interface EditorSelectorProps {
  value: EditorId | null
  onChange: (editorId: EditorId | null) => void
  allowNone?: boolean
  noneLabel?: string
}

export function EditorSelector({
  value,
  onChange,
  allowNone = false,
  noneLabel = 'Use default'
}: EditorSelectorProps): JSX.Element {
  const { state } = useAppContext()

  return (
    <select
      className="settings-select"
      value={value || ''}
      onChange={(e) => onChange((e.target.value || null) as EditorId | null)}
    >
      {allowNone && <option value="">{noneLabel}</option>}
      {state.editors.map((editor) => (
        <option key={editor.id} value={editor.id}>
          {editor.label}
        </option>
      ))}
    </select>
  )
}
