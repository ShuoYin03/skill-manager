import { useCallback, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useLicense } from '../../hooks/useLicense'
import { WEBSITE_URL } from '../../constants'

export function AccountSection(): JSX.Element {
  const { state, dispatch } = useAppContext()
  const { isLicensed, isTrial, isExpired, daysLeft } = useLicense()
  const [signingIn, setSigningIn] = useState(false)

  const handleSignIn = useCallback(async () => {
    setSigningIn(true)
    await window.electronAPI.signIn()
    // The actual session will come via onAuthCallback event
    // Set a timeout to reset the button in case the user cancels
    setTimeout(() => setSigningIn(false), 30000)
  }, [])

  const handleSignOut = useCallback(async () => {
    await window.electronAPI.signOut()
    dispatch({ type: 'SET_AUTH_USER', payload: null })
    const licenseStatus = await window.electronAPI.getLicenseStatus()
    dispatch({ type: 'SET_LICENSE_STATUS', payload: licenseStatus })
  }, [dispatch])

  return (
    <div className="settings-section">
      <div className="settings-section-title">Account</div>

      {state.authUser ? (
        <div className="account-card">
          <div className="account-info">
            {state.authUser.avatarUrl && (
              <img
                className="account-avatar"
                src={state.authUser.avatarUrl}
                alt=""
              />
            )}
            <div className="account-details">
              <div className="account-email">{state.authUser.email}</div>
              <div className="account-license-badge">
                {isLicensed && <span className="license-badge licensed">Licensed</span>}
                {isTrial && (
                  <span className="license-badge trial">
                    Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                  </span>
                )}
                {isExpired && <span className="license-badge expired">Trial expired</span>}
              </div>
            </div>
          </div>
          <div className="account-actions">
            {!isLicensed && (
              <button
                className="account-buy-btn"
                onClick={() => window.open(WEBSITE_URL, '_blank')}
              >
                Buy License
              </button>
            )}
            <button className="account-signout-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="account-card">
          <div className="account-info">
            <div className="account-details">
              <div className="account-email">Not signed in</div>
              <div className="account-license-badge">
                {isTrial && (
                  <span className="license-badge trial">
                    Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                  </span>
                )}
                {isExpired && <span className="license-badge expired">Trial expired</span>}
              </div>
            </div>
          </div>
          <button
            className="account-signin-btn"
            onClick={handleSignIn}
            disabled={signingIn}
          >
            {signingIn ? 'Opening browser...' : 'Sign in with Google'}
          </button>
        </div>
      )}
    </div>
  )
}
