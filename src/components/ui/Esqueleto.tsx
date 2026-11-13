/** Placeholders exibidos enquanto os dados do banco chegam (navegação instantânea). */
export function EsqueletoPagina({ cartoes = 0, linhas = 4 }: { cartoes?: number; linhas?: number }) {
  return (
    <div className="animate-pulse p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Carregando">
      <div className="mb-2 h-8 w-64 rounded bg-gray-200" />
      <div className="mb-6 h-4 w-80 max-w-full rounded bg-gray-200" />
      {cartoes > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {Array.from({ length: cartoes }, (_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200" />
          ))}
        </div>
      )}
      <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 sm:p-6">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="h-5 rounded bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
