import { getTrialStartedAt, setTrialStartedAt } from './store'

const TRIAL_DURATION_DAYS = 7

export function initTrial(): void {
  if (!getTrialStartedAt()) {
    setTrialStartedAt(Date.now())
  }
}

export function getTrialDaysLeft(): number {
  const startedAt = getTrialStartedAt()
  if (!startedAt) return TRIAL_DURATION_DAYS

  const elapsed = Date.now() - startedAt
  const daysElapsed = elapsed / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - daysElapsed))
}

export function isTrialExpired(): boolean {
  return getTrialDaysLeft() <= 0
}
