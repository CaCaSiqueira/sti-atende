import { AppShell } from "@/components/layout/AppShell";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
