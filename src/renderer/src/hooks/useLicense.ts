import { useAppContext } from '../context/AppContext'

const MAX_REPOS_WHEN_EXPIRED = 3

export function useLicense() {
  const { state } = useAppContext()
  const { licenseStatus } = state

  const isLicensed = licenseStatus?.state === 'licensed'
  const isTrial = licenseStatus?.state === 'trial'
  const isExpired = licenseStatus?.state === 'expired'
  const daysLeft = licenseStatus?.trialDaysLeft ?? null
  const isLimited = isExpired
  const maxRepos = isLimited ? MAX_REPOS_WHEN_EXPIRED : Infinity

  return { licenseStatus, isLicensed, isTrial, isExpired, daysLeft, isLimited, maxRepos }
}
