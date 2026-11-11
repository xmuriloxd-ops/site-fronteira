import { useEffect, useState } from 'react';
import { Check, CircleHelp, Copy, Link2, Radio, Send, ShieldCheck, Terminal, X } from 'lucide-react';
import type { ConfigDiscord, EnvioDiscord } from '../types';
import { dataHoraBR, limitar } from '../lib/format';
import { webhookValido } from '../lib/discord';
import { Botao, Campo, Cartao, Entrada, Etiqueta, SecaoTitulo, Selecao, Vazio } from './ui';

interface Props {
  config: ConfigDiscord;
  envios: EnvioDiscord[];
  pendentes: number;
  testando: boolean;
  onSalvar: (cfg: ConfigDiscord) => void;
  onTestar: (cfg: ConfigDiscord) => void;
  onEnviarPendentes: () => void;
}

function Interruptor({
  ligado,
  onChange,
  titulo,
  descricao,
}: {
  ligado: boolean;
  onChange: (v: boolean) => void;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="interruptor">
      <div>
        <strong>{titulo}</strong>
        <span>{descricao}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label={titulo}
        className={`interruptor__pista ${ligado ? 'interruptor__pista--ligada' : ''}`}
        onClick={() => onChange(!ligado)}
      >
        <span />
      </button>
    </div>
  );
}

const ROTULO_FORMATO: Record<string, string> = {
  ambos: 'EMBED + FOTOS',
  texto: 'SÓ TEXTO',
  fotos: 'RESUMO + FOTOS',
};

