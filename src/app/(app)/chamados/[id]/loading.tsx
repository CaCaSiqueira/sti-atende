import { EsqueletoPagina } from "@/components/ui/Esqueleto";

// Limite de Suspense próprio: a navegação vinda de outra tela de chamados mostra o esqueleto na hora.
export default function Carregando() {
  return <EsqueletoPagina linhas={6} />;
}
