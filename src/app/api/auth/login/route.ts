import { z } from "zod";
import { clienteAuth } from "@/lib/auth";
import { ipDaRequisicao, permitir } from "@/lib/limite";

const Entrada = z.object({ email: z.string().trim().email().max(200), senha: z.string().min(6).max(200) });

export async function POST(req: Request) {
  // Freia tentativas de adivinhar senha.
  if (!(await permitir(`login:${ipDaRequisicao(req)}`, 10, 60_000))) {
    return Response.json({ erro: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  }
  const entrada = Entrada.safeParse(await req.json().catch(() => null));
  if (!entrada.success) return Response.json({ erro: "Informe e-mail e senha válidos." }, { status: 400 });

  const supabase = await clienteAuth();
  const { error } = await supabase.auth.signInWithPassword({ email: entrada.data.email, password: entrada.data.senha });
  // Mensagem genérica: não revela se o e-mail existe.
  if (error) return Response.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
  return Response.json({ ok: true });
}