export function AbaDiscord({ config, envios, pendentes, testando, onSalvar, onTestar, onEnviarPendentes }: Props) {
  const [form, setForm] = useState<ConfigDiscord>(config);
  const [erroUrl, setErroUrl] = useState(false);

  useEffect(() => setForm(config), [config]);

  const alterar = <K extends keyof ConfigDiscord>(chave: K, valor: ConfigDiscord[K]) => {
    setForm((atual) => ({ ...atual, [chave]: valor }));
    if (chave === 'webhook') setErroUrl(false);
  };

  const urlOk = webhookValido(form.webhook);
  const alterado = JSON.stringify(form) !== JSON.stringify(config);

  const salvar = () => {
    if (form.webhook.trim() && !urlOk) {
      setErroUrl(true);
      return;
    }
    setErroUrl(false);
    onSalvar(form);
  };

  const formato = form.formatoEnvio ?? 'ambos';

  return (
    <div className="discord-layout">
      <div className="discord-col">
        <div className="status-canal">
          <div className={`status-canal__selo ${urlOk ? 'status-canal__selo--ok' : ''}`}>
            {urlOk ? <ShieldCheck size={26} /> : <Radio size={26} />}
          </div>
          <div>
            <span className="status-canal__olho">STATUS DA INTEGRAÇÃO</span>
            <h3>{urlOk ? 'Canal vinculado' : 'Nenhum canal vinculado'}</h3>
            <p>
              {urlOk
                ? `${form.canal || '#denuncias'} · ${form.autoEnviar ? 'envio automático ativado' : 'envio manual'}`
                : 'Cole a URL do webhook do canal para enviar as denúncias automaticamente.'}
            </p>
          </div>
          {urlOk ? <Etiqueta claro>ATIVO</Etiqueta> : <Etiqueta>AGUARDANDO</Etiqueta>}
        </div>

        <Cartao>
          <SecaoTitulo
            numero="01"
            titulo="Canal de destino"
            descricao="Toda denúncia protocolada pode ser publicada neste canal automaticamente, com relato, identificação e evidências."
          />
          <Campo
            label="URL do webhook do canal"
            obrigatorio
            dica="Discord → Configurações do canal → Integrações → Webhooks → Novo webhook → Copiar URL."
          >
            <div className="input-com-icone">
              <Link2 size={16} />
              <Entrada
                value={form.webhook}
                onChange={(e) => alterar('webhook', e.target.value)}
                placeholder="https://discord.com/api/webhooks/000000000000000000/xxxxxxxx..."
                className={erroUrl ? 'input--erro' : ''}
                spellCheck={false}
                autoComplete="off"
              />
              {form.webhook && (
                <button
                  type="button"
                  title="Copiar URL"
                  onClick={() => void navigator.clipboard?.writeText(form.webhook)}
                >
                  <Copy size={15} />
                </button>
              )}
            </div>
            {erroUrl && (
              <span className="campo__erro">URL inválida. Ela deve começar com https://discord.com/api/webhooks/</span>
            )}
            {form.webhook && !erroUrl && !urlOk && (
              <span className="campo__erro">Confira a URL: use o endereço completo copiado do Discord.</span>
            )}
          </Campo>

          <div className="grid-2">
            <Campo label="Nome do canal" dica="Apenas identificação no sistema.">
              <Entrada value={form.canal} onChange={(e) => alterar('canal', e.target.value)} placeholder="#denuncias" />
            </Campo>
            <Campo label="Nome do remetente" dica="Aparece como autor da mensagem.">
              <Entrada
                value={form.nomeBot ?? ''}
                onChange={(e) => alterar('nomeBot', e.target.value)}
                placeholder="Corregedoria · Denúncias PMPR"
              />
            </Campo>
          </div>

          <Campo label="Formato da denúncia no canal" dica="Escolha como a mensagem chega no Discord.">
            <Selecao
              value={formato}
              onChange={(e) => alterar('formatoEnvio', e.target.value as ConfigDiscord['formatoEnvio'])}
            >
              <option value="ambos">EMBED COMPLETO + FOTOS — relato e evidências juntos (recomendado)</option>
              <option value="fotos">RESUMO + FOTOS — embed curto com as evidências em destaque</option>
              <option value="texto">SÓ TEXTO — embed completo sem anexar imagens</option>
            </Selecao>
          </Campo>

          <div className="interruptores">
            <Interruptor
              ligado={form.autoEnviar}
              onChange={(v) => alterar('autoEnviar', v)}
              titulo="Envio automático"
              descricao="Publica a denúncia no canal assim que ela for protocolada."
            />
            <Interruptor
              ligado={form.mencionarHere}
              onChange={(v) => alterar('mencionarHere', v)}
              titulo="Mencionar @here"
              descricao="Notifica quem estiver online no canal a cada denúncia."
            />
          </div>

          <Campo label="ID do cargo para mencionar" dica="Opcional — menciona um cargo específico (ex.: Corregedoria).">
            <Entrada
              value={form.cargoId ?? ''}
              onChange={(e) => alterar('cargoId', e.target.value.replace(/\D/g, ''))}
              placeholder="Ex.: 123456789012345678"
              inputMode="numeric"
            />
          </Campo>

          <div className="form-acoes form-acoes--dentro">
            <Botao variante="primario" icone={<Check size={17} />} onClick={salvar}>
              Salvar configuração
            </Botao>
            <Botao
              variante="secundario"
              icone={<Send size={16} />}
              onClick={() => onTestar(form)}
              disabled={!urlOk || testando}
            >
              {testando ? 'ENVIANDO...' : 'Enviar teste'}
            </Botao>
            {pendentes > 0 && (
              <Botao variante="fantasma" icone={<Send size={15} />} onClick={onEnviarPendentes} disabled={testando}>
                Enviar {pendentes} pendente{pendentes > 1 ? 's' : ''}
              </Botao>
            )}
            {alterado && <span className="aviso-nao-salvo">Alterações ainda não salvas</span>}
          </div>
        </Cartao>

        <Cartao>
          <SecaoTitulo numero="02" titulo="Como vincular o canal" descricao="Passo a passo dentro do seu servidor do Discord." />
          <ol className="passos">
            <li>
              <span>1</span>
              <div>
                <strong>Abra as configurações do canal</strong>
                <p>
                  Escolha o canal onde as denúncias devem aparecer, por exemplo <b>#denuncias</b>.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Integrações → Webhooks → Novo webhook</strong>
                <p>Dê um nome ao webhook (ex.: “Corregedoria Denúncias”) e confirme.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Copiar URL do webhook</strong>
                <p>
                  Cole a URL no campo acima, salve e use <b>Enviar teste</b> para conferir.
                </p>
              </div>
            </li>
          </ol>
          <div className="nota-seguranca">
            <CircleHelp size={17} />
            <p>
              O webhook é um segredo: quem tem a URL pode postar no canal. Ele fica salvo apenas nos dados deste
              sistema (servidor ou navegador) e é usado somente para enviar as denúncias. Não é necessário criar bot
              nem token.
            </p>
          </div>
        </Cartao>
      </div>

      <aside className="discord-col__lado">
        <Cartao className="cartao--preview-discord">
          <SecaoTitulo
            titulo="Prévia da mensagem"
            descricao="Exatamente o formato que chega no canal (exemplo de denúncia)."
          />
          <div className="discord-preview">
            <div className="discord-preview__autor">
              <img src={`${import.meta.env.BASE_URL}brasao-pmpr.png`} alt="" />
              <div>
                <strong>{form.nomeBot || 'Corregedoria · Denúncias PMPR'}</strong>
                <span>{form.canal || '#denuncias'} · FORMATO: {ROTULO_FORMATO[formato]}</span>
              </div>
            </div>
            {form.mencionarHere && <div className="discord-preview__mencao">@here</div>}
            <div className="discord-preview__embed">
              <strong>⛔ DENÚNCIA · CORREGEDORIA-GERAL PMPR</strong>
              <p>
                <b>Protocolo DEN-2026-0001</b> — Conduta em serviço
              </p>
              <div className="discord-preview__campos">
                <div>
                  <span>🎯 Natureza</span>
                  <b>Conduta em serviço</b>
                </div>
                <div>
                  <span>📍 Local</span>
                  <b>Centro — Curitiba</b>
                </div>
                <div className="discord-preview__campo-largo">
                  <span>🛡️ Denunciado</span>
                  <b>Soldado PM · 3º BPM</b>
                </div>
                <div className="discord-preview__campo-largo">
                  <span>📜 Relato</span>
                  <b>Em 05/11/2026, por volta das 22h, o militar abordou... (relato completo no embed)</b>
                </div>
                <div>
                  <span>👤 Denunciante</span>
                  <b>ANÔNIMO (identidade preservada)</b>
                </div>
                <div>
                  <span>🗓️ Data dos fatos</span>
                  <b>05/11/2026</b>
                </div>
              </div>
              {formato !== 'texto' && (
                <div className="discord-preview__foto">
                  📎 {formato === 'ambos' ? 'EVIDÊNCIAS ANEXADAS (FOTOS)' : 'FOTOS DE EVIDÊNCIA EM DESTAQUE'}
                </div>
              )}
              <span className="discord-preview__rodape">
                Corregedoria-Geral · Polícia Militar do Paraná · RP | DEN-2026-0001
              </span>
            </div>
          </div>
        </Cartao>

        <Cartao>
          <SecaoTitulo
            titulo="Histórico de envios"
            descricao={`${envios.length} registro${envios.length === 1 ? '' : 's'} de entrega.`}
          />
          {envios.length === 0 ? (
            <Vazio
              icone={<Terminal size={26} />}
              titulo="Nenhum envio ainda"
              texto="Os resultados dos envios ao Discord aparecem aqui."
            />
          ) : (
            <ul className="historico">
              {envios.slice(0, 12).map((envio) => (
                <li key={envio.id} className={envio.status === 'sucesso' ? 'historico--ok' : 'historico--erro'}>
                  <span className="historico__icone">
                    {envio.status === 'sucesso' ? <Check size={13} /> : <X size={13} />}
                  </span>
                  <div>
                    <strong>{limitar(envio.titulo, 60)}</strong>
                    <p>{limitar(envio.detalhe, 110)}</p>
                    <small>
                      {dataHoraBR(envio.criadoEm)} · via {envio.via}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </aside>
    </div>
  );
}
