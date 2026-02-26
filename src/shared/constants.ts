export const IPC = {
  REPOS_GET_ALL: 'repos:get-all',
  REPOS_ADD: 'repos:add',
  REPOS_REMOVE: 'repos:remove',
  REPOS_UPDATE: 'repos:update',
  REPOS_REFRESH_BRANCHES: 'repos:refresh-branches',

  EDITOR_OPEN: 'editor:open',
  EDITOR_GET_AVAILABLE: 'editor:get-available',

  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  WINDOW_HIDE: 'window:hide',

  LAUNCHER_SHOWN: 'launcher:shown',
  LAUNCHER_HIDDEN: 'launcher:hidden',
  NAVIGATE_SETTINGS: 'navigate:settings',

  AUTH_SIGN_IN: 'auth:sign-in',
  AUTH_SIGN_OUT: 'auth:sign-out',
  AUTH_GET_SESSION: 'auth:get-session',
  AUTH_CALLBACK_RECEIVED: 'auth:callback-received',

  LICENSE_GET_STATUS: 'license:get-status',
  LICENSE_VERIFY: 'license:verify',

  // Skills
  SKILLS_SCAN_REPO: 'skills:scan-repo',
  SKILLS_SCAN_ALL: 'skills:scan-all',
  SKILLS_CREATE: 'skills:create',
  SKILLS_UPDATE: 'skills:update',
  SKILLS_DELETE: 'skills:delete',
  SKILLS_TOGGLE: 'skills:toggle',
  SKILLS_GLOBALIZE: 'skills:globalize',

  // Presets
  SKILLS_PRESETS_GET: 'skills:presets:get',
  SKILLS_PRESETS_SAVE: 'skills:presets:save',
  SKILLS_PRESETS_UPDATE: 'skills:presets:update',
  SKILLS_PRESETS_DELETE: 'skills:presets:delete',
  SKILLS_PRESETS_APPLY: 'skills:presets:apply',

  // Marketplace
  SKILLS_MARKETPLACE_SEARCH: 'skills:marketplace:search',
  SKILLS_MARKETPLACE_GET: 'skills:marketplace:get',
  SKILLS_MARKETPLACE_INSTALL: 'skills:marketplace:install',
  SKILLS_MARKETPLACE_FILTER_STATS: 'skills:marketplace:filter-stats',
  GET_HOME_DIR: 'get:home-dir',

  // Instruction files (CLAUDE.md, .cursorrules, etc.)
  INSTRUCTIONS_SCAN: 'instructions:scan',
  INSTRUCTIONS_READ: 'instructions:read',
  INSTRUCTIONS_WRITE: 'instructions:write',
  INSTRUCTIONS_GLOBALIZE: 'instructions:globalize',

} as const
