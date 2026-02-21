import { useEffect, useCallback } from 'react'

export function useKeyboardNavigation(
  filteredCount: number,
  selectedIndex: number,
  onSelectIndex: (index: number) => void,
  onConfirm: () => void,
  onDismiss: () => void
): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          onSelectIndex(filteredCount > 0 ? (selectedIndex + 1) % filteredCount : 0)
          break
        case 'ArrowUp':
          e.preventDefault()
          onSelectIndex(
            filteredCount > 0 ? (selectedIndex - 1 + filteredCount) % filteredCount : 0
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCount > 0) {
            onConfirm()
          }
          break
        case 'Escape':
          e.preventDefault()
          onDismiss()
          break
      }
    },
    [filteredCount, selectedIndex, onSelectIndex, onConfirm, onDismiss]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
