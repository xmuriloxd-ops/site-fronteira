import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle, Check, ImagePlus, Trash2, X } from 'lucide-react';
import type { Denuncia, RascunhoDenuncia } from '../types';
import { CATEGORIAS, POSTOS, RELATO_SUGERIDO, UNIDADES } from '../data/opcoes';
import { comprimirImagem, dataBR } from '../lib/format';
import { AreaTexto, Botao, Campo, Cartao, Entrada, SecaoTitulo, Selecao, Sugestoes } from './ui';

interface Props {
  editando: Denuncia | null;
  numero: string;
  salvando: boolean;
  onSalvar: (dados: RascunhoDenuncia) => void;
  onCancelarEdicao: () => void;
  onAviso: (mensagem: string, tipo?: 'ok' | 'erro' | 'info') => void;
}

function rascunhoEmBranco(): RascunhoDenuncia {
  return {
    categoria: '',
    relato: '',
    local: '',
    dataFatos: new Date().toISOString().slice(0, 10),
    denunciadoNome: '',
    denunciadoPosto: '',
    denunciadoUnidade: '',
    anonima: true,
    denuncianteNome: '',
    denuncianteContato: '',
    fotos: [],
    situacao: 'aberta',
    parecer: '',
  };
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FormularioDenuncia({
  editando,
  numero,
  salvando,
  onSalvar,
  onCancelarEdicao,
  onAviso,
}: Props) {
  const [form, setForm] = useState<RascunhoDenuncia>(() =>
    editando
      ? {
          categoria: editando.categoria,
          relato: editando.relato,
          local: editando.local,
          dataFatos: editando.dataFatos || hojeISO(),
          denunciadoNome: editando.denunciadoNome,
          denunciadoPosto: editando.denunciadoPosto,
          denunciadoUnidade: editando.denunciadoUnidade,
          anonima: editando.anonima,
          denuncianteNome: editando.denuncianteNome,
          denuncianteContato: editando.denuncianteContato,
          fotos: [...editando.fotos],
          situacao: editando.situacao,
          parecer: editando.parecer,
        }
      : rascunhoEmBranco(),
  );
  const [erros, setErros] = useState<Record<string, boolean>>({});
  const [arrastando, setArrastando] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const inputArquivos = useRef<HTMLInputElement>(null);

  const alterar = <K extends keyof RascunhoDenuncia>(chave: K, valor: RascunhoDenuncia[K]) => {
    setForm((atual) => ({ ...atual, [chave]: valor }));
    if (erros[chave as string]) setErros((e) => ({ ...e, [chave as string]: false }));
  };

  const adicionarFotos = async (arquivos: FileList | File[]) => {
    const lista = Array.from(arquivos).filter((a) => a.type.startsWith('image/'));
    if (!lista.length) return;
    const espaço = 4 - form.fotos.length;
    if (espaço <= 0) {
      onAviso('O limite é de 4 evidências por denúncia.', 'erro');
      return;
    }
    setProcessandoFoto(true);
    try {
      const novas: string[] = [];
      for (const arquivo of lista.slice(0, espaço)) {
        novas.push(await comprimirImagem(arquivo, 1200, 0.8));
      }
      setForm((atual) => ({ ...atual, fotos: [...atual.fotos, ...novas] }));
    } catch {
      onAviso('Não foi possível processar uma das imagens.', 'erro');
    } finally {
      setProcessandoFoto(false);
    }
  };

  const removerFoto = (indice: number) => {
    setForm((atual) => ({ ...atual, fotos: atual.fotos.filter((_, i) => i !== indice) }));
  };

  const validar = (): boolean => {
    const novos: Record<string, boolean> = {};
    if (!form.categoria) novos.categoria = true;
    if (form.relato.trim().length < 30) novos.relato = true;
    setErros(novos);
    if (Object.keys(novos).length) {
      onAviso('Preencha a natureza da denúncia e descreva os fatos com pelo menos 30 caracteres.', 'erro');
      return false;
    }
    return true;
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!validar()) return;
    onSalvar({
      ...form,
      relato: form.relato.trim(),
      local: form.local.trim(),
      denunciadoNome: form.denunciadoNome.trim(),
      denuncianteNome: form.anonima ? '' : form.denuncianteNome.trim(),
      denuncianteContato: form.anonima ? '' : form.denuncianteContato.trim(),
    });
  };

  const limpar = () => {
    setForm(rascunhoEmBranco());
    setErros({});
  };

  const ProtocoloBox = (
    <div className="auto-box">
      <div className="auto-box__icone">
        <Check size={26} />
      </div>
      <div className="auto-box__dados">
        <div>
          <span>PROTOCOLO</span>
          <strong>{numero}</strong>
        </div>
        <div>
          <span>DATA DO REGISTRO</span>
          <strong>{dataBR()}</strong>
        </div>
        <div>
          <span>DENÚNCIA</span>
          <strong>{form.anonima ? 'ANÔNIMA' : 'IDENTIFICADA'}</strong>
        </div>
        <div>
          <span>EVIDÊNCIAS</span>
          <strong>
            {form.fotos.length}/4 {form.fotos.length ? 'ANEXADAS' : 'SEM FOTO'}
          </strong>
        </div>
      </div>
      <p className="auto-box__nota">
        <AlertTriangle size={14} />
        {editando
          ? 'Edição do protocolo existente — os dados abaixo atualizam o registro.'
          : 'Número gerado automaticamente no ato do protocolamento. Dia, data e hora são registrados no servidor.'}
      </p>
    </div>
  );

  return (
    <form className="form-layout" onSubmit={enviar} noValidate>
      <div className="form-col">
        {editando && (
          <div className="aviso-edicao">
            <span>
              Editando o protocolo <b>{editando.numero}</b>. As alterações ficam registradas com nova data de
              acompanhamento.
            </span>
            <button type="button" onClick={onCancelarEdicao} title="Cancelar edição">
              <X size={16} />
            </button>
          </div>
        )}

        <Cartao>
          <SecaoTitulo
            numero="01"
            titulo="Natureza da denúncia"
            descricao="Escolha o tipo de irregularidade denunciada. A corregedoria pode reclassificar após análise."
          />
          <Campo
            label="Natureza"
            obrigatorio
            dica={erros.categoria ? undefined : 'Selecione a opção mais próxima do fato.'}
          >
            <Selecao
              value={form.categoria}
              className={erros.categoria ? 'input--erro' : ''}
              onChange={(e) => alterar('categoria', e.target.value)}
            >
              <option value="">— Selecione a natureza —</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Selecao>
          </Campo>
          {erros.categoria && <span className="campo__erro">Selecione a natureza da denúncia.</span>}

          <Campo label="Local dos fatos" dica="Endereço, bairro ou ponto de referência.">
            <Entrada
              value={form.local}
              onChange={(e) => alterar('local', e.target.value)}
              placeholder="Ex.: Av. Sete de Setembro, Centro — Curitiba"
              maxLength={300}
            />
          </Campo>

          <div className="grid-2">
            <Campo label="Data dos fatos" dica="Quando ocorreu o fato.">
              <Entrada
                type="date"
                value={form.dataFatos}
                max={hojeISO()}
                onChange={(e) => alterar('dataFatos', e.target.value)}
              />
            </Campo>
            <Campo label="Evidências (até 4 fotos)" dica="Prints, fotos ou vídeos convertidos em imagem.">
              <div className={`upload ${arrastando ? 'upload--arrastando' : ''}`}>
                <div className="upload__icone">
                  <ImagePlus size={24} />
                </div>
                <div className="upload__textos">
                  <strong>{processandoFoto ? 'Processando...' : 'Anexar evidências'}</strong>
                  <span>Arraste ou clique — JPG/PNG, comprimidas no navegador</span>
                </div>
                <Botao
                  type="button"
                  variante="fantasma"
                  pequeno
                  onClick={() => inputArquivos.current?.click()}
                  disabled={processandoFoto || form.fotos.length >= 4}
                >
                  Escolher
                </Botao>
                <input
                  ref={inputArquivos}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => {
                    if (e.target.files) void adicionarFotos(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>
            </Campo>
          </div>

          {form.fotos.length > 0 && (
            <div className="fotos">
              {form.fotos.map((foto, i) => (
                <div className="foto" key={i}>
                  <img src={foto} alt={`Evidência ${i + 1}`} />
                  {i === 0 && <span className="foto__principal">1ª</span>}
                  <button type="button" onClick={() => removerFoto(i)} title="Remover evidência">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Cartao>

        <Cartao>
          <SecaoTitulo
            numero="02"
            titulo="Relato dos fatos"
            descricao="Descreva o que aconteceu: quem, o quê, quando e onde. Quanto mais detalhes, melhor a apuração."
          />
          <Campo
            label="Relato"
            obrigatorio
            dica={erros.relato ? undefined : 'Mínimo de 30 caracteres. Seja objetivo e use datas e horários.'}
          >
            <AreaTexto
              value={form.relato}
              className={erros.relato ? 'input--erro' : ''}
              onChange={(e) => alterar('relato', e.target.value)}
              rows={8}
              maxLength={4000}
              placeholder="Descreva detalhadamente os fatos denunciados..."
            />
          </Campo>
          {erros.relato && (
            <span className="campo__erro">Descreva os fatos com pelo menos 30 caracteres.</span>
          )}
          <Sugestoes
            titulo="Modelos de abertura"
            itens={RELATO_SUGERIDO}
            valor={form.relato}
            onChange={(v) => alterar('relato', v)}
          />
        </Cartao>
      </div>

      <div className="form-col">
        <Cartao className="cartao--auto">{ProtocoloBox}</Cartao>

        <Cartao>
          <SecaoTitulo
            numero="03"
            titulo="Denunciado"
            descricao="Identifique o militar, se possível. Se não souber, descreva aparência, viatura ou posto."
          />
          <Campo label="Nome ou descrição" dica="Ex.: “Sargento Almeida” ou “militar sem identificação, viatura 4512”.">
            <Entrada
              value={form.denunciadoNome}
              onChange={(e) => alterar('denunciadoNome', e.target.value)}
              placeholder="Nome, apelido de guerra ou descrição"
              maxLength={200}
            />
          </Campo>
          <div className="grid-2">
            <Campo label="Posto / graduação">
              <Selecao
                value={form.denunciadoPosto}
                onChange={(e) => alterar('denunciadoPosto', e.target.value)}
              >
                <option value="">— Não sei —</option>
                {POSTOS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo label="Unidade / OPM">
              <Entrada
                value={form.denunciadoUnidade}
                onChange={(e) => alterar('denunciadoUnidade', e.target.value)}
                placeholder="Ex.: 3º BPM"
                list="unidades-pmpr"
                maxLength={200}
              />
              <datalist id="unidades-pmpr">
                {UNIDADES.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </Campo>
          </div>
        </Cartao>

        <Cartao>
          <SecaoTitulo
            numero="04"
            titulo="Denunciante"
            descricao="A denúncia pode ser anônima — a identidade não aparece no canal do Discord nem nas listas."
          />
          <div className="interruptores">
            <div className="interruptor">
              <div>
                <strong>Denúncia anônima</strong>
                <span>Recomendado: preserva a sua identidade na apuração.</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.anonima}
                aria-label="Denúncia anônima"
                className={`interruptor__pista ${form.anonima ? 'interruptor__pista--ligada' : ''}`}
                onClick={() => alterar('anonima', !form.anonima)}
              >
                <span />
              </button>
            </div>
          </div>
          {!form.anonima && (
            <>
              <Campo label="Seu nome" dica="Opcional — usado apenas para retorno do caso.">
                <Entrada
                  value={form.denuncianteNome}
                  onChange={(e) => alterar('denuncianteNome', e.target.value)}
                  placeholder="Como você quer ser chamado"
                  maxLength={200}
                />
              </Campo>
              <Campo label="Seu contato" dica="Opcional — Discord, telefone ou e-mail para retorno.">
                <Entrada
                  value={form.denuncianteContato}
                  onChange={(e) => alterar('denuncianteContato', e.target.value)}
                  placeholder="Ex.: @usuario · (41) 9xxxx-xxxx"
                  maxLength={200}
                />
              </Campo>
            </>
          )}
        </Cartao>

        <div className="form-acoes">
          <Botao type="submit" variante="primario" icone={<Check size={17} />} disabled={salvando}>
            {salvando ? 'PROTOCOLANDO...' : editando ? 'SALVAR ALTERAÇÕES' : 'PROTOCOLAR DENÚNCIA'}
          </Botao>
          <Botao type="button" variante="fantasma" onClick={limpar} disabled={salvando}>
            Limpar campos
          </Botao>
        </div>
        <p className="form-nota">
          Ao protocolar, você declara que as informações são verdadeiras, salvo melhor juízo. Denúncias caluniosas
          podem acarretar responsabilização. Ambiente de roleplay — sem vínculo com órgãos oficiais.
        </p>
      </div>
    </form>
  );
}
