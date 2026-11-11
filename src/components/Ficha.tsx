import type { Prisao } from '../types';
import { carimboCompleto, dataBR, dataHoraBR, diaPorExtenso, horaBR, textoOuTraco } from '../lib/format';

export type DadosFicha = Partial<Prisao> & { criadoEm: string };

function Item({
  rotulo,
  valor,
  largo = false,
}: {
  rotulo: string;
  valor?: string;
  largo?: boolean;
}) {
  return (
    <div className={`ficha__item ${largo ? 'ficha__item--largo' : ''}`}>
      <span className="ficha__rotulo">{rotulo}</span>
      <div className="ficha__valor">{textoOuTraco(valor)}</div>
    </div>
  );
}

/**
 * Ficha em papel branco com tinta preta (mesmo visual da impressão).
 * Usada na prévia ao vivo, no modal de detalhes e na impressão.
 */
export function Ficha({ dados, numero }: { dados: DadosFicha; numero?: string }) {
  const fotos = dados.fotos ?? [];
  const fotoPrincipal = fotos[0];

  return (
    <article className="ficha">
      <header className="ficha__topo">
        <img className="ficha__brasao" src="/brasao-pcpr.png" alt="Logo da Polícia Civil do Paraná" />
        <div className="ficha__identidade">
          <strong>POLÍCIA CIVIL DO PARANÁ</strong>
          <span>SECRETARIA DE SEGURANÇA PÚBLICA · SISTEMA RP</span>
          <span>REGISTRO DE PRISÕES E APREENSÕES</span>
        </div>
        <div className="ficha__marca">
          <b>PCPR</b>
          <i>RP</i>
        </div>
      </header>

      <div className="ficha__faixa">
        <span>FICHA DE REGISTRO DE PRISÃO</span>
        <b>Nº {numero || dados.numero || 'A GERAR'}</b>
      </div>

      <div className="ficha__corpo">
        <div className="ficha__perfil">
          <div className="ficha__foto">
            {fotoPrincipal ? (
              <img src={fotoPrincipal} alt={`Foto de ${dados.nome || 'custodiado'}`} />
            ) : (
              <div className="ficha__foto-vazia">
                <span>SEM</span>
                <span>FOTO</span>
              </div>
            )}
            {fotos.length > 1 && <span className="ficha__mais-fotos">+{fotos.length - 1} fotos</span>}
          </div>

          <div className="ficha__perfil-dados">
            <span className="ficha__rotulo">IDENTIFICAÇÃO DO CUSTODIADO</span>
            <h2 className="ficha__nome">{dados.nome?.trim() || 'Nome do custodiado'}</h2>
            <div className="ficha__id">
              <span>
                <b>ID RP</b> {textoOuTraco(dados.idRp)}
              </span>
              <span>
                <b>TEMPO DE PRISÃO</b> {textoOuTraco(dados.tempoPrisao)}
              </span>
            </div>

            <div className="ficha__auto">
              <div className="ficha__auto-tag">DIA E DATA · GERADOS AUTOMATICAMENTE</div>
              <div className="ficha__auto-grade">
                <div>
                  <span>DIA DA SEMANA</span>
                  <b>{diaPorExtenso(dados.criadoEm)}</b>
                </div>
                <div>
                  <span>DATA</span>
                  <b>{dataBR(dados.criadoEm)}</b>
                </div>
                <div>
                  <span>HORA</span>
                  <b>{horaBR(dados.criadoEm)}</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ficha__grade">
          <Item rotulo="ARTIGOS / ENQUADRAMENTO" valor={dados.artigos} largo />
          <Item rotulo="ITENS APREENDIDOS" valor={dados.itensApreendidos} largo />
          <Item rotulo="AGENTE QUE EFETUOU A PRISÃO" valor={dados.agente} />
          <Item rotulo="UNIDADE NA OCORRÊNCIA" valor={dados.unidade} />
          <Item rotulo="ESCRIVÃO RESPONSÁVEL" valor={dados.escrivao} />
          <Item rotulo="LOCAL DA OCORRÊNCIA" valor={dados.local} />
          <Item rotulo="OBSERVAÇÕES" valor={dados.observacoes} largo />
        </div>

        <div className="ficha__rodape">
          <p>
            Documento gerado automaticamente em <b>{dataHoraBR(dados.criadoEm)}</b> — horário de Brasília.{' '}
            <span>{carimboCompleto(dados.criadoEm)}</span>
          </p>
          <div className="ficha__assinatura">
            <span className="ficha__assinatura-titulo">ASSINATURA DO ESCRIVÃO</span>
            <div className="ficha__assinatura-conteudo">
              {dados.assinatura ? (
                <img
                  className="ficha__assinatura-img"
                  src={dados.assinatura}
                  alt={`Assinatura do escrivão ${dados.escrivao || ''}`}
                />
              ) : (
                <span className="ficha__assinatura-nome">{dados.escrivao?.trim() || 'Escrivão'}</span>
              )}
            </div>
            <div className="ficha__linha-assinatura" />
            <span>ESCRIVÃO · {textoOuTraco(dados.escrivao)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
