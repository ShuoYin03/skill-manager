export interface ContentSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface ContentQA {
  question: string
  answer: string
}

export interface MarketingContentPage {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  keywords: string[]
  tldr: string[]
  sections: ContentSection[]
  qa: ContentQA[]
  whenToUse: string[]
}

export const BLOG_POSTS: MarketingContentPage[] = [
  {
    slug: 'ai-coding-skills-management',
    title: 'AI Coding Skills Management: A Practical Guide for Indie Developers',
    description:
      'How to standardize AI coding skills across repos without slowing down shipping.',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-04',
    keywords: [
      'ai coding skills management',
      'manage claude skills',
      'cursor rules across repos',
      'developer workflow'
    ],
    tldr: [
      'Fragmented skill files create inconsistent AI output across repositories.',
      'A reusable per-project + global skill model removes repeated setup work.',
      'Use one baseline workflow, then override only what is project-specific.'
    ],
    sections: [
      {
        heading: 'The Problem: Skill Drift Across Repositories',
        paragraphs: [
          'Most developers start by dropping prompt files into each repository. It works for one project, but quickly breaks when you maintain multiple codebases.',
          'Different repositories end up with conflicting skill files, stale instructions, and inconsistent behavior across Claude, Cursor, and other tools.'
        ]
      },
      {
        heading: 'A Repeatable System That Scales',
        paragraphs: [
          'The system is simple: keep a global baseline for universal coding standards, then add project-level overrides only where business context changes.',
          'This gives you consistency by default while preserving flexibility for stack-specific or domain-specific behavior.'
        ],
        bullets: [
          'Global skills: code quality, commit style, review checklist',
          'Project skills: architecture constraints, product domain rules',
          'Preset bundles: onboarding new repos in minutes'
        ]
      },
      {
        heading: 'How to Execute Weekly',
        paragraphs: [
          'Run a lightweight weekly audit. Remove duplicate skills, merge overlapping rules, and keep one canonical version for each recurring task.',
          'Measure success with one operational metric: time from new repo creation to first productive AI-assisted commit.'
        ]
      }
    ],
    qa: [
      {
        question: 'How many skills should a repo have?',
        answer:
          'Start with 5-8 high-signal skills. Too many files create noise and reduce instruction quality.'
      },
      {
        question: 'Should every repo have unique skill files?',
        answer:
          'No. Keep most guidance in a shared baseline and only customize per repo when constraints are truly different.'
      }
    ],
    whenToUse: [
      'You maintain more than one active repository.',
      'AI output quality varies between projects.',
      'New project setup keeps repeating the same manual steps.'
    ]
  },
  {
    slug: 'claude-cursor-codex-workflow',
    title: 'Claude + Cursor + Codex: Build One Workflow Instead of Three',
    description:
      'A cross-tool skill workflow that keeps behavior consistent across Claude, Cursor, and Codex.',
    publishedAt: '2026-03-05',
    updatedAt: '2026-03-05',
    keywords: [
      'claude cursor codex workflow',
      'cross-tool ai coding setup',
      'ai developer workflow'
    ],
    tldr: [
      'Tool switching is inevitable; workflow drift is optional.',
      'Keep one source of truth for shared skill intent.',
      'Map each skill to tool-specific file formats automatically.'
    ],
    sections: [
      {
        heading: 'Why Cross-Tool Consistency Matters',
        paragraphs: [
          'Different tools excel in different moments: planning, editing, review, or quick fixes. Teams naturally mix them.',
          'Without shared skill intent, each tool gradually enforces different standards and quality drops.'
        ]
      },
      {
        heading: 'Normalize Intent, Not File Format',
        paragraphs: [
          'Define each skill by job-to-be-done first, then render that intent to tool-specific files.',
          'This approach keeps your coding standards stable while allowing tool-specific syntax where needed.'
        ],
        bullets: [
          'Intent layer: what behavior you want',
          'Format layer: where each tool expects instructions',
          'Validation layer: quick checks after updates'
        ]
      },
      {
        heading: 'Rollout Sequence for Small Teams',
        paragraphs: [
          'Start with one team preset, pilot it on 2-3 repositories, then expand. Keep updates weekly, not ad-hoc.',
          'If output diverges, fix the shared intent first before patching individual tools.'
        ]
      }
    ],
    qa: [
      {
        question: 'Do I need the same exact files for every tool?',
        answer:
          'No. You need the same underlying intent. File formats can differ while behavior remains aligned.'
      },
      {
        question: 'What should I standardize first?',
        answer:
          'Start with code review, commit message, and testing rules. They impact every repo and every tool.'
      }
    ],
    whenToUse: [
      'You actively switch between Claude, Cursor, and Codex.',
      'Your team receives inconsistent AI-generated code quality.',
      'You want one maintainable workflow across tools.'
    ]
  },
  {
    slug: 'prompt-rules-management-across-repos',
    title: 'Prompt and Rules Management Across Repos: Stop Starting from Zero',
    description:
      'A practical system for prompt/rules management across multi-repo developer environments.',
    publishedAt: '2026-03-06',
    updatedAt: '2026-03-06',
    keywords: [
      'prompt rules management across repos',
      'developer prompt management',
      'ai coding rules'
    ],
    tldr: [
      'Prompt files become technical debt when unmanaged.',
      'Treat skills as versioned workflow assets.',
      'Keep a clear lifecycle: add, validate, archive.'
    ],
    sections: [
      {
        heading: 'Prompt Files Are a Maintenance Problem',
        paragraphs: [
          'Developers often think prompt files are static setup. In reality, they are living process documents that must evolve with code standards and architecture.',
          'If nobody owns lifecycle management, prompt quality decays and generated code starts missing expectations.'
        ]
      },
      {
        heading: 'Lifecycle Model: Add, Validate, Archive',
        paragraphs: [
          'Every skill should have an owner, purpose, and review cadence. If a skill has no clear usage in 30 days, archive it.',
          'Validation can be lightweight: check whether the skill still changes output quality in real tasks.'
        ],
        bullets: [
          'Add: write a single clear job for each skill',
          'Validate: test against one real coding task',
          'Archive: remove stale or redundant instructions'
        ]
      },
      {
        heading: 'How This Improves Shipping Speed',
        paragraphs: [
          'A clean skill set reduces decision fatigue. Developers know which behavior to expect from AI tools in each repository.',
          'Consistency lowers rework, especially during review and bug-fix cycles.'
        ]
      }
    ],
    qa: [
      {
        question: 'How often should I review skill files?',
        answer:
          'Run a lightweight review weekly and a deeper consolidation monthly.'
      },
      {
        question: 'What is the first sign of prompt-rules drift?',
        answer:
          'The same request produces different coding standards across similar repositories.'
      }
    ],
    whenToUse: [
      'You have accumulated many prompt/rules files with unclear ownership.',
      'AI outputs are becoming less predictable over time.',
      'You want repeatable onboarding for new repositories.'
    ]
  }
]

