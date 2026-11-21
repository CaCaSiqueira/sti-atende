import pacote from "../../package.json";

/**
 * Versão do STI Atende no formato SemVer (MAIOR.MENOR.CORREÇÃO).
 * Fonte única: o campo "version" do package.json, embutido no build.
 * Para lançar uma versão nova, use `npm run lancar -- patch|minor|major` (veja o README).
 */
export const VERSAO: string = pacote.version;
