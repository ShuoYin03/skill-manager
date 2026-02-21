import { useLicense } from '../../hooks/useLicense'
import { WEBSITE_URL } from '../../constants'

export function TrialBanner(): JSX.Element | null {
  const { isTrial, daysLeft } = useLicense()

  if (!isTrial || daysLeft === null) return null

  return (
    <span className="trial-banner">
      Trial: {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
      {' · '}
      <a
        className="trial-banner-link"
        onClick={() => window.open(WEBSITE_URL, '_blank')}
      >
        Buy now
      </a>
    </span>
  )
}
