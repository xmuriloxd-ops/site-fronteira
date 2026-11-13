/**
 * Acesso ao painel: usuário e senha do administrador, sessões abertas e
 * limite de tentativas de login.
 *
 * A senha nunca é gravada: o arquivo dados/acesso.json guarda só o resultado
 * do scrypt (com sal). Enquanto esse arquivo não existe, valem o usuário e a
 * senha iniciais abaixo; ele é criado quando o administrador troca os dados
 * pelo painel. Apagar o arquivo volta o acesso ao inicial.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const USUARIO_INICIAL = 'adm';
export const SENHA_INICIAL = '142536';

const SCRYPT = { N: 16384, r: 8, p: 1, tamanho: 64 };
const MINUTO = 60 * 1000;
const SESSAO_SEM_USO = 12 * 60 * MINUTO;
const SESSAO_MAXIMA = 7 * 24 * 60 * MINUTO;
const MAX_SESSOES = 30;

// Limite de tentativas. Por endereço: 5 erros seguidos travam por 30 s, e cada
// erro seguinte dobra a espera, até 15 min. No total: 60 erros em 15 min travam
// o login de todos por 5 min (segura quem tenta de muitos endereços).
const ERROS_LIVRES = 5;
const ESPERA_INICIAL = 30 * 1000;
const ESPERA_MAXIMA = 15 * MINUTO;
const ESQUECER_APOS = 30 * MINUTO;
const JANELA_GERAL = 15 * MINUTO;
const ERROS_GERAIS = 60;
const ESPERA_GERAL = 5 * MINUTO;

/** Erro com mensagem para o painel e status HTTP. */
export class ErroDeAcesso extends Error {
  constructor(mensagem, status = 400, extra = {}) {
    super(mensagem);
    this.status = status;
    Object.assign(this, extra);
  }
}

const normalizarUsuario = (u) => String(u ?? '').normalize('NFKC').trim().toLowerCase();
const normalizarSenha = (s) => String(s ?? '').normalize('NFKC');
const resumo = (texto) => crypto.createHash('sha256').update(texto).digest();

function derivar(senha, sal, p = SCRYPT) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(normalizarSenha(senha), sal, p.tamanho, { N: p.N, r: p.r, p: p.p, maxmem: 128 * 1024 * 1024 }, (erro, chave) =>
      erro ? reject(erro) : resolve(chave),
    );
  });
}

