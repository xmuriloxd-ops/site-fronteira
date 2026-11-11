import { useEffect, useState } from 'react';
import {
  Check,
  CircleHelp,
  Copy,
  Gavel,
  Link2,
  Radio,
  Send,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import type { ConfigDiscord, EnvioDiscord } from '../types';
import { dataHoraBR, limitar } from '../lib/format';
import { webhookValido } from '../lib/discord';
import { dadosCartazExemplo, gerarCartaz } from '../lib/cartaz';
import { dadosMandadoExemplo, gerarCartazMandado } from '../lib/cartazMandado';
import { Botao, Campo, Cartao, Entrada, Etiqueta, SecaoTitulo, Selecao, Vazio } from './ui';

interface Props {
  config: ConfigDiscord;
  configMandados: ConfigDiscord;
  envios: EnvioDiscord[];
  pendentes: number;
  pendentesMandados: number;
  testando: boolean;
  onSalvar: (cfg: ConfigDiscord) => void;
  onSalvarMandados: (cfg: ConfigDiscord) => void;
  onTestar: (cfg: ConfigDiscord) => void;
  onTestarMandados: (cfg: ConfigDiscord) => void;
  onEnviarPendentes: () => void;
  onEnviarPendentesMandados: () => void;
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

export function AbaDiscord({
  config,
  configMandados,
  envios,
  pendentes,
  pendentesMandados,
  testando,
  onSalvar,
  onSalvarMandados,
  onTestar,
  onTestarMandados,
  onEnviarPendentes,
  onEnviarPendentesMandados,
}: Props) {
  const [form, setForm] = useState<ConfigDiscord>(config);
  const [formMandados, setFormMandados] = useState<ConfigDiscord>(configMandados);
  const [erroUrl, setErroUrl] = useState(false);
  const [erroUrlMandados, setErroUrlMandados] = useState(false);
  const [cartazExemplo, setCartazExemplo] = useState('');
  const [mandadoExemplo, setMandadoExemplo] = useState('');

  useEffect(() => setForm(config), [config]);
  useEffect(() => setFormMandados(configMandados), [configMandados]);

  useEffect(() => {
    let vivo = true;
    void gerarCartaz(dadosCartazExemplo(), { marcaDagua: 'EXEMPLO' })
      .then((arte) => {
        if (vivo) setCartazExemplo(arte.dataUrl);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    void gerarCartazMandado(dadosMandadoExemplo(), { marcaDagua: 'EXEMPLO' })
      .then((arte) => {
        if (vivo) setMandadoExemplo(arte.dataUrl);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);

  const baixarArte = (dataUrl: string, nome: string) => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const alterar = <K extends keyof ConfigDiscord>(chave: K, valor: ConfigDiscord[K]) => {
    setForm((atual) => ({ ...atual, [chave]: valor }));
    if (chave === 'webhook') setErroUrl(false);
  };

  const alterarMandados = <K extends keyof ConfigDiscord>(chave: K, valor: ConfigDiscord[K]) => {
    setFormMandados((atual) => ({ ...atual, [chave]: valor, formatoEnvio: 'cartaz' }));
    if (chave === 'webhook') setErroUrlMandados(false);
  };

  const urlOk = webhookValido(form.webhook);
  const urlMandadosOk = webhookValido(formMandados.webhook);
  const alterado = JSON.stringify(form) !== JSON.stringify(config);
  const alteradoMandados = JSON.stringify(formMandados) !== JSON.stringify(configMandados);

  const salvar = () => {
    if (form.webhook.trim() && !urlOk) {
      setErroUrl(true);
      return;
    }
    setErroUrl(false);
    onSalvar(form);
  };

  const salvarMandados = () => {
    if (formMandados.webhook.trim() && !urlMandadosOk) {
      setErroUrlMandados(true);
      return;
    }
    setErroUrlMandados(false);
    onSalvarMandados({ ...formMandados, formatoEnvio: 'cartaz' });
  };

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
                ? `${form.canal || '#prisoes'} · ${form.autoEnviar ? 'envio automático ativado' : 'envio manual'}`
                : 'Cole a URL do webhook do canal para receber as prisões automaticamente.'}
            </p>
          </div>
          {urlOk ? <Etiqueta claro>ATIVO</Etiqueta> : <Etiqueta>AGUARDANDO</Etiqueta>}
        </div>

        <Cartao>
          <SecaoTitulo
            numero="01"
            titulo="Canal de destino"
            descricao="Toda prisão registrada pode ser publicada neste canal com os dados completos e a foto."
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
            {erroUrl && <span className="campo__erro">URL inválida. Ela deve começar com https://discord.com/api/webhooks/</span>}
            {form.webhook && !erroUrl && !urlOk && (
              <span className="campo__erro">Confira a URL: use o endereço completo copiado do Discord.</span>
            )}
          </Campo>

          <div className="grid-2">
            <Campo label="Nome do canal" dica="Apenas identificação no sistema.">
              <Entrada value={form.canal} onChange={(e) => alterar('canal', e.target.value)} placeholder="#prisoes" />
            </Campo>
            <Campo label="Nome do remetente" dica="Aparece como autor da mensagem.">
              <Entrada
                value={form.nomeBot ?? ''}
                onChange={(e) => alterar('nomeBot', e.target.value)}
                placeholder="PCPR · Registro de Prisões"
              />
            </Campo>
          </div>

          <Campo
            label="Formato da ficha no canal"
            dica="O cartaz é a imagem da ficha no modelo impresso, já com a assinatura do escrivão."
          >
            <Selecao
              value={form.formatoEnvio ?? 'cartaz'}
              onChange={(e) => alterar('formatoEnvio', e.target.value as ConfigDiscord['formatoEnvio'])}
            >
              <option value="cartaz">CARTAZ EM IMAGEM — modelo da ficha (recomendado)</option>
              <option value="texto">FICHA EM TEXTO — embed com os campos</option>
              <option value="ambos">CARTAZ + TEXTO — imagem e embed juntos</option>
            </Selecao>
          </Campo>

          <div className="interruptores">
            <Interruptor
              ligado={form.autoEnviar}
              onChange={(v) => alterar('autoEnviar', v)}
              titulo="Envio automático"
              descricao="Publica a ficha no canal assim que a prisão é registrada."
            />
            <Interruptor
              ligado={form.mencionarHere}
              onChange={(v) => alterar('mencionarHere', v)}
              titulo="Mencionar @here"
              descricao="Notifica quem estiver online no canal a cada prisão."
            />
          </div>

          <Campo label="ID do cargo para mencionar" dica="Opcional — menciona um cargo específico (ex.: Delegacia).">
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
              <Botao variante="fantasma" icone={<Send size={15} />} onClick={onEnviarPendentes}>
                Enviar {pendentes} pendente{pendentes > 1 ? 's' : ''}
              </Botao>
            )}
            {alterado && <span className="aviso-nao-salvo">Alterações ainda não salvas</span>}
          </div>
        </Cartao>

        <Cartao className="cartao--canal-mandados">
          <SecaoTitulo
            numero="02"
            titulo="Canal dos mandados de prisão"
            descricao="Os cartazes de mandados podem ir para um canal específico. Deixe o webhook em branco para usar o canal das prisões."
          />
          <div className="nota-mandados">
            <Gavel size={17} />
            <span>
              <b>Sempre em formato de cartaz.</b> Cada mandado expedido gera uma imagem PNG com brasão, foto,
              situação, dia/data automáticos e assinatura da autoridade — enviada como anexo ao Discord.
            </span>
          </div>
          <Campo
            label="URL do webhook dos mandados"
            dica="Opcional — se vazio, usa o webhook configurado acima."
          >
            <div className="input-com-icone">
              <Link2 size={16} />
              <Entrada
                value={formMandados.webhook}
                onChange={(e) => alterarMandados('webhook', e.target.value)}
                placeholder="https://discord.com/api/webhooks/...  (ou deixe em branco)"
                className={erroUrlMandados ? 'input--erro' : ''}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            {erroUrlMandados && (
              <span className="campo__erro">URL inválida. Ela deve começar com https://discord.com/api/webhooks/</span>
            )}
            {formMandados.webhook && !erroUrlMandados && !urlMandadosOk && (
              <span className="campo__erro">Confira a URL completa copiada do Discord.</span>
            )}
          </Campo>
          <div className="grid-2">
            <Campo label="Nome do canal" dica="Apenas identificação.">
              <Entrada
                value={formMandados.canal}
                onChange={(e) => alterarMandados('canal', e.target.value)}
                placeholder="#mandados"
              />
            </Campo>
            <Campo label="Nome do remetente" dica="Aparece como autor da mensagem.">
              <Entrada
                value={formMandados.nomeBot ?? ''}
                onChange={(e) => alterarMandados('nomeBot', e.target.value)}
                placeholder="PCPR · Mandados de Prisão"
              />
            </Campo>
          </div>
          <div className="interruptores">
            <Interruptor
              ligado={formMandados.autoEnviar}
              onChange={(v) => alterarMandados('autoEnviar', v)}
              titulo="Envio automático de cartazes"
              descricao="Publica o cartaz no canal assim que o mandado é expedido."
            />
            <Interruptor
              ligado={formMandados.mencionarHere}
              onChange={(v) => alterarMandados('mencionarHere', v)}
              titulo="Mencionar @here"
              descricao="Notifica quem estiver online no canal a cada mandado."
            />
          </div>
          <div className="form-acoes form-acoes--dentro">
            <Botao variante="primario" icone={<Check size={17} />} onClick={salvarMandados}>
              Salvar canal de mandados
            </Botao>
            <Botao
              variante="secundario"
              icone={<Send size={16} />}
              onClick={() => onTestarMandados(formMandados)}
              disabled={testando || (!urlMandadosOk && !urlOk)}
            >
              {testando ? 'ENVIANDO...' : 'Enviar cartaz de teste'}
            </Botao>
            {pendentesMandados > 0 && (
              <Botao variante="fantasma" icone={<Send size={15} />} onClick={onEnviarPendentesMandados}>
                Enviar {pendentesMandados} cartaz{pendentesMandados > 1 ? 'es' : ''}
              </Botao>
            )}
            {alteradoMandados && <span className="aviso-nao-salvo">Alterações ainda não salvas</span>}
          </div>
        </Cartao>

        <Cartao>
          <SecaoTitulo numero="03" titulo="Como vincular o canal" descricao="Passo a passo dentro do seu servidor do Discord." />
          <ol className="passos">
            <li>
              <span>1</span>
              <div>
                <strong>Abra as configurações do canal</strong>
                <p>Escolha o canal onde as prisões devem aparecer, por exemplo <b>#prisoes</b>.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Integrações → Webhooks → Novo webhook</strong>
                <p>Dê um nome ao webhook (ex.: “PCPR Prisões”) e confirme.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Copiar URL do webhook</strong>
                <p>Cole a URL no campo acima, salve e use <b>Enviar teste</b> para conferir.</p>
              </div>
            </li>
          </ol>
          <div className="nota-seguranca">
            <CircleHelp size={17} />
            <p>
              O webhook é um segredo: quem tem a URL pode postar no canal. Ele fica salvo apenas nos dados deste
              sistema (servidor ou navegador) e é usado somente para enviar as fichas. Não é necessário criar bot
              nem token.
            </p>
          </div>
        </Cartao>
      </div>

      <aside className="discord-col__lado">
        <Cartao className="cartao--preview-discord">
          <SecaoTitulo
            titulo="Prévia do cartaz"
            descricao="Exatamente a imagem que chega no canal (exemplo com marca d'água)."
          />
          <div className="discord-preview">
            <div className="discord-preview__autor">
              <img src="/brasao-pcpr.png" alt="" />
              <div>
                <strong>{form.nomeBot || 'PCPR · Registro de Prisões'}</strong>
                <span>{form.canal || '#prisoes'} · FORMATO: {(form.formatoEnvio ?? 'cartaz').toUpperCase()}</span>
              </div>
            </div>
            {form.mencionarHere && <div className="discord-preview__mencao">@here</div>}
            <div className="cartaz-preview">
              {cartazExemplo ? (
                <img src={cartazExemplo} alt="Exemplo do cartaz da ficha enviado ao Discord" />
              ) : (
                <div className="preview-carregando">Gerando exemplo do cartaz...</div>
              )}
            </div>
            <div className="cartaz-preview__rodape">
              <span>
                <Check size={13} /> Mesmo modelo da ficha, com foto, dia/data automáticos e assinatura do escrivão.
              </span>
              <Botao
                variante="fantasma"
                pequeno
                onClick={() => baixarArte(cartazExemplo, 'cartaz-exemplo-pcpr.png')}
                disabled={!cartazExemplo}
              >
                Baixar exemplo
              </Botao>
            </div>
          </div>
        </Cartao>

        <Cartao className="cartao--preview-discord">
          <SecaoTitulo
            titulo="Prévia do cartaz de mandado"
            descricao="Modelo enviado a cada expedição (exemplo com marca d'água)."
          />
          <div className="discord-preview">
            <div className="discord-preview__autor">
              <img src="/brasao-pcpr.png" alt="" />
              <div>
                <strong>{formMandados.nomeBot || 'PCPR · Mandados de Prisão'}</strong>
                <span>{formMandados.canal || '#mandados'} · FORMATO: CARTAZ</span>
              </div>
            </div>
            {formMandados.mencionarHere && <div className="discord-preview__mencao">@here</div>}
            <div className="cartaz-preview">
              {mandadoExemplo ? (
                <img src={mandadoExemplo} alt="Exemplo do cartaz de mandado enviado ao Discord" />
              ) : (
                <div className="preview-carregando">Gerando exemplo do cartaz de mandado...</div>
              )}
            </div>
            <div className="cartaz-preview__rodape">
              <span><Check size={13} /> Cartaz PNG com assinatura da autoridade.</span>
              <Botao
                variante="fantasma"
                pequeno
                onClick={() => baixarArte(mandadoExemplo, 'cartaz-mandado-exemplo.png')}
                disabled={!mandadoExemplo}
              >
                Baixar exemplo
              </Botao>
            </div>
          </div>
        </Cartao>

        <Cartao>
          <SecaoTitulo titulo="Histórico de envios" descricao={`${envios.length} registro${envios.length === 1 ? '' : 's'} de entrega.`} />
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
                    <small>{dataHoraBR(envio.criadoEm)} · via {envio.via}</small>
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
