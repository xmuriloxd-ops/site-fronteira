import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Camera,
  Check,
  Clock3,
  FilePlus2,
  ImagePlus,
  Info,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { Prisao, RascunhoPrisao } from '../types';
import { agoraISO, carimboCompleto, comprimirImagem, dataBR, diaPorExtenso, horaBR } from '../lib/format';
import { ARTIGOS_SUGERIDOS, ITENS_SUGERIDOS, TEMPOS_SUGERIDOS, UNIDADES } from '../data/opcoes';
import { Ficha } from './Ficha';
import type { DadosFicha } from './Ficha';
import { AssinaturaPad } from './AssinaturaPad';
import { gerarCartaz } from '../lib/cartaz';
import { AreaTexto, Botao, Campo, Cartao, Entrada, SecaoTitulo, Selecao, Sugestoes } from './ui';

const RASCUNHO_VAZIO: RascunhoPrisao = {
  fotos: [],
  nome: '',
  idRp: '',
  artigos: '',
  tempoPrisao: '',
  itensApreendidos: '',
  agente: '',
  unidade: '',
  escrivao: '',
  local: '',
  observacoes: '',
  assinatura: '',
};

const OBRIGATORIOS: { chave: keyof RascunhoPrisao; rotulo: string }[] = [
  { chave: 'nome', rotulo: 'Nome do custodiado' },
  { chave: 'idRp', rotulo: 'ID do custodiado' },
  { chave: 'artigos', rotulo: 'Artigos' },
  { chave: 'tempoPrisao', rotulo: 'Tempo de prisão' },
  { chave: 'itensApreendidos', rotulo: 'Itens apreendidos' },
  { chave: 'agente', rotulo: 'Agente que prendeu' },
  { chave: 'unidade', rotulo: 'Unidade na ocorrência' },
  { chave: 'escrivao', rotulo: 'Nome do escrivão' },
];

function rascunhoDe(prisao: Prisao | null): RascunhoPrisao {
  if (!prisao) return { ...RASCUNHO_VAZIO };
  return {
    fotos: prisao.fotos ?? [],
    nome: prisao.nome,
    idRp: prisao.idRp,
    artigos: prisao.artigos,
    tempoPrisao: prisao.tempoPrisao,
    itensApreendidos: prisao.itensApreendidos,
    agente: prisao.agente,
    unidade: prisao.unidade,
    escrivao: prisao.escrivao,
    local: prisao.local ?? '',
    observacoes: prisao.observacoes ?? '',
    assinatura: prisao.assinatura ?? '',
  };
}

interface Props {
  /** Usado pelo App para remontar o formulário ao trocar de registro. */
  key?: string;
  editando: Prisao | null;
  numero: string;
  salvando: boolean;
  onSalvar: (dados: RascunhoPrisao) => void;
  onCancelarEdicao: () => void;
  onAviso: (mensagem: string, tipo: 'ok' | 'erro' | 'info') => void;
  onImprimir: (dados: DadosFicha, numero: string) => void;
}

