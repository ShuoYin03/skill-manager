const SKILLS = [
  { name: 'commit-msg', desc: 'Write conventional commits automatically', tag: 'git', installed: true },
  { name: 'code-review', desc: 'Deep PR review with actionable feedback', tag: 'review', installed: true },
  { name: 'cursor-rules', desc: 'Best-practice rules for Cursor AI', tag: 'cursor', installed: false },
  { name: 'debug-expert', desc: 'Root cause analysis for any error', tag: 'debugging', installed: false },
  { name: 'test-writer', desc: 'Generate comprehensive test suites', tag: 'testing', installed: false },
  { name: 'ui-ux-pro', desc: 'Professional UI/UX design guidance', tag: 'design', installed: false },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 bg-[#FAFAFA]">
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-1.5 text-sm text-[#6B7280]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0A0A0A]" />
          Skills management — instructions &amp; agents coming soon
        </div>

        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-[#0A0A0A] sm:text-6xl">
          Your AI skills,{' '}
          <span className="underline decoration-[#0A0A0A] decoration-2 underline-offset-4">
            under control
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#6B7280] leading-relaxed">
          Skilly is a desktop app for browsing, installing, and managing AI coding skills
          across all your projects. Works with Claude, Cursor, Windsurf, and more — one
          place for all your AI tooling.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#download"
            className="rounded-lg bg-[#0A0A0A] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#333]"
          >
            Download Free
          </a>
          <a
            href="#features"
            className="rounded-lg border border-[#E5E7EB] bg-white px-8 py-3 text-base font-semibold text-[#0A0A0A] transition hover:bg-[#F3F4F6]"
          >
            See features
          </a>
        </div>

        {/* App mockup — skills marketplace view */}
        <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xl shadow-black/5">
          {/* Title bar */}
          <div className="flex items-center border-b border-[#E5E7EB] px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#FF5F57]" />
              <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
              <div className="h-3 w-3 rounded-full bg-[#28CA41]" />
            </div>
            <span className="ml-3 text-xs font-medium text-[#6B7280]">Skilly — Skills Marketplace</span>
          </div>

          {/* App layout: sidebar + content */}
          <div className="flex">
            {/* Left sidebar */}
            <div className="flex w-12 flex-col items-center gap-4 border-r border-[#E5E7EB] bg-[#FAFAFA] py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A0A0A]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 0-14.14 0" /><path d="M4.93 19.07a10 10 0 0 0 14.14 0" /></svg>
              </div>
            </div>

            {/* Marketplace content */}
            <div className="flex-1 bg-[#FAFAFA] p-3">
              {/* Search + filter row */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9CA3AF]"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  <span className="text-[11px] text-[#9CA3AF]">Search 70,000+ skills...</span>
                </div>
                <div className="flex gap-1.5">
                  {['git', 'testing', 'review'].map(tag => (
                    <span key={tag} className="rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[10px] text-[#6B7280]">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Skill cards grid */}
              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map((skill) => (
                  <div key={skill.name} className="flex flex-col justify-between rounded-lg border border-[#E5E7EB] bg-white p-2.5">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[11px] font-semibold text-[#0A0A0A]">{skill.name}</span>
                        {skill.installed && (
                          <span className="shrink-0 rounded-full bg-[#F3F4F6] px-1.5 py-0.5 text-[9px] font-medium text-[#6B7280]">installed</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] leading-snug text-[#9CA3AF]">{skill.desc}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full border border-[#E5E7EB] px-1.5 py-0.5 text-[9px] text-[#9CA3AF]">{skill.tag}</span>
                      {skill.installed
                        ? <span className="text-[10px] text-[#6B7280]">✓ In project</span>
                        : <div className="rounded-md bg-[#0A0A0A] px-2 py-0.5 text-[10px] font-medium text-white">Install</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
