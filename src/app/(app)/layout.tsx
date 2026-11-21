import { AppShell } from "@/components/layout/AppShell";
import { VERSAO } from "@/lib/versao";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return <AppShell versao={VERSAO}>{children}</AppShell>;
}
