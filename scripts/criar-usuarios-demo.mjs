// Cria (ou atualiza) as contas de demonstração no Supabase Auth.
// Uso: node --env-file=.env.local scripts/criar-usuarios-demo.mjs
// O perfil fica em app_metadata, que só a chave secreta altera.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SECRET_KEY;
if (!url || !chave) {
  console.error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY no .env.local");
  process.exit(1);
}

const SENHA = "Demo-STI-2026";
// Perfis: externo (fora da SEMA), servidor (usuário interno, servidor da SEMA) e sti (equipe da STI).
const CONTAS = [
  { email: "sti@example.com", nome: "Ana Souza (STI SEMA)", perfil: "sti" },
  { email: "interno@example.com", nome: "Beatriz Rocha (Servidora SEMA)", perfil: "servidor" },
  { email: "externo@example.com", nome: "Carlos Lima (Consultor Ambiental)", perfil: "externo" },
];

const admin = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: lista, error: erroLista } = await admin.auth.admin.listUsers({ perPage: 200 });
if (erroLista) throw erroLista;

for (const c of CONTAS) {
  const atributos = {
    password: SENHA,
    email_confirm: true,
    user_metadata: { nome: c.nome },
    app_metadata: { perfil: c.perfil },
  };
  const existente = lista.users.find((u) => u.email === c.email);
  const { error } = existente
    ? await admin.auth.admin.updateUserById(existente.id, atributos)
    : await admin.auth.admin.createUser({ email: c.email, ...atributos });
  if (error) throw error;
  console.log(`${existente ? "atualizado" : "criado"}: ${c.email} (${c.perfil})`);
}
