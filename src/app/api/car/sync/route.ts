import { type NextRequest, NextResponse } from "next/server";
import { ipDaRequisicao, permitir } from "@/lib/limite";
import { tentarSincronizarCar } from "@/lib/sync-car";

const COOKIE = "sti_cliente";
const UM_ANO_S = 60 * 60 * 24 * 365;

/**
 * Sincronização do CAR com a regra de 24h aplicada no servidor.
 * Até o login (Sprint 4), o solicitante é identificado por um cookie anônimo e httpOnly.
 */
export async function POST(req: NextRequest) {
  if (!permitir(`car:${ipDaRequisicao(req)}`, 10, 60_000)) {
    return NextResponse.json({ erro: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  }

  const existente = req.cookies.get(COOKIE)?.value;
  const clienteId = existente && /^[0-9a-f-]{36}$/.test(existente) ? existente : crypto.randomUUID();

  try {
    const r = await tentarSincronizarCar(clienteId);
    const res = r.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ ok: false, liberaEm: new Date(r.liberaEm).toISOString() }, { status: 429 });
    if (clienteId !== existente) {
      res.cookies.set(COOKIE, clienteId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: UM_ANO_S, path: "/" });
    }
    return res;
  } catch (e) {
    console.error("[api/car/sync]", e);
    return NextResponse.json({ erro: "Não foi possível sincronizar agora." }, { status: 500 });
  }
}
