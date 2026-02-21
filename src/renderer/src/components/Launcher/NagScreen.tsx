import { useAppContext } from '../../context/AppContext'
import { WEBSITE_URL } from '../../constants'

interface Props {
  onDismiss: () => void
}

export function NagScreen({ onDismiss }: Props): JSX.Element {
  const { state, dispatch } = useAppContext()
  const isSignedIn = !!state.authUser

  return (
    <div className="nag-screen">
      <div className="nag-content">
        <div className="nag-title">Trial ended</div>
        <div className="nag-subtitle">
          Your 7-day free trial has expired. You can still use Repo Launcher with up to 3 repos.
          Purchase a license to unlock unlimited access.
        </div>
        <div className="nag-actions">
          <button
            className="nag-buy-btn"
            onClick={() => window.open(WEBSITE_URL, '_blank')}
          >
            Buy License — $5
          </button>
          {!isSignedIn && (
            <button
              className="nag-signin-btn"
              onClick={() => {
                dispatch({ type: 'SET_VIEW', payload: 'settings' })
              }}
            >
              Already purchased? Sign in
            </button>
          )}
          <button className="nag-dismiss-btn" onClick={onDismiss}>
            Continue for free
          </button>
        </div>
      </div>
    </div>
  )
}
