import { AppShell } from "@/components/layout/AppShell";
import { modoDoSistema } from "@/lib/ambiente";
import { VERSAO } from "@/lib/versao";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <AppShell versao={VERSAO} demonstracao={modoDoSistema() === "demonstracao"}>
      {children}
    </AppShell>
  );
}
