import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Camera,
  Check,
  Clock3,
  FilePlus2,
  ImagePlus,
  Info,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import type { Mandado, RascunhoMandado, StatusMandado } from '../types';
import { STATUS_MANDADO } from '../types';
import {
  agoraISO,
  carimboCompleto,
  comprimirImagem,
  dataBR,
  diaPorExtenso,
  horaBR,
} from '../lib/format';
import { gerarCartazMandado } from '../lib/cartazMandado';
import { ARTIGOS_SUGERIDOS, FUNDAMENTOS_SUGERIDOS, UNIDADES, VALIDADES_SUGERIDAS } from '../data/opcoes';
import { AssinaturaPad } from './AssinaturaPad';
import { AreaTexto, Botao, Campo, Cartao, Entrada, SecaoTitulo, Selecao, Sugestoes } from './ui';

const RASCUNHO_VAZIO: RascunhoMandado = {
  fotos: [],
  nome: '',
  idRp: '',
  artigos: '',
  fundamento: '',
  processo: '',
  autoridade: '',
  origem: '',
  unidade: '',
  agente: '',
  validade: 'Até o efetivo cumprimento ou revogação',
  status: 'pendente',
  observacoes: '',
  assinatura: '',
};

const OBRIGATORIOS: { chave: keyof RascunhoMandado; rotulo: string }[] = [
  { chave: 'nome', rotulo: 'Nome do procurado' },
  { chave: 'idRp', rotulo: 'ID RP' },
  { chave: 'artigos', rotulo: 'Artigos / tipificação' },
  { chave: 'fundamento', rotulo: 'Fundamento do mandado' },
  { chave: 'autoridade', rotulo: 'Autoridade que expediu' },
  { chave: 'unidade', rotulo: 'Unidade responsável' },
];

function rascunhoDe(m: Mandado | null): RascunhoMandado {
  if (!m) return { ...RASCUNHO_VAZIO };
  return {
    fotos: m.fotos ?? [],
    nome: m.nome,
    idRp: m.idRp,
    artigos: m.artigos,
    fundamento: m.fundamento,
    processo: m.processo,
    autoridade: m.autoridade,
    origem: m.origem,
    unidade: m.unidade,
    agente: m.agente,
    validade: m.validade,
    status: m.status,
    observacoes: m.observacoes,
    assinatura: m.assinatura ?? '',
  };
}

interface Props {
  key?: string;
  editando: Mandado | null;
  numero: string;
  salvando: boolean;
  onSalvar: (dados: RascunhoMandado) => void;
  onCancelarEdicao: () => void;
  onAviso: (mensagem: string, tipo: 'ok' | 'erro' | 'info') => void;
  onImprimir: (dataUrl: string) => void;
}

