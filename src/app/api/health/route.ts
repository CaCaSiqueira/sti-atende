import { gerarRelatorioSaude } from "@/lib/health";

// Route Handlers não são cacheados por padrão no Next.js 16: cada chamada mede o estado atual.
export async function GET() {
  const relatorio = await gerarRelatorioSaude();
  return Response.json(relatorio, {
    status: relatorio.status === "falha" ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