function descreverEspera(ms) {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s} segundo${s === 1 ? '' : 's'}`;
  const m = Math.ceil(s / 60);
  return `${m} minuto${m === 1 ? '' : 's'}`;
}

export async function criarAcesso({ dirDados, usuarioInicial = USUARIO_INICIAL, senhaInicial = SENHA_INICIAL, aviso = () => {}, agora = () => Date.now() }) {
  const arquivo = path.join(dirDados, 'acesso.json');
  /** { usuario, sal: Buffer, hash: Buffer, scrypt, senhaInicial: boolean } ou null se o arquivo estiver ilegível. */
  let credencial = null;
  /** resumo do token (hex) -> { criadaEm, usadaEm } */
  const sessoes = new Map();
  /** endereço -> { erros, ultimo, liberaEm } */
  const porEndereco = new Map();
  let errosRecentes = [];
  let geralLiberaEm = 0;

  // ── credencial ──
  async function carregar() {
    let texto = null;
    try {
      texto = fs.readFileSync(arquivo, 'utf8');
    } catch (erro) {
      if (erro.code !== 'ENOENT') {
        aviso(`Não consegui ler ${arquivo} (${erro.message}). O login no painel fica desligado até isso ser resolvido.`);
        credencial = null;
        return;
      }
    }
    if (texto == null) {
      const sal = crypto.randomBytes(16);
      credencial = {
        usuario: normalizarUsuario(usuarioInicial),
        sal,
        hash: await derivar(senhaInicial, sal),
        scrypt: SCRYPT,
        senhaInicial: normalizarSenha(senhaInicial) === SENHA_INICIAL,
      };
      return;
    }
    try {
      const j = JSON.parse(texto);
      const p = j.scrypt;
      const sal = Buffer.from(String(j.sal), 'hex');
      const hash = Buffer.from(String(j.hash), 'hex');
      const inteiros = p && [p.N, p.r, p.p, p.tamanho].every((n) => Number.isInteger(n) && n > 0);
      if (typeof j.usuario !== 'string' || !j.usuario || sal.length < 8 || !inteiros || hash.length !== p.tamanho) throw new Error('conteúdo inesperado');
      credencial = { usuario: normalizarUsuario(j.usuario), sal, hash, scrypt: { N: p.N, r: p.r, p: p.p, tamanho: p.tamanho }, senhaInicial: j.senhaInicial === true };
    } catch (erro) {
      // Não cai para a senha inicial sozinho: isso reabriria o painel com uma senha conhecida.
      credencial = null;
      aviso(`O arquivo ${arquivo} está ilegível (${erro.message}). O login no painel fica desligado. Para voltar ao usuário e à senha iniciais, apague esse arquivo e reinicie o servidor.`);
    }
  }

  async function conferir(usuario, senha) {
    if (!credencial) return false;
    const nomeCerto = crypto.timingSafeEqual(resumo(normalizarUsuario(usuario)), resumo(credencial.usuario));
    // A senha é sempre calculada, mesmo com o usuário errado: o tempo de resposta não entrega qual dos dois errou.
    const chave = await derivar(senha, credencial.sal, credencial.scrypt);
    const senhaCerta = chave.length === credencial.hash.length && crypto.timingSafeEqual(chave, credencial.hash);
    return nomeCerto && senhaCerta;
  }

  // ── limite de tentativas ──
  function esperaDe(endereco) {
    const t = agora();
    const reg = porEndereco.get(endereco);
    return Math.max(0, (reg?.liberaEm || 0) - t, geralLiberaEm - t);
  }

  function contarErro(endereco) {
    const t = agora();
    for (const [chave, reg] of porEndereco) if (t - reg.ultimo > ESQUECER_APOS) porEndereco.delete(chave);
    const reg = porEndereco.get(endereco) || { erros: 0, ultimo: t, liberaEm: 0 };
    reg.erros += 1;
    reg.ultimo = t;
    if (reg.erros >= ERROS_LIVRES) reg.liberaEm = t + Math.min(ESPERA_MAXIMA, ESPERA_INICIAL * 2 ** Math.min(20, reg.erros - ERROS_LIVRES));
    porEndereco.set(endereco, reg);
    errosRecentes = errosRecentes.filter((quando) => t - quando < JANELA_GERAL);
    errosRecentes.push(t);
    if (errosRecentes.length >= ERROS_GERAIS) geralLiberaEm = t + ESPERA_GERAL;
  }

  function descontarErro(endereco) {
    porEndereco.delete(endereco);
    errosRecentes.pop();
  }

  /** Confere usuário e senha respeitando o limite de tentativas. */
  async function tentar(endereco, usuario, senha) {
    const espera = esperaDe(endereco);
    if (espera > 0) {
      throw new ErroDeAcesso(`Muitas tentativas seguidas. Espere ${descreverEspera(espera)} e tente de novo.`, 429, { esperar: Math.ceil(espera / 1000) });
    }
    // Conta antes de conferir: vários pedidos ao mesmo tempo não escapam do limite.
    contarErro(endereco);
    const certo = await conferir(usuario, senha);
    if (certo) descontarErro(endereco);
    return certo;
  }

  // ── sessões ──
  function limparSessoes() {
    const t = agora();
    for (const [chave, s] of sessoes) if (t - s.usadaEm > SESSAO_SEM_USO || t - s.criadaEm > SESSAO_MAXIMA) sessoes.delete(chave);
  }

  function abrirSessao() {
    limparSessoes();
    while (sessoes.size >= MAX_SESSOES) sessoes.delete(sessoes.keys().next().value);
    const token = crypto.randomBytes(32).toString('base64url');
    const t = agora();
    sessoes.set(resumo(token).toString('hex'), { criadaEm: t, usadaEm: t });
    return token;
  }

  /** true se o token é de uma sessão aberta (e renova o prazo dela). */
  function validar(token) {
    if (typeof token !== 'string' || !token) return false;
    limparSessoes();
    const s = sessoes.get(resumo(token).toString('hex'));
    if (!s) return false;
    s.usadaEm = agora();
    return true;
  }

  function sair(token) {
    if (typeof token === 'string' && token) sessoes.delete(resumo(token).toString('hex'));
  }

  // ── operações do painel ──
  async function entrar(endereco, usuario, senha) {
    if (typeof usuario !== 'string' || typeof senha !== 'string' || !usuario.trim() || !senha || usuario.length > 200 || senha.length > 1000) {
      throw new ErroDeAcesso('Informe o usuário e a senha.', 400);
    }
    if (!credencial) throw new ErroDeAcesso('O login está desligado: o arquivo de acesso do servidor está ilegível.', 503);
    if (!(await tentar(endereco, usuario, senha))) throw new ErroDeAcesso('Usuário ou senha incorretos.', 401);
    return { token: abrirSessao(), ...info() };
  }

  function validarUsuario(usuario) {
    if (!/^[a-z0-9][a-z0-9._@-]{2,31}$/.test(usuario)) {
      throw new ErroDeAcesso('O usuário precisa ter de 3 a 32 caracteres: letras sem acento, números, ponto, traço ou _ (sem espaços).');
    }
  }

  function validarSenha(senha) {
    if (senha.length < 6) throw new ErroDeAcesso('A nova senha precisa ter pelo menos 6 caracteres.');
    if (senha.length > 128) throw new ErroDeAcesso('A nova senha pode ter no máximo 128 caracteres.');
    if (senha.trim() !== senha) throw new ErroDeAcesso('A nova senha não pode começar nem terminar com espaço.');
  }

  /** Troca usuário e/ou senha. Exige a senha atual e encerra as outras sessões. */
  async function trocar({ endereco, token, senhaAtual, novoUsuario, novaSenha }) {
    if (!credencial) throw new ErroDeAcesso('O arquivo de acesso do servidor está ilegível.', 503);
    if (typeof senhaAtual !== 'string' || !senhaAtual || senhaAtual.length > 1000) throw new ErroDeAcesso('Informe a senha atual.');
    const usuario = novoUsuario === undefined || novoUsuario === null || novoUsuario === '' ? credencial.usuario : normalizarUsuario(novoUsuario);
    const mudaSenha = typeof novaSenha === 'string' && novaSenha !== '';
    if (novaSenha !== undefined && novaSenha !== null && typeof novaSenha !== 'string') throw new ErroDeAcesso('Nova senha inválida.');
    if (!mudaSenha && usuario === credencial.usuario) throw new ErroDeAcesso('Nada para trocar: informe um novo usuário ou uma nova senha.');
    const senha = normalizarSenha(mudaSenha ? novaSenha : senhaAtual);
    validarUsuario(usuario);
    if (mudaSenha) validarSenha(senha);
    if (senha.toLowerCase() === usuario) throw new ErroDeAcesso('A senha não pode ser igual ao usuário.');
    if (!(await tentar(endereco, credencial.usuario, senhaAtual))) throw new ErroDeAcesso('A senha atual não confere.', 403);

    const sal = crypto.randomBytes(16);
    const nova = { usuario, sal, hash: await derivar(senha, sal), scrypt: SCRYPT, senhaInicial: senha === SENHA_INICIAL };
    const json = JSON.stringify(
      { formato: 1, usuario: nova.usuario, sal: sal.toString('hex'), hash: nova.hash.toString('hex'), scrypt: SCRYPT, senhaInicial: nova.senhaInicial, alteradoEm: new Date().toISOString() },
      null,
      2,
    );
    const temporario = `${arquivo}.${process.pid}.tmp`;
    try {
      fs.mkdirSync(dirDados, { recursive: true });
      fs.writeFileSync(temporario, json, { mode: 0o600 });
      fs.renameSync(temporario, arquivo);
    } catch (erro) {
      fs.rmSync(temporario, { force: true });
      throw new ErroDeAcesso(`Não consegui gravar o novo acesso no disco (${erro.code || erro.message}). Nada foi alterado.`, 500);
    }
    credencial = nova;
    // Quem estava logado em outro aparelho precisa entrar de novo com os dados novos.
    const manter = typeof token === 'string' && token ? resumo(token).toString('hex') : null;
    for (const chave of [...sessoes.keys()]) if (chave !== manter) sessoes.delete(chave);
    return info();
  }

  function info() {
    return { usuario: credencial?.usuario || '', senhaInicial: !!credencial?.senhaInicial };
  }

  await carregar();
  return { entrar, validar, sair, trocar, info, get arquivo() { return arquivo; }, get disponivel() { return !!credencial; } };
}
