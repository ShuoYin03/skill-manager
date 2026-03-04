import { useState, useCallback } from 'react'
import { useAppContext } from '../../context/AppContext'
import { EditorSelector } from './EditorSelector'
import type { EditorId, AppSettings } from '../../../../shared/types'

// Convert keydown event to Electron accelerator string
function keyEventToAccelerator(e: KeyboardEvent): string | null {
  const parts: string[] = []

  if (e.metaKey) parts.push('Command')
  if (e.ctrlKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  const key = e.key
  // Skip if only modifier keys are pressed
  if (['Meta', 'Control', 'Alt', 'Shift'].includes(key)) return null

  // Need at least one modifier
  if (parts.length === 0) return null

  // Map special keys
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Tab: 'Tab'
  }

  const mappedKey = keyMap[key] || key.toUpperCase()
  parts.push(mappedKey)

  return parts.join('+')
}

// Detect macOS via user agent (process.platform not available in sandboxed renderer)
const isMac = navigator.userAgent.includes('Macintosh')

// Display-friendly version of accelerator
function formatAccelerator(accelerator: string): string {
  return accelerator
    .replace('CommandOrControl', isMac ? 'Cmd' : 'Ctrl')
    .replace('Command', 'Cmd')
    .replace('Control', 'Ctrl')
}

export function GeneralSettings(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const [isRecording, setIsRecording] = useState(false)
  const [hotkeyDisplay, setHotkeyDisplay] = useState(
    formatAccelerator(state.settings.globalHotkey)
  )

  const updateSetting = useCallback(
    async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      const result = await window.electronAPI.updateSettings({ [key]: value })
      if ('settings' in result) {
        dispatch({ type: 'SET_SETTINGS', payload: result.settings })
      }
    },
    [dispatch]
  )

  const handleHotkeyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const accelerator = keyEventToAccelerator(e.nativeEvent)
      if (accelerator) {
        setHotkeyDisplay(formatAccelerator(accelerator))
        setIsRecording(false)
        // Use CommandOrControl for cross-platform compatibility
        const normalized = accelerator.replace('Command', 'CommandOrControl').replace('Control', 'CommandOrControl')
        // Deduplicate CommandOrControl
        const final = normalized.includes('CommandOrControl+CommandOrControl')
          ? normalized.replace('CommandOrControl+CommandOrControl', 'CommandOrControl')
          : normalized
        updateSetting('globalHotkey', final)
      }
    },
    [updateSetting]
  )

  return (
    <div className="settings-section">
      <div className="settings-section-title">General</div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Global Hotkey</div>
          <div className="settings-row-description">Shortcut to show/hide the launcher</div>
        </div>
        <input
          className={`hotkey-input ${isRecording ? 'recording' : ''}`}
          value={isRecording ? 'Press keys...' : hotkeyDisplay}
          onFocus={() => { setIsRecording(true); void window.electronAPI.suspendShortcut() }}
          onBlur={() => { setIsRecording(false); void window.electronAPI.resumeShortcut() }}
          onKeyDown={handleHotkeyKeyDown}
          readOnly
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Default Editor</div>
          <div className="settings-row-description">Used when no per-folder override is set</div>
        </div>
        <EditorSelector
          value={state.settings.defaultEditor}
          onChange={(id) => id && updateSetting('defaultEditor', id as EditorId)}
        />
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Theme</div>
        </div>
        <div className="theme-toggle">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              className={state.settings.theme === t ? 'active' : ''}
              onClick={() => updateSetting('theme', t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Launch at Login</div>
          <div className="settings-row-description">Start Repo Launcher when you log in</div>
        </div>
        <div
          className={`toggle-switch ${state.settings.launchAtLogin ? 'active' : ''}`}
          onClick={() => updateSetting('launchAtLogin', !state.settings.launchAtLogin)}
        />
      </div>

    </div>
  )
}
