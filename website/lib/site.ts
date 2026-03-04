export const SITE_URL = 'https://skilly-azure.vercel.app'

export const SKILLY_ONE_LINER =
  'Skilly is a desktop app to discover, install, and manage AI coding skills across projects.'

export const MARKETING_EVENT_NAMES = [
  'page_view',
  'download_click',
  'platform_download_click',
  'trial_started',
  'first_skill_install',
  'license_activated'
] as const

export type MarketingEventName = (typeof MARKETING_EVENT_NAMES)[number]
