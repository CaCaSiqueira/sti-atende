import { ListChecks } from "lucide-react";
import { SPRINTS, type StatusSprint } from "@/lib/sprints";

const MARCADOR: Record<StatusSprint, string> = {
  concluida: "bg-green-500",
  em_andamento: "bg-blue-500",
  pendente: "bg-gray-300",
};
const ROTULO: Record<StatusSprint, { texto: string; classe: string }> = {
  concluida: { texto: "Concluída", classe: "bg-green-100 text-green-800" },
  em_andamento: { texto: "Em andamento", classe: "bg-blue-100 text-blue-800" },
  pendente: { texto: "Pendente", classe: "bg-gray-100 text-gray-600" },
};

export function PlanoEntrega() {
  const concluidas = SPRINTS.filter((s) => s.status === "concluida").length;
  const progresso = Math.round((concluidas / SPRINTS.length) * 100);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="titulo-plano">
      <h2 id="titulo-plano" className="mb-2 flex items-center gap-2 text-xl font-bold text-gray-800">
        <ListChecks className="size-6 text-brand-primary" aria-hidden /> Plano de Entrega (Sprints)
      </h2>
      <p className="mb-1 text-sm text-gray-500">
        {concluidas} de {SPRINTS.length} sprints concluídas
      </p>
      <div className="mb-6 h-2 w-full rounded-full bg-gray-200" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do plano">
        <div className="h-2 rounded-full bg-green-500" style={{ width: `${progresso}%` }} />
      </div>

      <ol className="relative ml-3 space-y-6 border-l-2 border-brand-primary">
        {SPRINTS.map((s) => (
          <li key={s.numero} className="relative pl-6">
            <span className={`absolute -left-[9px] top-1 size-4 rounded-full border-2 border-white ${MARCADOR[s.status]}`} aria-hidden />
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-gray-800">
                Sprint {s.numero}: {s.titulo}
              </h3>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${ROTULO[s.status].classe}`}>{ROTULO[s.status].texto}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{s.entrega}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
