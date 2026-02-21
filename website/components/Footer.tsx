export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto max-w-5xl px-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Repo Launcher. All rights reserved.
      </div>
    </footer>
  )
}
