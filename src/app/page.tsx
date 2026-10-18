export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            SARH Orders Console
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            High-scale operations console for order processing and duplicate prevention.
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">System Foundation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Database</span>
              <span className="font-medium text-slate-900">PostgreSQL (Local)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Seeded Dataset</span>
              <span className="font-medium text-emerald-600 font-mono">50,000 orders (150,000 items)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Linter</span>
              <span className="font-medium text-indigo-600 font-mono">Oxlint (Rust-based)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Styling</span>
              <span className="font-medium text-sky-600 font-mono">Tailwind CSS v4</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