export const GUIDE_PAGES: MarketingContentPage[] = [
  {
    slug: 'skilly-glossary',
    title: 'Skilly Glossary: AI Skill Workflow Terms',
    description:
      'Definitions for the core terms used in Skilly workflows, marketplaces, presets, and repo-level setup.',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-04',
    keywords: ['skilly glossary', 'ai skill terms', 'prompt engineering glossary'],
    tldr: [
      'This glossary standardizes language across website, GitHub, and community posts.',
      'Use these exact terms to keep messaging consistent for users and AI search systems.',
      'Every term focuses on workflow clarity, not buzzwords.'
    ],
    sections: [
      {
        heading: 'Core Workflow Terms',
        bullets: [
          'Skill: a reusable instruction asset for a specific coding task.',
          'Preset: a grouped collection of skills for a repeated workflow.',
          'Global skill: a skill applied across all repositories.',
          'Project skill: a skill scoped to one repository.'
        ],
        paragraphs: []
      },
      {
        heading: 'Marketplace Terms',
        bullets: [
          'Skill source: the origin repository of a skill.',
          'Install action: applying a selected skill into a target project.',
          'Customization: editing installed skill content for local needs.'
        ],
        paragraphs: []
      }
    ],
    qa: [
      {
        question: 'Why does terminology consistency matter?',
        answer:
          'Consistent terms reduce user confusion and help AI search engines map entity meaning across channels.'
      }
    ],
    whenToUse: [
      'Creating marketing copy or docs for Skilly.',
      'Publishing content on Product Hunt, Dev.to, or GitHub.',
      'Aligning team language before scaling content.'
    ]
  },
  {
    slug: 'ai-coding-skills-taxonomy',
    title: 'AI Coding Skills Taxonomy for Teams and Indie Developers',
    description:
      'A simple taxonomy to organize AI coding skills by job-to-be-done and repository lifecycle.',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-04',
    keywords: ['ai coding skills taxonomy', 'developer skill categories'],
    tldr: [
      'Categorize skills by coding job, not by tool.',
      'A small taxonomy speeds onboarding and reduces overlap.',
      'Taxonomy clarity enables lightweight programmatic SEO structures.'
    ],
    sections: [
      {
        heading: 'Suggested Top-Level Categories',
        bullets: [
          'Planning: architecture, decomposition, task planning.',
          'Implementation: coding standards, language-specific patterns.',
          'Quality: testing, review, reliability checks.',
          'Delivery: commits, changelog, release notes.'
        ],
        paragraphs: []
      },
      {
        heading: 'How to Apply the Taxonomy',
        paragraphs: [
          'Tag each skill with one category and one primary job-to-be-done. Avoid multi-category tagging unless absolutely necessary.',
          'Use this structure in repository naming, preset naming, and internal linking on educational pages.'
        ]
      }
    ],
    qa: [
      {
        question: 'Can small teams use this taxonomy?',
        answer:
          'Yes. Start with 3-4 categories and evolve only when your workflow complexity increases.'
      }
    ],
    whenToUse: [
      'Auditing an existing skill library.',
      'Designing new presets for repeated workflows.',
      'Creating category pages for SEO.'
    ]
  }
]

