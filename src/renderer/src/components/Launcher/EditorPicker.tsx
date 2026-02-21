import { useEffect, useRef } from 'react'
import { useAppContext } from '../../context/AppContext'
import type { EditorId } from '../../../../shared/types'
import { EditorIcon } from '../shared/EditorIcon'

interface EditorPickerProps {
  repoId: string
  position: { x: number; y: number }
  onClose: () => void
}

export function EditorPicker({ repoId, position, onClose }: EditorPickerProps): JSX.Element {
  const { state } = useAppContext()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc, true)
    return () => document.removeEventListener('keydown', handleEsc, true)
  }, [onClose])

  const handleSelect = (editorId: EditorId): void => {
    window.electronAPI.openInEditor(repoId, editorId)
    onClose()
  }

  return (
    <>
      <div className="editor-picker-overlay" onClick={onClose} />
      <div
        ref={ref}
        className="editor-picker"
        style={{
          top: Math.min(position.y, window.innerHeight - 250),
          left: Math.min(position.x, window.innerWidth - 200)
        }}
      >
        {state.editors.map((editor) => (
          <button
            key={editor.id}
            className="editor-picker-item"
            onClick={() => handleSelect(editor.id)}
          >
            <EditorIcon editorId={editor.id} size={15} />
            <span>{editor.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
