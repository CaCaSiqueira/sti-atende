import { clienteAuth } from "@/lib/auth";

export async function POST() {
  const supabase = await clienteAuth();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
