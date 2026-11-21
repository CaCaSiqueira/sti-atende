import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { MENSAGEM_BLOQUEADO, modoDoSistema } from "@/lib/ambiente";
import { ehPublica, exigeSti, perfilDe } from "@/lib/perfil";

/**
 * Proxy (antigo middleware): renova a sessão do Supabase e protege as rotas.
 * - Sem login -> /login (APIs respondem 401).
 * - Quem não é da STI em rota da STI -> /assistente (APIs respondem 403).
 * - Configuração do Supabase incompleta, ou ausente na Vercel -> nada abre (503), exceto /api/health.
 * Permissões por chamado (ver, anexar, mudar status) ficam nas rotas, em lib/permissoes.ts.
 */
export async function proxy(req: NextRequest) {
  const modo = modoDoSistema();
  if (modo === "bloqueado") return respostaBloqueada(req);
  // Modo demonstração (sem nenhuma chave, fora da Vercel): roda aberto com dados de exemplo em memória.
  if (modo === "demonstracao") return NextResponse.next();
  const url = process.env.SUPABASE_URL!;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY!;

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

/** Falha fechado: sem configuração completa, não roda sem login nem com dados que não são salvos. */
function respostaBloqueada(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // A Saúde do Sistema responde (com status "falha") para o monitoramento enxergar o problema.
  if (pathname === "/api/health") return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ erro: MENSAGEM_BLOQUEADO }, { status: 503 });
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>STI Atende indisponível</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1f2937;font-family:system-ui,sans-serif;padding:16px">
<main style="max-width:440px;background:#fff;border-radius:16px;padding:32px;color:#1f2937">
<h1 style="margin:0 0 8px;font-size:22px">STI Atende indisponível</h1>
<p style="margin:0 0 12px;line-height:1.5">${MENSAGEM_BLOQUEADO}</p>
<p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5">A equipe da STI já pode ver o problema em /api/health. Tente novamente mais tarde.</p>
</main></body></html>`;
  return new NextResponse(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

export const config = {
  // Tudo, menos arquivos estáticos e imagens.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