export function FormularioPrisao({
  editando,
  numero,
  salvando,
  onSalvar,
  onCancelarEdicao,
  onAviso,
  onImprimir,
}: Props) {
  const [dados, setDados] = useState<RascunhoPrisao>(() => rascunhoDe(editando));
  const [unidadeOutra, setUnidadeOutra] = useState('');
  const [erros, setErros] = useState<Record<string, boolean>>({});
  const [processandoFotos, setProcessandoFotos] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [agora, setAgora] = useState(() => agoraISO());
  const [modoPreview, setModoPreview] = useState<'ficha' | 'cartaz'>('cartaz');
  const [cartazUrl, setCartazUrl] = useState('');
  const [gerandoCartaz, setGerandoCartaz] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editando) return;
    const id = window.setInterval(() => setAgora(agoraISO()), 10_000);
    return () => window.clearInterval(id);
  }, [editando]);

  const timestamp = editando?.criadoEm ?? agora;
  const numeroFicha = editando?.numero ?? numero;

  // Prévia do cartaz: mesma arte que é enviada ao Discord.
  useEffect(() => {
    if (modoPreview !== 'cartaz') return;
    let vivo = true;
    setGerandoCartaz(true);
    const id = window.setTimeout(() => {
      void gerarCartaz({ ...dados, criadoEm: timestamp, numero: numeroFicha })
        .then((cartaz) => {
          if (vivo) setCartazUrl(cartaz.dataUrl);
        })
        .catch(() => {
          if (vivo) onAviso('Não foi possível gerar a prévia do cartaz.', 'erro');
        })
        .finally(() => {
          if (vivo) setGerandoCartaz(false);
        });
    }, 350);
    return () => {
      vivo = false;
      window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoPreview, dados, timestamp, numeroFicha]);

  const alterar = (chave: keyof RascunhoPrisao, valor: string | string[]) => {
    setDados((atual) => ({ ...atual, [chave]: valor } as RascunhoPrisao));
    if (typeof valor === 'string' && valor.trim()) {
      setErros((atual) => ({ ...atual, [chave]: false }));
    }
  };

  const adicionarFotos = async (arquivos: FileList | File[]) => {
    const lista = Array.from(arquivos).filter((a) => a.type.startsWith('image/'));
    if (!lista.length) {
      onAviso('Selecione arquivos de imagem (JPG, PNG ou WEBP).', 'erro');
      return;
    }
    const restantes = 4 - dados.fotos.length;
    if (restantes <= 0) {
      onAviso('Limite de 4 fotos por registro.', 'info');
      return;
    }
    setProcessandoFotos(true);
    try {
      const novas: string[] = [];
      for (const arquivo of lista.slice(0, restantes)) {
        novas.push(await comprimirImagem(arquivo));
      }
      setDados((atual) => ({ ...atual, fotos: [...atual.fotos, ...novas] }));
      if (lista.length > restantes) onAviso('Algumas fotos foram ignoradas (limite de 4).', 'info');
    } catch (erro) {
      onAviso(erro instanceof Error ? erro.message : 'Falha ao processar a imagem.', 'erro');
    } finally {
      setProcessandoFotos(false);
      if (inputFoto.current) inputFoto.current.value = '';
    }
  };

  const removerFoto = (indice: number) => {
    setDados((atual) => ({ ...atual, fotos: atual.fotos.filter((_, i) => i !== indice) }));
  };

  const baixarCartaz = () => {
    if (!cartazUrl) return;
    const a = document.createElement('a');
    a.href = cartazUrl;
    a.download = `cartaz-${numeroFicha}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const limpar = () => {
    setDados({ ...RASCUNHO_VAZIO });
    setUnidadeOutra('');
    setErros({});
    setAgora(agoraISO());
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const unidadeFinal = dados.unidade === 'Outra unidade' ? unidadeOutra.trim() : dados.unidade.trim();
    const completo: RascunhoPrisao = { ...dados, unidade: unidadeFinal };
    const faltando = OBRIGATORIOS.filter(({ chave }) => !String(completo[chave] ?? '').trim());
    if (dados.unidade === 'Outra unidade' && !unidadeOutra.trim()) faltando.push({ chave: 'unidade', rotulo: 'Unidade' });

    if (faltando.length) {
      const novosErros: Record<string, boolean> = {};
      faltando.forEach(({ chave }) => (novosErros[chave] = true));
      setErros(novosErros);
      onAviso(`Preencha: ${faltando.map((f) => f.rotulo).join(', ')}.`, 'erro');
      return;
    }
    setErros({});
    onSalvar(completo);
  };

  const dadosFicha: DadosFicha = { ...dados, criadoEm: timestamp, numero: numeroFicha };

  return (
    <div className="form-layout">
      <form className="form-col" onSubmit={enviar} noValidate>
        {editando && (
          <div className="aviso-edicao">
            <Info size={17} />
            <span>
              Editando o registro <b>{editando.numero}</b> de {editando.nome}. A data original será mantida.
            </span>
            <button type="button" onClick={onCancelarEdicao} aria-label="Cancelar edição">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ---------------- Fotografia ---------------- */}
        <Cartao>
          <SecaoTitulo
            numero="01"
            titulo="Fotografia do custodiado"
            descricao="Até 4 fotos. As imagens são ajustadas automaticamente e ficam em preto e branco na ficha."
          />
          <input
            ref={inputFoto}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => e.target.files && void adicionarFotos(e.target.files)}
          />
          <div
            className={`upload ${arrastando ? 'upload--arrastando' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              void adicionarFotos(e.dataTransfer.files);
            }}
          >
            <div className="upload__icone">
              <ImagePlus size={28} />
            </div>
            <div className="upload__textos">
              <strong>Arraste as fotos aqui</strong>
              <span>ou clique em selecionar · JPG, PNG, WEBP · máx. 4 imagens</span>
            </div>
            <Botao
              type="button"
              variante="secundario"
              pequeno
              icone={<Camera size={15} />}
              onClick={() => inputFoto.current?.click()}
              disabled={processandoFotos || dados.fotos.length >= 4}
            >
              {processandoFotos ? 'Processando...' : 'Selecionar fotos'}
            </Botao>
          </div>

          {dados.fotos.length > 0 && (
            <div className="fotos">
              {dados.fotos.map((foto, i) => (
                <div className="foto" key={`${i}-${foto.slice(-16)}`}>
                  <img src={foto} alt={`Foto ${i + 1} do custodiado`} />
                  {i === 0 && <span className="foto__principal">PRINCIPAL</span>}
                  <button type="button" onClick={() => removerFoto(i)} aria-label={`Remover foto ${i + 1}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Cartao>

        {/* ---------------- Identificação ---------------- */}
        <Cartao>
          <SecaoTitulo numero="02" titulo="Identificação" descricao="Dados do custodiado e enquadramento legal." />
          <div className="grid-2">
            <Campo label="Nome completo do criminoso" obrigatorio>
              <Entrada
                value={dados.nome}
                onChange={(e) => alterar('nome', e.target.value)}
                placeholder="Ex.: João da Silva"
                className={erros.nome ? 'input--erro' : ''}
              />
            </Campo>
            <Campo label="ID do custodiado (ID RP)" obrigatorio>
              <Entrada
                value={dados.idRp}
                onChange={(e) => alterar('idRp', e.target.value)}
                placeholder="Ex.: 18420"
                inputMode="numeric"
                className={erros.idRp ? 'input--erro' : ''}
              />
            </Campo>
          </div>

          <Campo label="Artigos / enquadramento" obrigatorio dica="Um artigo por linha, ou separe por vírgula.">
            <AreaTexto
              rows={3}
              value={dados.artigos}
              onChange={(e) => alterar('artigos', e.target.value)}
              placeholder="Ex.: Art. 33 — Tráfico de Drogas"
              className={erros.artigos ? 'input--erro' : ''}
            />
          </Campo>
          <Sugestoes titulo="Artigos frequentes" itens={ARTIGOS_SUGERIDOS} valor={dados.artigos} onChange={(v) => alterar('artigos', v)} />

          <div className="grid-2 grid-2--topo">
            <Campo label="Tempo de prisão" obrigatorio>
              <Entrada
                value={dados.tempoPrisao}
                onChange={(e) => alterar('tempoPrisao', e.target.value)}
                placeholder="Ex.: 30 minutos"
                className={erros.tempoPrisao ? 'input--erro' : ''}
              />
              <Sugestoes
                titulo="Atalhos"
                itens={TEMPOS_SUGERIDOS}
                valor=""
                onChange={(v) => alterar('tempoPrisao', v)}
                separador="|"
              />
            </Campo>
            <Campo label="Local da ocorrência" dica="Opcional">
              <Entrada
                value={dados.local ?? ''}
                onChange={(e) => alterar('local', e.target.value)}
                placeholder="Ex.: Avenida Central, Centro"
              />
            </Campo>
          </div>

          <Campo label="Itens apreendidos" obrigatorio dica="Liste tudo que foi recolhido na ocorrência.">
            <AreaTexto
              rows={3}
              value={dados.itensApreendidos}
              onChange={(e) => alterar('itensApreendidos', e.target.value)}
              placeholder="Ex.: 1 arma de fogo, 12 munições, R$ 3.500,00"
              className={erros.itensApreendidos ? 'input--erro' : ''}
            />
          </Campo>
          <Sugestoes
            titulo="Adicionar item"
            itens={ITENS_SUGERIDOS}
            valor={dados.itensApreendidos}
            onChange={(v) => alterar('itensApreendidos', v)}
            separador=", "
          />
        </Cartao>

        {/* ---------------- Ocorrência ---------------- */}
        <Cartao>
          <SecaoTitulo numero="03" titulo="Equipe da ocorrência" descricao="Quem prendeu, quem lavrou e de onde veio a equipe." />
          <div className="grid-2">
            <Campo label="Agente que prendeu" obrigatorio>
              <Entrada
                value={dados.agente}
                onChange={(e) => alterar('agente', e.target.value)}
                placeholder="Ex.: Agente R. Souza"
                className={erros.agente ? 'input--erro' : ''}
              />
            </Campo>
            <Campo label="Nome do escrivão" obrigatorio>
              <Entrada
                value={dados.escrivao}
                onChange={(e) => alterar('escrivao', e.target.value)}
                placeholder="Ex.: Escrivão M. Lima"
                className={erros.escrivao ? 'input--erro' : ''}
              />
            </Campo>
          </div>
          <Campo label="Unidade que estava na ocorrência" obrigatorio>
            <Selecao
              value={dados.unidade}
              onChange={(e) => alterar('unidade', e.target.value)}
              className={erros.unidade ? 'input--erro' : ''}
            >
              <option value="">Selecione a unidade...</option>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Selecao>
          </Campo>
          {dados.unidade === 'Outra unidade' && (
            <Campo label="Informe a unidade" obrigatorio>
              <Entrada
                value={unidadeOutra}
                onChange={(e) => setUnidadeOutra(e.target.value)}
                placeholder="Ex.: 4ª Delegacia de Polícia"
                className={erros.unidade ? 'input--erro' : ''}
              />
            </Campo>
          )}
          <Campo label="Observações" dica="Opcional — histórico, testemunhas, número da viatura etc.">
            <AreaTexto
              rows={3}
              value={dados.observacoes ?? ''}
              onChange={(e) => alterar('observacoes', e.target.value)}
              placeholder="Descreva detalhes adicionais da ocorrência..."
            />
          </Campo>
          <AssinaturaPad
            valor={dados.assinatura}
            onChange={(v) => alterar('assinatura', v)}
            nomeEscrivao={dados.escrivao}
          />
        </Cartao>

        {/* ---------------- Data automática ---------------- */}
        <Cartao className="cartao--auto">
          <SecaoTitulo numero="04" titulo="Dia e data" descricao="Gerados automaticamente pelo sistema — não é necessário preencher." />
          <div className="auto-box">
            <div className="auto-box__icone">
              <Clock3 size={22} />
            </div>
            <div className="auto-box__dados">
              <div>
                <span>DIA DA SEMANA</span>
                <strong>{diaPorExtenso(timestamp)}</strong>
              </div>
              <div>
                <span>DATA</span>
                <strong>{dataBR(timestamp)}</strong>
              </div>
              <div>
                <span>HORÁRIO</span>
                <strong>{horaBR(timestamp)}</strong>
              </div>
              <div>
                <span>REGISTRO Nº</span>
                <strong>{editando?.numero ?? numero}</strong>
              </div>
            </div>
          </div>
          <p className="auto-box__nota">
            <Check size={14} /> {carimboCompleto(timestamp)} · horário de Brasília. Gerado no momento do registro.
          </p>
        </Cartao>

        <div className="form-acoes">
          <Botao type="submit" variante="primario" icone={editando ? <Save size={18} /> : <FilePlus2 size={18} />} disabled={salvando}>
            {salvando ? 'SALVANDO...' : editando ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR PRISÃO'}
          </Botao>
          <Botao type="button" variante="fantasma" icone={<RotateCcw size={16} />} onClick={limpar} disabled={salvando}>
            Limpar formulário
          </Botao>
          {editando && (
            <Botao type="button" variante="secundario" onClick={onCancelarEdicao} disabled={salvando}>
              Cancelar edição
            </Botao>
          )}
        </div>
      </form>

      {/* ---------------- Prévia ao vivo ---------------- */}
      <aside className="preview-col">
        <div className="preview-col__cabecalho">
          <div>
            <span className="preview-col__olho">PRÉVIA EM TEMPO REAL</span>
            <h3>{modoPreview === 'cartaz' ? 'Cartaz da ficha' : 'Ficha do registro'}</h3>
          </div>
          <div className="segmento" role="tablist" aria-label="Tipo de prévia">
            <button
              type="button"
              role="tab"
              aria-selected={modoPreview === 'ficha'}
              className={modoPreview === 'ficha' ? 'segmento--ativo' : ''}
              onClick={() => setModoPreview('ficha')}
            >
              Ficha
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modoPreview === 'cartaz'}
              className={modoPreview === 'cartaz' ? 'segmento--ativo' : ''}
              onClick={() => setModoPreview('cartaz')}
            >
              Cartaz
            </button>
          </div>
        </div>
        <div className="preview-col__ficha">
          {modoPreview === 'ficha' ? (
            <Ficha dados={dadosFicha} numero={numeroFicha} />
          ) : cartazUrl ? (
            <img className="preview-cartaz" src={cartazUrl} alt="Cartaz gerado da ficha de registro" />
          ) : (
            <div className="preview-carregando">{gerandoCartaz ? 'Gerando cartaz...' : 'Prévia indisponível'}</div>
          )}
        </div>
        <div className="preview-col__acoes">
          <Botao
            variante="fantasma"
            pequeno
            onClick={() => onImprimir(dadosFicha, numeroFicha)}
            icone={<FilePlus2 size={14} />}
          >
            Imprimir ficha
          </Botao>
          {modoPreview === 'cartaz' && cartazUrl && (
            <Botao variante="secundario" pequeno onClick={baixarCartaz}>
              Baixar cartaz PNG
            </Botao>
          )}
        </div>
        <p className="preview-col__nota">
          <Info size={14} /> O cartaz é a imagem enviada ao Discord, no mesmo modelo da ficha, já com a assinatura
          do escrivão. Dia, data, horário e número são gerados automaticamente.
        </p>
      </aside>
    </div>
  );
}
