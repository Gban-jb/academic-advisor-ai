export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="mb-2 text-5xl font-bold text-maroon-800">404</p>
      <h1 className="mb-2 text-lg font-semibold text-slate-800">Page not found</h1>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-slate-500">
        That page doesn&apos;t exist. It may have moved, or the link might be out of date.
      </p>
      <a
        href="/"
        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
        style={{ background: "linear-gradient(135deg, #7B0D1E 0%, #5a0915 100%)" }}
      >
        Go home
      </a>
    </div>
  );
}
