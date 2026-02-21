export function Download() {
  return (
    <section id="download" className="py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Download Repo Launcher</h2>
        <p className="mt-4 text-lg text-gray-400">
          Available for macOS, Windows, and Linux. Free 7-day trial.
        </p>

        <div className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
          {[
            {
              platform: 'macOS',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              ),
              label: 'Download for macOS',
              href: '/api/download?platform=mac',
            },
            {
              platform: 'Windows',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
                </svg>
              ),
              label: 'Download for Windows',
              href: '/api/download?platform=win',
            },
            {
              platform: 'Linux',
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.868.07 1.723-.26 2.456-.594.733-.34 1.455-.637 2.114-.737.659-.122 1.226-.015 1.753.467.127.134.248.403.376.403.136 0 .267-.134.403-.268.263-.268.33-.535.063-.936-.267-.4-.803-.534-1.136-.736-.333-.199-.47-.6-.866-.936a2.726 2.726 0 01-.468-.602c-.401-.266-.535-.936-1.135-1.602-.268-.268-.535-.737-.668-1.07-.134-.334-.2-.665-.067-.932.133-.268.465-.4.733-.601.268-.2.534-.399.7-.663.167-.268.2-.534.266-.87a4.1 4.1 0 00.066-.601c0-.602-.2-1.203-.534-1.67-.334-.466-.802-.868-1.337-1.07-.534-.2-1.135-.266-1.669-.133a.55.55 0 01.003-.064c.283-2.403-1.326-4.797-3.736-5.267A3.618 3.618 0 0012.504 0z" />
                </svg>
              ),
              label: 'Download for Linux',
              href: '/api/download?platform=linux',
            },
          ].map((item) => (
            <a
              key={item.platform}
              href={item.href}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-gray-900/50 p-6 transition hover:border-white/20 hover:bg-gray-900"
            >
              <div className="text-gray-400 transition group-hover:text-white">{item.icon}</div>
              <div className="text-sm font-medium">{item.label}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
