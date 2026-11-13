import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { perfilDe, type Usuario } from "./perfil";

/**
 * Sessão do usuário (Supabase Auth via cookies).
 * Usa a chave PUBLICÁVEL: login e sessão. Os dados continuam acessados só pela chave secreta (lib/supabase.ts).
 */
export function authConfigurada(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

/** Cliente novo a cada requisição, como exige o @supabase/ssr. */
export async function clienteAuth() {
  const loja = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) loja.set(name, value, options);
        } catch {
          // Chamado durante a renderização: o proxy já cuida de renovar a sessão.
        }
      },
    },
  });
}

/** Usuário logado, ou null. Valida o token no Supabase (getUser), não só lê o cookie. */
export async function obterUsuario(): Promise<Usuario | null> {
  if (!authConfigurada()) return null;
  const supabase = await clienteAuth();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const u = data.user;
  const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : (u.email ?? "Usuário");
  return { id: u.id, nome, email: u.email ?? "", perfil: perfilDe(u.app_metadata) };
}