export function FormularioMandado({
  editando,
  numero,
  salvando,
  onSalvar,
  onCancelarEdicao,
  onAviso,
  onImprimir,
}: Props) {
  const [dados, setDados] = useState<RascunhoMandado>(() => rascunhoDe(editando));
  const [unidadeOutra, setUnidadeOutra] = useState('');
  const [erros, setErros] = useState<Record<string, boolean>>({});
  const [processandoFotos, setProcessandoFotos] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [agora, setAgora] = useState(() => agoraISO());
  const [cartazUrl, setCartazUrl] = useState('');
  const [gerando, setGerando] = useState(false);
  const inputFoto = useRef<HTMLInputElement>(null);

  const timestamp = editando?.criadoEm ?? agora;
  const numeroFicha = editando?.numero ?? numero;

  useEffect(() => {
    if (editando) return;
    const id = window.setInterval(() => setAgora(agoraISO()), 10_000);
    return () => window.clearInterval(id);
  }, [editando]);

  // Prévia do cartaz em tempo real (mesma imagem enviada ao Discord).
  useEffect(() => {
    let vivo = true;
    setGerando(true);
    const id = window.setTimeout(() => {
      void gerarCartazMandado({ ...dados, criadoEm: timestamp, numero: numeroFicha })
        .then((c) => {
          if (vivo) setCartazUrl(c.dataUrl);
        })
        .catch(() => {
          if (vivo) onAviso('Não foi possível gerar a prévia do cartaz.', 'erro');
        })
        .finally(() => {
          if (vivo) setGerando(false);
        });
    }, 350);
    return () => {
      vivo = false;
      window.clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, timestamp, numeroFicha]);

  const alterar = (chave: keyof RascunhoMandado, valor: string | string[] | StatusMandado) => {
    setDados((atual) => ({ ...atual, [chave]: valor } as RascunhoMandado));
    if (typeof valor === 'string' && valor.trim()) setErros((e) => ({ ...e, [chave]: false }));
  };

  const adicionarFotos = async (arquivos: FileList | File[]) => {
    const lista = Array.from(arquivos).filter((a) => a.type.startsWith('image/'));
    if (!lista.length) {
      onAviso('Selecione arquivos de imagem (JPG, PNG ou WEBP).', 'erro');
      return;
    }
    const restantes = 4 - dados.fotos.length;
    if (restantes <= 0) {
      onAviso('Limite de 4 fotos por mandado.', 'info');
      return;
    }
    setProcessandoFotos(true);
    try {
      const novas: string[] = [];
      for (const arquivo of lista.slice(0, restantes)) novas.push(await comprimirImagem(arquivo));
      setDados((atual) => ({ ...atual, fotos: [...atual.fotos, ...novas] }));
    } catch (erro) {
      onAviso(erro instanceof Error ? erro.message : 'Falha ao processar a imagem.', 'erro');
    } finally {
      setProcessandoFotos(false);
      if (inputFoto.current) inputFoto.current.value = '';
    }
  };

  const limpar = () => {
    setDados({ ...RASCUNHO_VAZIO });
    setUnidadeOutra('');
    setErros({});
    setAgora(agoraISO());
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

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const unidadeFinal = dados.unidade === 'Outra unidade' ? unidadeOutra.trim() : dados.unidade.trim();
    const completo: RascunhoMandado = { ...dados, unidade: unidadeFinal };
    const faltando = OBRIGATORIOS.filter(({ chave }) => !String(completo[chave] ?? '').trim());
    if (dados.unidade === 'Outra unidade' && !unidadeOutra.trim()) {
      faltando.push({ chave: 'unidade', rotulo: 'Unidade' });
    }
    if (faltando.length) {
      const novos: Record<string, boolean> = {};
      faltando.forEach(({ chave }) => (novos[chave] = true));
      setErros(novos);
      onAviso(`Preencha: ${faltando.map((f) => f.rotulo).join(', ')}.`, 'erro');
      return;
    }
    setErros({});
    onSalvar(completo);
  };

  return (
    <div className="form-layout">
      <form className="form-col" onSubmit={enviar} noValidate>
        {editando && (
          <div className="aviso-edicao">
            <Info size={17} />
            <span>
              Editando o mandado <b>{editando.numero}</b> de {editando.nome}. A data original será mantida.
            </span>
            <button type="button" onClick={onCancelarEdicao} aria-label="Cancelar edição">
              <X size={16} />
            </button>
          </div>
        )}

        <Cartao>
          <SecaoTitulo
            numero="01"
            titulo="Identificação do procurado"
            descricao="Foto, nome, ID e a situação atual do mandado."
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
              <strong>Foto do procurado</strong>
              <span>Arraste ou selecione · até 4 imagens · exibidas em preto e branco</span>
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
                  <img src={foto} alt={`Foto ${i + 1} do procurado`} />
                  {i === 0 && <span className="foto__principal">PRINCIPAL</span>}
                  <button type="button" onClick={() => alterar('fotos', dados.fotos.filter((_, j) => j !== i))} aria-label={`Remover foto ${i + 1}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid-2">
            <Campo label="Nome completo do procurado" obrigatorio>
              <Entrada
                value={dados.nome}
                onChange={(e) => alterar('nome', e.target.value)}
                placeholder="Ex.: Carlos Alberto Ribeiro"
                className={erros.nome ? 'input--erro' : ''}
              />
            </Campo>
            <Campo label="ID RP do procurado" obrigatorio>
              <Entrada
                value={dados.idRp}
                onChange={(e) => alterar('idRp', e.target.value)}
                placeholder="Ex.: 22981"
                inputMode="numeric"
                className={erros.idRp ? 'input--erro' : ''}
              />
            </Campo>
          </div>
          <Campo label="Situação do mandado" obrigatorio dica="Aparece em destaque no cartaz enviado ao Discord.">
            <Selecao value={dados.status} onChange={(e) => alterar('status', e.target.value as StatusMandado)}>
              {(Object.keys(STATUS_MANDADO) as StatusMandado[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_MANDADO[s]}
                </option>
              ))}
            </Selecao>
          </Campo>
        </Cartao>

        <Cartao>
          <SecaoTitulo numero="02" titulo="Fundamento e origem" descricao="Base legal, processo e autoridade expedidora." />
          <Campo label="Artigos / tipificação" obrigatorio>
            <AreaTexto
              rows={3}
              value={dados.artigos}
              onChange={(e) => alterar('artigos', e.target.value)}
              placeholder="Ex.: Art. 121 — Homicídio Qualificado"
              className={erros.artigos ? 'input--erro' : ''}
            />
          </Campo>
          <Sugestoes titulo="Artigos frequentes" itens={ARTIGOS_SUGERIDOS} valor={dados.artigos} onChange={(v) => alterar('artigos', v)} />
          <Campo label="Fundamento do mandado" obrigatorio>
            <AreaTexto
              rows={3}
              value={dados.fundamento}
              onChange={(e) => alterar('fundamento', e.target.value)}
              placeholder="Ex.: Prisão preventiva decretada para garantia da ordem pública"
              className={erros.fundamento ? 'input--erro' : ''}
            />
          </Campo>
          <Sugestoes titulo="Fundamentos" itens={FUNDAMENTOS_SUGERIDOS} valor={dados.fundamento} onChange={(v) => alterar('fundamento', v)} separador=", " />
          <div className="grid-2">
            <Campo label="Processo / inquérito" dica="Opcional">
              <Entrada
                value={dados.processo}
                onChange={(e) => alterar('processo', e.target.value)}
                placeholder="0001234-56.2026.8.16.0001"
              />
            </Campo>
            <Campo label="Juízo / delegacia de origem" dica="Opcional">
              <Entrada
                value={dados.origem}
                onChange={(e) => alterar('origem', e.target.value)}
                placeholder="Ex.: 2ª Vara Criminal de Curitiba"
              />
            </Campo>
          </div>
          <Campo label="Autoridade que expediu" obrigatorio dica="Nome que aparece na assinatura do cartaz.">
            <Entrada
              value={dados.autoridade}
              onChange={(e) => alterar('autoridade', e.target.value)}
              placeholder="Ex.: Dr. Henrique Almeida"
              className={erros.autoridade ? 'input--erro' : ''}
            />
          </Campo>
        </Cartao>

        <Cartao>
          <SecaoTitulo numero="03" titulo="Cumprimento" descricao="Quem deve cumprir o mandado e por quanto tempo." />
          <Campo label="Unidade responsável pelo cumprimento" obrigatorio>
            <Selecao
              value={dados.unidade}
              onChange={(e) => alterar('unidade', e.target.value)}
              className={erros.unidade ? 'input--erro' : ''}
            >
              <option value="">Selecione a unidade...</option>
              {UNIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
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
          <div className="grid-2">
            <Campo label="Agente / equipe designada" dica="Opcional">
              <Entrada
                value={dados.agente}
                onChange={(e) => alterar('agente', e.target.value)}
                placeholder="Ex.: Equipe de Capturas"
              />
            </Campo>
            <Campo label="Validade / prazo" dica="Opcional">
              <Entrada
                value={dados.validade}
                onChange={(e) => alterar('validade', e.target.value)}
                placeholder="Até o efetivo cumprimento"
              />
              <Sugestoes titulo="Atalhos" itens={VALIDADES_SUGERIDAS} valor="" onChange={(v) => alterar('validade', v)} separador="|" />
            </Campo>
          </div>
          <Campo label="Observações" dica="Opcional — alertas, escolta, locais prováveis etc.">
            <AreaTexto
              rows={3}
              value={dados.observacoes}
              onChange={(e) => alterar('observacoes', e.target.value)}
              placeholder="Descreva detalhes para o cumprimento..."
            />
          </Campo>
          <AssinaturaPad
            valor={dados.assinatura}
            onChange={(v) => alterar('assinatura', v)}
            nomeEscrivao={dados.autoridade}
            rotulo="ASSINATURA DA AUTORIDADE"
          />
        </Cartao>

        <Cartao className="cartao--auto">
          <SecaoTitulo numero="04" titulo="Dia e data" descricao="Gerados automaticamente pelo sistema — não é necessário preencher." />
          <div className="auto-box">
            <div className="auto-box__icone"><Clock3 size={22} /></div>
            <div className="auto-box__dados">
              <div><span>DIA DA SEMANA</span><strong>{diaPorExtenso(timestamp)}</strong></div>
              <div><span>DATA</span><strong>{dataBR(timestamp)}</strong></div>
              <div><span>HORÁRIO</span><strong>{horaBR(timestamp)}</strong></div>
              <div><span>MANDADO Nº</span><strong>{numeroFicha}</strong></div>
            </div>
          </div>
          <p className="auto-box__nota">
            <Check size={14} /> {carimboCompleto(timestamp)} · horário de Brasília. Gerado no momento da expedição.
          </p>
        </Cartao>

        <div className="form-acoes">
          <Botao type="submit" variante="primario" icone={editando ? <Save size={18} /> : <FilePlus2 size={18} />} disabled={salvando}>
            {salvando ? 'SALVANDO...' : editando ? 'SALVAR ALTERAÇÕES' : 'EXPEDIR MANDADO'}
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

      <aside className="preview-col">
        <div className="preview-col__cabecalho">
          <div>
            <span className="preview-col__olho">PRÉVIA EM TEMPO REAL</span>
            <h3>Cartaz do mandado</h3>
          </div>
        </div>
        <div className="preview-col__ficha">
          {cartazUrl ? (
            <img className="preview-cartaz" src={cartazUrl} alt="Cartaz do mandado de prisão" />
          ) : (
            <div className="preview-carregando">{gerando ? 'Gerando cartaz...' : 'Prévia indisponível'}</div>
          )}
        </div>
        <div className="preview-col__acoes">
          <Botao variante="secundario" pequeno onClick={baixarCartaz} disabled={!cartazUrl}>
            Baixar cartaz PNG
          </Botao>
          <Botao variante="fantasma" pequeno onClick={() => onImprimir(cartazUrl)} disabled={!cartazUrl} icone={<Printer size={14} />}>
            Imprimir cartaz
          </Botao>
        </div>
        <p className="preview-col__nota">
          <Info size={14} /> Este é o cartaz enviado ao canal do Discord, no mesmo modelo institucional da ficha,
          com a assinatura da autoridade e dia/data gerados automaticamente.
        </p>
      </aside>
    </div>
  );
}
