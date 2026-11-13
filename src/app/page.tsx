// Página provisória da Sprint 1. Na Sprint 2 ela vira o layout com Sidebar + Assistente IA do protótipo.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-brand-light p-4">
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">SEMA-MT</p>
        <h1 className="mt-1 text-2xl font-bold text-brand-dark sm:text-3xl">STI Atende</h1>
        <p className="mt-3 text-gray-600">
          Base do sistema pronta (Sprint 1). As telas do protótipo chegam na Sprint 2.
        </p>
        <a
          href="/api/health"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand-primary px-4 py-3 font-medium text-white transition hover:bg-brand-accent sm:w-auto"
        >
          Ver saúde do sistema (JSON)
        </a>
      </section>
    </main>
  );
}
