const features = [
  {
    title: 'Skills Marketplace',
    description:
      'Browse 70,000+ community skills from skills.sh. Install any skill into any project with one click — no copy-pasting.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    title: 'Multi-AI Support',
    description:
      'Works with Claude, Cursor, Windsurf, Codex, and GitHub Copilot. Install the right skill format for each tool automatically.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Per-Project Management',
    description:
      'Different projects need different skills. See exactly which skills are active in each repo, add or remove them in seconds.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Skill Editor',
    description:
      'Edit any installed skill\'s markdown content right in the app. Customize community skills or write your own from scratch.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    title: 'Skill Presets',
    description:
      'Bundle your favourite skills into presets like "Full Stack Starter" or "Code Review Kit" and apply them to any project instantly.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Global Skills',
    description:
      'Some skills belong everywhere. Share them across all repos via a global skills directory — write once, use everywhere.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
]

export function Features() {
  return (
    <section id="features" className="border-t border-[#E5E7EB] bg-white py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl">Everything you need to manage AI skills</h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            Browse the marketplace, install with one click, edit and organise per project.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-6 transition hover:border-[#D1D5DB] hover:shadow-sm"
            >
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#0A0A0A]">
                {f.icon}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-[#0A0A0A]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[#6B7280]">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
