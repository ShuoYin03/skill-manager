import { SUPABASE_URL } from './config'
import { getSession } from './auth-service'
import { getTrialDaysLeft, isTrialExpired } from './trial-service'
import { getLicenseCache, setLicenseCache } from './store'
import type { LicenseStatus } from '../shared/types'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

function getTrialStatus(userEmail: string | null = null): LicenseStatus {
  const daysLeft = getTrialDaysLeft()
  return {
    state: isTrialExpired() ? 'expired' : 'trial',
    trialDaysLeft: daysLeft,
    userEmail
  }
}

export async function verifyLicense(): Promise<LicenseStatus> {
  const session = await getSession()

  if (!session) {
    return getTrialStatus()
  }

  const userEmail = session.user.email ?? null

  // Check cache first
  const cached = getLicenseCache()
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
    return cached.status
  }

  // Call Supabase Edge Function
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-license`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return fallback(cached, userEmail)
    }

    const data = await response.json()

    const status: LicenseStatus = data.valid
      ? { state: 'licensed', trialDaysLeft: null, userEmail }
      : getTrialStatus(userEmail)

    setLicenseCache({ status, checkedAt: Date.now() })
    return status
  } catch {
    return fallback(cached, userEmail)
  }
}

function fallback(cached: ReturnType<typeof getLicenseCache>, userEmail: string | null): LicenseStatus {
  if (cached) return cached.status
  return getTrialStatus(userEmail)
}
