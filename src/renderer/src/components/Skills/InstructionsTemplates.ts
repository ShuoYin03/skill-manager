export interface InstructionTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  content: string
}

export const INSTRUCTIONS_TEMPLATES: InstructionTemplate[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'A simple starting point with just the essentials',
    tags: ['general'],
    content: `# Project Context

## Overview
Brief description of this project.

## Key Conventions
- List important coding conventions here

## Notes for AI
- Any special instructions or context
`
  },
  {
    id: 'nextjs-typescript',
    name: 'Next.js + TypeScript',
    description: 'For Next.js projects with TypeScript and React',
    tags: ['nextjs', 'typescript', 'react'],
    content: `# Project Context

## Stack
- Next.js (App Router)
- TypeScript (strict mode)
- React

## Conventions
- Use server components by default; add "use client" only when needed
- Prefer \`async/await\` over \`.then()\`
- Use TypeScript interfaces over types for object shapes
- Never use \`any\` — use \`unknown\` for truly unknown types
- Use \`import type\` for type-only imports

## File Structure
- \`app/\` — Next.js App Router pages and layouts
- \`components/\` — Reusable UI components
- \`lib/\` — Utility functions and shared logic

## Important Notes
- Run \`npm run typecheck\` before committing
- Keep components small and focused
`
  },
  {
    id: 'python-project',
    name: 'Python Project',
    description: 'For Python backend or data science projects',
    tags: ['python', 'backend'],
    content: `# Project Context

## Stack
- Python 3.11+
- [Add framework: FastAPI / Django / Flask]

## Conventions
- Follow PEP 8 style guide
- Use type hints for all function signatures
- Write docstrings for public functions and classes
- Use \`pathlib.Path\` instead of \`os.path\`
- Prefer f-strings for string formatting
- Use \`ruff\` for linting

## Testing
- Use \`pytest\` for tests
- Tests live in \`tests/\` directory
- Run \`pytest\` before committing

## Important Notes
- Virtual environment: \`venv/\` (not committed)
- Dependencies: \`requirements.txt\` or \`pyproject.toml\`
`
  },
  {
    id: 'monorepo',
    name: 'Monorepo',
    description: 'For monorepos with multiple packages',
    tags: ['monorepo', 'workspace'],
    content: `# Project Context

## Structure
This is a monorepo. Key packages:
- \`packages/\` — Shared libraries
- \`apps/\` — Applications

## Conventions
- Changes to \`packages/\` must be backward-compatible
- Always specify which package you're working in
- Run \`npm run build\` from root to build all packages
- Use workspace imports (\`@workspace/pkg\`) not relative paths across packages

## Important Notes
- Root \`package.json\` manages shared devDependencies
- Each package has its own \`tsconfig.json\`
`
  },
  {
    id: 'api-service',
    name: 'API Service',
    description: 'For backend REST or GraphQL API services',
    tags: ['api', 'backend', 'rest'],
    content: `# Project Context

## Overview
REST API service. [Add brief description]

## Conventions
- Use proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Validate all input at API boundaries
- Never expose internal error details to clients
- Use parameterized queries — never string concatenation for SQL
- Log errors with context but without sensitive data

## Auth
- [Describe auth mechanism: JWT / session / API key]

## Testing
- Integration tests for all endpoints
- Run \`npm test\` before committing

## Environment
- Copy \`.env.example\` to \`.env\` for local dev
- Never commit \`.env\` files
`
  },
  {
    id: 'mobile-react-native',
    name: 'React Native',
    description: 'For React Native mobile apps',
    tags: ['react-native', 'mobile', 'typescript'],
    content: `# Project Context

## Stack
- React Native
- TypeScript
- [Expo / bare workflow]

## Conventions
- Use functional components and hooks
- Prefer \`StyleSheet.create()\` over inline styles
- Test on both iOS and Android before considering a change complete
- Use platform-specific files (\`.ios.tsx\`, \`.android.tsx\`) only when unavoidable

## Important Notes
- Run on simulator with \`npx expo start\` (or \`npm run ios\` / \`npm run android\`)
- Avoid native modules unless absolutely necessary
`
  },
  {
    id: 'electron-app',
    name: 'Electron App',
    description: 'For Electron desktop applications',
    tags: ['electron', 'typescript', 'desktop'],
    content: `# Project Context

## Stack
- Electron
- TypeScript
- React (renderer process)

## Architecture
- \`src/main/\` — Main process (Node.js)
- \`src/renderer/\` — Renderer process (React)
- \`src/preload/\` — Preload script (IPC bridge)
- \`src/shared/\` — Types and constants shared across processes

## Conventions
- All IPC channels defined in \`src/shared/constants.ts\`
- Never import main-process modules in renderer
- Expose only specific methods via \`contextBridge\` in preload
- Sanitize all data crossing IPC boundaries

## Build
- Dev: \`npm run dev\`
- Build: \`npm run build\`
`
  },
  {
    id: 'library',
    name: 'Library / Package',
    description: 'For npm packages or libraries meant for publishing',
    tags: ['library', 'npm', 'typescript'],
    content: `# Project Context

## Overview
A library published to npm. [Add description]

## Key Principles
- Maintain backward compatibility — breaking changes require major version bump
- Keep the public API surface minimal
- Write comprehensive JSDoc for all public exports
- Tree-shakeable: use named exports, not default exports

## Conventions
- Public API in \`src/index.ts\`
- Tests use \`vitest\` (or \`jest\`)
- No side effects at import time

## Build
- \`npm run build\` — compile to \`dist/\`
- \`npm run test\` — run test suite
- Do not commit \`dist/\`
`
  }
]
