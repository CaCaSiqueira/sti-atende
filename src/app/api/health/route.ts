import { gerarRelatorioSaude } from "@/lib/health";

// Route Handlers não são cacheados por padrão no Next.js 16: cada chamada mede o estado atual.
// Também é chamada todo dia pelo cron da Vercel (vercel.json): a consulta real ao banco conta como uso
// e impede que o Supabase pause o projeto por inatividade no plano gratuito.
export async function GET() {
  const relatorio = await gerarRelatorioSaude();
  return Response.json(relatorio, {
    status: relatorio.status === "falha" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
