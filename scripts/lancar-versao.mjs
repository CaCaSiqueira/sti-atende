// Lança uma versão nova do STI Atende.
// Uso: npm run lancar -- patch|minor|major
//
// 1. Calcula a próxima versão a partir do package.json (SemVer).
// 2. Transforma a seção "Não publicado" do CHANGELOG.md na nova versão, com a data de hoje (fuso de Cuiabá).
// 3. Atualiza package.json e package-lock.json.
// 4. Faz o commit "chore(release): vX.Y.Z" e cria a tag vX.Y.Z.
// Depois é só rodar `git push --follow-tags`; o GitHub cria a release com as notas do CHANGELOG.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const TIPOS = ["patch", "minor", "major"];
const SECAO = "## [Não publicado]";

function sair(mensagem) {
  console.error(`\n✖ ${mensagem}\n`);
  process.exit(1);
}
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const lerJson = (arquivo) => JSON.parse(readFileSync(arquivo, "utf8"));
const gravarJson = (arquivo, dados) => writeFileSync(arquivo, `${JSON.stringify(dados, null, 2)}\n`);

const tipo = process.argv[2];
if (!TIPOS.includes(tipo)) sair(`Informe o tipo da versão: npm run lancar -- ${TIPOS.join("|")}`);
if (git("status", "--porcelain")) sair("Há alterações sem commit. Faça o commit (ou descarte) antes de lançar uma versão.");

const pacote = lerJson("package.json");
if (!/^\d+\.\d+\.\d+$/.test(pacote.version)) sair(`Versão atual fora do padrão MAIOR.MENOR.CORREÇÃO: ${pacote.version}`);
const [maior, menor, correcao] = pacote.version.split(".").map(Number);
const nova = { major: `${maior + 1}.0.0`, minor: `${maior}.${menor + 1}.0`, patch: `${maior}.${menor}.${correcao + 1}` }[tipo];
const tag = `v${nova}`;
if (git("tag", "--list", tag)) sair(`A tag ${tag} já existe.`);

const changelog = readFileSync("CHANGELOG.md", "utf8");
const inicio = changelog.indexOf(SECAO);
if (inicio === -1) sair(`O CHANGELOG.md não tem a seção "${SECAO}".`);
const fimTitulo = inicio + SECAO.length;
const proxima = changelog.indexOf("\n## [", fimTitulo);
const notas = changelog.slice(fimTitulo, proxima === -1 ? undefined : proxima).trim();
if (!notas) sair(`A seção "${SECAO}" do CHANGELOG.md está vazia. Descreva o que muda nesta versão antes de lançar.`);

const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Cuiaba" }); // AAAA-MM-DD
writeFileSync("CHANGELOG.md", `${changelog.slice(0, fimTitulo)}\n\n## [${nova}] - ${hoje}\n\n${changelog.slice(fimTitulo).trimStart()}`);

pacote.version = nova;
gravarJson("package.json", pacote);
const trava = lerJson("package-lock.json");
trava.version = nova;
trava.packages[""].version = nova;
gravarJson("package-lock.json", trava);

git("add", "CHANGELOG.md", "package.json", "package-lock.json");
git("commit", "-m", `chore(release): ${tag}`);
git("tag", "-a", tag, "-m", tag);

console.log(`\n✔ Versão ${tag} criada (commit e tag locais).\n\nNotas:\n${notas}\n\nPara publicar: git push --follow-tags\n`);
