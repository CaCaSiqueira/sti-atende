import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ehPublica, exigeSti, perfilDe } from "@/lib/perfil";

/**
 * Proxy (antigo middleware): renova a sessão do Supabase e protege as rotas.
 * - Sem login -> /login (APIs respondem 401).
 * - Quem não é da STI em rota da STI -> /assistente (APIs respondem 403).
 * Permissões por chamado (ver, anexar, mudar status) ficam nas rotas, em lib/permissoes.ts.
 */
export async function proxy(req: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY;
  // Sem Supabase configurado (desenvolvimento local), o app roda aberto com dados de exemplo.
  if (!url || !chave) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of lista) res.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const usuario = data.user;
  const { pathname } = req.nextUrl;
  const ehApi = pathname.startsWith("/api/");

  if (pathname === "/login" && usuario) {
    return NextResponse.redirect(new URL("/assistente", req.url));
  }
  if (ehPublica(pathname)) return res;

  if (!usuario) {
    if (ehApi) return NextResponse.json({ erro: "Faça login para continuar." }, { status: 401 });
    const destino = new URL("/login", req.url);
    destino.searchParams.set("voltar", pathname);
    return NextResponse.redirect(destino);
  }

  if (exigeSti(pathname) && perfilDe(usuario.app_metadata) !== "sti") {
    if (ehApi) return NextResponse.json({ erro: "Acesso restrito à equipe da STI." }, { status: 403 });
    return NextResponse.redirect(new URL("/assistente", req.url));
  }

  return res;
}

export const config = {
  // Tudo, menos arquivos estáticos e imagens.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
