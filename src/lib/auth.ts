import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { PERFIS, ehPerfil, perfilDe, type Usuario } from "./perfil";

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

/**
 * Só no desenvolvimento sem Supabase: PERFIL_LOCAL=externo|servidor|sti simula um usuário logado
 * para testar as telas de cada perfil. Com o login configurado, a variável é ignorada.
 */
function usuarioLocal(): Usuario | null {
  const perfil = process.env.PERFIL_LOCAL;
  if (!ehPerfil(perfil)) return null;
  return { id: `local-${perfil}`, nome: `Teste local (${PERFIS[perfil].rotulo})`, email: "", perfil };
}

/**
 * Para rotas de API: o usuário logado, ou uma resposta 401 quando o login está configurado e não há sessão.
 * O proxy já barra quem não está logado; esta checagem é a segunda camada.
 * `usuario: null` só acontece sem login configurado (desenvolvimento local).
 */
export async function sessaoDaApi(): Promise<{ usuario: Usuario | null } | { negado: Response }> {
  const usuario = await obterUsuario();
  if (authConfigurada() && !usuario) {
    return { negado: Response.json({ erro: "Faça login para continuar." }, { status: 401 }) };
  }
  return { usuario };
}

/** Usuário logado, ou null. Valida o token no Supabase (getUser), não só lê o cookie. */
export async function obterUsuario(): Promise<Usuario | null> {
  if (!authConfigurada()) return usuarioLocal();
  const supabase = await clienteAuth();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const u = data.user;
  const nome = typeof u.user_metadata?.nome === "string" ? u.user_metadata.nome : (u.email ?? "Usuário");
  return { id: u.id, nome, email: u.email ?? "", perfil: perfilDe(u.app_metadata) };
}
