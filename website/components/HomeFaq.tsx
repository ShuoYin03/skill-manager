export const HOME_FAQ_ITEMS = [
  {
    question: 'What is Skilly?',
    answer:
      'Skilly is a desktop app that helps developers discover, install, and manage AI coding skills across projects and tools.'
  },
  {
    question: 'Which AI tools does Skilly support?',
    answer:
      'Skilly supports Claude, Cursor, Windsurf, Codex, and GitHub Copilot workflows with repo-aware skill management.'
  },
  {
    question: 'How does pricing work?',
    answer:
      'Skilly uses one-time pricing: $5 lifetime license with a 7-day free trial and free updates.'
  },
  {
    question: 'When should I use Skilly instead of manual setup?',
    answer:
      'Use Skilly when you work across multiple repositories or AI tools and want a consistent, reusable setup without repetitive copy/paste.'
  }
]

export function HomeFaq() {
  return (
    <section className="border-t border-[#E5E7EB] bg-[#FAFAFA] py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#0A0A0A] sm:text-4xl">
            FAQ
          </h2>
          <p className="mt-4 text-lg text-[#6B7280]">
            Answers for developers evaluating Skilly for daily workflow use.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {HOME_FAQ_ITEMS.map((item) => (
            <article
              key={item.question}
              className="rounded-xl border border-[#E5E7EB] bg-white p-6"
            >
              <h3 className="text-base font-semibold text-[#0A0A0A]">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{item.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
