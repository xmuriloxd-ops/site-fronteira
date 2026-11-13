// Testa o login, as sessões e o limite de tentativas (../acesso.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { criarAcesso, ErroDeAcesso } from '../acesso.mjs';
import { ok, pastaTemporaria, resumo } from './apoio.mjs';

const MINUTO = 60_000;

async function recusa(promessa, status, trecho) {
  try {
    await promessa;
  } catch (erro) {
    assert.ok(erro instanceof ErroDeAcesso, String(erro));
    assert.equal(erro.status, status, erro.message);
    if (trecho) assert.ok(erro.message.includes(trecho), erro.message);
    return erro;
  }
  return assert.fail(`esperava a recusa ${status}`);
}

// ───── login inicial e sessões
{
  const pasta = pastaTemporaria();
  let t = 1_000_000;
  const a = await criarAcesso({ dirDados: pasta, agora: () => t });
  assert.deepEqual(a.info(), { usuario: 'adm', senhaInicial: true });
  assert.ok(!fs.existsSync(path.join(pasta, 'acesso.json')), 'nada é gravado enquanto ninguém troca a senha');
  await recusa(a.entrar('ip1', 'adm', 'errada'), 401, 'incorretos');
  await recusa(a.entrar('ip1', 'outro', '142536'), 401, 'incorretos');
  await recusa(a.entrar('ip1', '', '142536'), 400);
  await recusa(a.entrar('ip1', 'adm', ''), 400);
  await recusa(a.entrar('ip1', 5, '142536'), 400);
  const r = await a.entrar('ip1', ' ADM ', '142536');
  assert.match(r.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(r.usuario, 'adm');
  assert.equal(r.senhaInicial, true);
  assert.equal(a.validar(r.token), true);
  for (const falso of [`${r.token}x`, '', undefined, null, 42]) assert.equal(a.validar(falso), false);
  ok('login inicial adm / 142536 (o usuário não diferencia maiúsculas)');

  t += 11 * 60 * MINUTO;
  assert.equal(a.validar(r.token), true);
  t += 11 * 60 * MINUTO;
  assert.equal(a.validar(r.token), true, 'usar a sessão renova o prazo');
  t += 12 * 60 * MINUTO + 1;
  assert.equal(a.validar(r.token), false, '12 h parada');
  const r2 = await a.entrar('ip1', 'adm', '142536');
  for (let hora = 0; hora < 7 * 24 - 1; hora++) {
    t += 60 * MINUTO;
    assert.equal(a.validar(r2.token), true);
  }
  t += 61 * MINUTO;
  assert.equal(a.validar(r2.token), false, 'no máximo 7 dias');
  ok('a sessão termina com 12 h sem uso ou 7 dias depois do login');

  const r3 = await a.entrar('ip1', 'adm', '142536');
  a.sair(r3.token);
  assert.equal(a.validar(r3.token), false);
  ok('sair encerra a sessão');
}

// ───── limite de tentativas por endereço
{
  let t = 5_000_000;
  const a = await criarAcesso({ dirDados: pastaTemporaria(), agora: () => t });
  for (let i = 0; i < 5; i++) await recusa(a.entrar('ipA', 'adm', `x${i}`), 401);
  let e = await recusa(a.entrar('ipA', 'adm', '142536'), 429, '30 segundos');
  assert.equal(e.esperar, 30);
  assert.ok((await a.entrar('ipB', 'adm', '142536')).token, 'outro endereço não é afetado');
  t += 29_000;
  await recusa(a.entrar('ipA', 'adm', '142536'), 429, '1 segundo');
  t += 1_000;
  await recusa(a.entrar('ipA', 'adm', 'errada'), 401);
  e = await recusa(a.entrar('ipA', 'adm', '142536'), 429);
  assert.equal(e.esperar, 60);
  t += 60_000;
  await recusa(a.entrar('ipA', 'adm', 'errada'), 401);
  await recusa(a.entrar('ipA', 'adm', '142536'), 429, '2 minutos');
  for (let i = 0; i < 10; i++) {
    t += 16 * MINUTO;
    await recusa(a.entrar('ipA', 'adm', 'errada'), 401);
  }
  e = await recusa(a.entrar('ipA', 'adm', '142536'), 429, '15 minutos');
  assert.equal(e.esperar, 900);
  t += 15 * MINUTO;
  assert.ok((await a.entrar('ipA', 'adm', '142536')).token, 'depois da espera, a senha certa entra');
  for (let i = 0; i < 4; i++) await recusa(a.entrar('ipA', 'adm', 'x'), 401);
  assert.ok((await a.entrar('ipA', 'adm', '142536')).token, 'acertar zera a contagem');
  for (let i = 0; i < 4; i++) await recusa(a.entrar('ipA', 'adm', 'x'), 401);
  assert.ok((await a.entrar('ipA', 'adm', '142536')).token);
  ok('5 erros seguidos travam por 30 s; cada novo erro dobra a espera, até 15 min');

  t += 60 * MINUTO;
  const juntas = await Promise.allSettled(Array.from({ length: 40 }, (_, i) => a.entrar('ipC', 'adm', `p${i}`)));
  assert.equal(juntas.filter((x) => x.reason?.status === 401).length, 5);
  assert.equal(juntas.filter((x) => x.reason?.status === 429).length, 35);
  ok('40 tentativas ao mesmo tempo: só 5 chegam a ser conferidas');
}

// ───── limite geral
{
  let t = 9_000_000;
  const a = await criarAcesso({ dirDados: pastaTemporaria(), agora: () => t });
  let conferidas = 0;
  for (let i = 0; i < 80; i++) {
    try {
      await a.entrar(`ip${i}`, 'adm', 'x');
    } catch (erro) {
      if (erro.status === 401) conferidas += 1;
    }
    t += 1000;
  }
  assert.equal(conferidas, 60);
  await recusa(a.entrar('ipNovo', 'adm', '142536'), 429);
  t += 5 * MINUTO;
  assert.ok((await a.entrar('ipNovo', 'adm', '142536')).token);
  ok('60 erros em 15 min, vindos de qualquer lugar, travam o login de todos por 5 min');
}

// ───── troca de usuário e senha
{
  const pasta = pastaTemporaria();
  const arquivo = path.join(pasta, 'acesso.json');
  const a = await criarAcesso({ dirDados: pasta });
  const s1 = await a.entrar('ip', 'adm', '142536');
  const s2 = await a.entrar('ip2', 'adm', '142536');
  const trocar = (dados) => a.trocar({ endereco: 'ip', token: s1.token, ...dados });
  await recusa(trocar({ senhaAtual: 'errada', novaSenha: 'novasenha1' }), 403, 'não confere');
  await recusa(trocar({ senhaAtual: '142536', novaSenha: '12345' }), 400, 'pelo menos 6');
  await recusa(trocar({ senhaAtual: '142536' }), 400, 'Nada para trocar');
  await recusa(trocar({ senhaAtual: '142536', novoUsuario: 'adm' }), 400, 'Nada para trocar');
  await recusa(trocar({ senhaAtual: '142536', novoUsuario: 'a b' }), 400, 'usuário');
  await recusa(trocar({ senhaAtual: '142536', novoUsuario: 'ab' }), 400, 'usuário');
  await recusa(trocar({ senhaAtual: '142536', novoUsuario: 'joão' }), 400, 'usuário');
  await recusa(trocar({ senhaAtual: '142536', novoUsuario: 'chefao', novaSenha: 'Chefao' }), 400, 'igual ao usuário');
  await recusa(trocar({ senhaAtual: '142536', novoUsuario: '142536' }), 400, 'igual ao usuário');
  await recusa(trocar({ senhaAtual: '142536', novaSenha: ' espaco ' }), 400, 'espaço');
  await recusa(trocar({ senhaAtual: '', novaSenha: 'abcdef' }), 400, 'senha atual');
  await recusa(trocar({ senhaAtual: '142536', novaSenha: 123456 }), 400);
  assert.ok(!fs.existsSync(arquivo), 'pedido recusado não grava nada');
  assert.equal(a.validar(s2.token), true);

  let r = await trocar({ senhaAtual: '142536', novaSenha: 'Senha Nova 9' });
  assert.deepEqual(r, { usuario: 'adm', senhaInicial: false });
  assert.equal(a.validar(s1.token), true, 'a sessão de quem trocou continua');
  assert.equal(a.validar(s2.token), false, 'as outras sessões caem');
  await recusa(a.entrar('ip3', 'adm', '142536'), 401);
  assert.ok((await a.entrar('ip3', 'adm', 'Senha Nova 9')).token);
  const gravado = fs.readFileSync(arquivo, 'utf8');
  assert.ok(!gravado.includes('Senha Nova 9'), 'a senha não fica escrita no arquivo');
  assert.equal(JSON.parse(gravado).hash.length, 128);
  if (process.platform !== 'win32') assert.equal(fs.statSync(arquivo).mode & 0o777, 0o600);
  ok('trocar a senha: o arquivo guarda só o resultado do scrypt');

  r = await trocar({ senhaAtual: 'Senha Nova 9', novoUsuario: ' Chefe.RP ', novaSenha: 'outra-senha' });
  assert.equal(r.usuario, 'chefe.rp');
  await recusa(a.entrar('ip4', 'adm', 'outra-senha'), 401);
  assert.ok((await a.entrar('ip4', 'CHEFE.rp', 'outra-senha')).token);
  await trocar({ senhaAtual: 'outra-senha', novoUsuario: 'dono' });
  assert.ok((await a.entrar('ip5', 'dono', 'outra-senha')).token);
  ok('trocar usuário e senha juntos, ou só o usuário');

  const b = await criarAcesso({ dirDados: pasta });
  assert.deepEqual(b.info(), { usuario: 'dono', senhaInicial: false });
  await recusa(b.entrar('ip', 'adm', '142536'), 401);
  const sb = await b.entrar('ip', 'dono', 'outra-senha');
  assert.equal(b.validar(s1.token), false, 'as sessões não passam para o servidor reiniciado');
  ok('depois de reiniciar valem o usuário e a senha novos');

  r = await b.trocar({ endereco: 'ip', token: sb.token, senhaAtual: 'outra-senha', novaSenha: '142536' });
  assert.equal(r.senhaInicial, true, 'voltar para a senha inicial religa o aviso');

  fs.rmSync(arquivo);
  const c = await criarAcesso({ dirDados: pasta });
  assert.ok((await c.entrar('ip', 'adm', '142536')).token);
  ok('apagar dados/acesso.json devolve o acesso inicial');

  fs.writeFileSync(arquivo, '{"usuario":"x"');
  const avisos = [];
  const d = await criarAcesso({ dirDados: pasta, aviso: (m) => avisos.push(m) });
  assert.equal(d.disponivel, false);
  assert.equal(avisos.length, 1);
  await recusa(d.entrar('ip', 'adm', '142536'), 503);
  ok('arquivo de acesso ilegível desliga o login, em vez de reabrir com a senha inicial');

  const f = await criarAcesso({ dirDados: pastaTemporaria(), usuarioInicial: 'Root', senhaInicial: 'segredo-grande' });
  assert.deepEqual(f.info(), { usuario: 'root', senhaInicial: false });
  await recusa(f.entrar('ip', 'adm', '142536'), 401);
  assert.ok((await f.entrar('ip', 'root', 'segredo-grande')).token);
  ok('usuário e senha iniciais escolhidos por variável de ambiente');
}

resumo();