export const VERSUS_PAGES: MarketingContentPage[] = [
  {
    slug: 'manual-setup',
    title: 'Skilly vs Manual Setup: Which Workflow Scales Better?',
    description:
      'A practical comparison between Skilly and manual prompt/rules setup for multi-repo development.',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-04',
    keywords: ['skilly vs manual setup', 'manual prompt setup alternative'],
    tldr: [
      'Manual setup can work for one repo but scales poorly across many projects.',
      'Skilly trades slight upfront structure for long-term maintenance speed.',
      'The breakeven point appears when setup repetition becomes weekly.'
    ],
    sections: [
      {
        heading: 'Manual Setup Strengths and Limits',
        paragraphs: [
          'Manual files are flexible and cost nothing to start. This makes them attractive for early experimentation.',
          'As project count grows, duplicate files and inconsistent updates quickly become operational drag.'
        ]
      },
      {
        heading: 'Where Skilly Wins',
        bullets: [
          'Centralized discovery and installation workflow',
          'Reusable presets and global skills',
          'Clear visibility of active skills per project'
        ],
        paragraphs: [
          'Skilly is built for repeatability. It lowers the ongoing maintenance burden once you manage more than one active codebase.'
        ]
      }
    ],
    qa: [
      {
        question: 'Should I switch immediately from manual files?',
        answer:
          'Switch when repeated setup starts costing meaningful weekly time or creates review inconsistency.'
      }
    ],
    whenToUse: [
      'Evaluating whether to keep manual prompt management.',
      'Explaining workflow tradeoffs to teammates.',
      'Building a migration case from ad-hoc setup to structured management.'
    ]
  }
]

export const USE_CASE_PAGES: MarketingContentPage[] = [
  {
    slug: 'indie-dev-multi-repo',
    title: 'Use Case: Indie Developer Managing Multiple Repositories',
    description:
      'How an indie developer can standardize AI coding workflows across side projects.',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-04',
    keywords: ['indie developer ai workflow', 'multi repo ai setup'],
    tldr: [
      'Indie developers need speed without workflow chaos.',
      'A preset-first model removes repetitive setup from new projects.',
      'Weekly review keeps skill quality high with minimal overhead.'
    ],
    sections: [
      {
        heading: 'Scenario',
        paragraphs: [
          'You run several active repositories: SaaS app, landing page, automation scripts, and internal tools. Each needs similar coding standards but different domain context.'
        ]
      },
      {
        heading: 'Recommended Workflow',
        bullets: [
          'Create one baseline preset for code quality and commit style.',
          'Add per-repo override skills for product context.',
          'Run a Friday 20-minute cleanup for stale or duplicate skills.'
        ],
        paragraphs: []
      }
    ],
    qa: [
      {
        question: 'What is the minimum setup for this use case?',
        answer:
          'One global preset, one project-specific skill per repo, and a weekly maintenance routine.'
      }
    ],
    whenToUse: [
      'You are a solo builder shipping multiple projects.',
      'You want predictable AI output without enterprise complexity.'
    ]
  }
]

export const TEMPLATE_PAGES: MarketingContentPage[] = [
  {
    slug: 'weekly-skill-audit',
    title: 'Template: Weekly Skill Audit for Multi-Repo Teams',
    description:
      'A repeatable weekly template to keep AI coding skills clean, relevant, and high signal.',
    publishedAt: '2026-03-04',
    updatedAt: '2026-03-04',
    keywords: ['weekly skill audit template', 'ai skill maintenance checklist'],
    tldr: [
      'Use this template weekly to prevent skill sprawl.',
      'Audit by usage, overlap, and outcome impact.',
      'Archive aggressively to keep signal high.'
    ],
    sections: [
      {
        heading: 'Weekly Audit Checklist',
        bullets: [
          'List all active skills used this week.',
          'Mark overlapping skills and merge them.',
          'Archive skills with no recent usage.',
          'Verify one critical flow end-to-end.'
        ],
        paragraphs: []
      },
      {
        heading: 'Decision Rules',
        paragraphs: [
          'If a skill does not improve output quality in a real coding task, remove it.',
          'If two skills solve the same job, keep the clearer one and deprecate the other.'
        ]
      }
    ],
    qa: [
      {
        question: 'How long should this audit take?',
        answer:
          'Around 20-30 minutes weekly for most indie developer setups.'
      }
    ],
    whenToUse: [
      'You notice growing duplicate or stale skill files.',
      'Output quality starts drifting across repos.',
      'You are preparing to scale your content and SEO around skill workflows.'
    ]
  }
]

export function getPageBySlug(
  pages: MarketingContentPage[],
  slug: string
): MarketingContentPage | undefined {
  return pages.find((page) => page.slug === slug)
}
