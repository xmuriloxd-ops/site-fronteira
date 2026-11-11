/** Listas de apoio ao preenchimento (sugestões rápidas, não obrigatórias). */

export const UNIDADES = [
  'Delegacia de Polícia Civil — Plantão',
  '1ª Delegacia de Polícia',
  'COPE — Centro de Operações Policiais Especiais',
  'DENARC — Delegacia de Narcóticos',
  'DEIC — Delegacia de Crimes Econômicos',
  'DHPP — Delegacia de Homicídios',
  'Delegacia de Furtos e Roubos',
  'Delegacia de Crimes de Trânsito',
  'Delegacia da Mulher',
  'Núcleo de Investigações',
  'Polícia Judiciária — PJe',
  'Outra unidade',
];

export const ARTIGOS_SUGERIDOS = [
  'Art. 33 — Tráfico de Drogas',
  'Art. 35 — Associação para o Tráfico',
  'Art. 155 — Furto',
  'Art. 157 — Roubo',
  'Art. 158 — Extorsão',
  'Art. 180 — Receptação',
  'Art. 121 — Homicídio',
  'Art. 129 — Lesão Corporal',
  'Art. 12 — Porte Ilegal de Arma de Fogo',
  'Art. 16 — Posse de Arma de Uso Restrito',
  'Art. 306 — Embriaguez ao Volante (CTB)',
  'Art. 330 — Desobediência',
  'Art. 331 — Desacato',
  'Art. 340 — Comunicação Falsa de Crime',
];

export const ITENS_SUGERIDOS = [
  'Arma de fogo',
  'Munições',
  'Entorpecentes',
  'Dinheiro em espécie',
  'Celular',
  'Rádio comunicador',
  'Veículo',
  'Documentos',
  'Ferramentas',
  'Colete balístico',
  'Chaves',
  'Objetos pessoais',
];

export const FUNDAMENTOS_SUGERIDOS = [
  'Prisão preventiva para garantia da ordem pública',
  'Prisão preventiva por conveniência da instrução criminal',
  'Mandado de prisão definitiva após sentença condenatória',
  'Descumprimento de medidas cautelares diversas da prisão',
  'Procurado foragido, não localizado para citação',
  'Regime fechado — mandado de recolhimento',
];

export const VALIDADES_SUGERIDAS = [
  'Até o efetivo cumprimento ou revogação',
  'Prazo indeterminado',
  '30 dias',
  '60 dias',
  '90 dias',
];

export const TEMPOS_SUGERIDOS = [
  '15 minutos',
  '30 minutos',
  '1 hora',
  '2 horas',
  '6 horas',
  '12 horas',
  '24 horas',
  'Prisão preventiva',
  'Prisão perpétua (RP)',
];

/** Acrescenta uma sugestão sem duplicar e sem apagar o que já foi digitado. */
export function anexarSugestao(atual: string, sugestao: string, separador = '\n'): string {
  const limpo = atual.trim();
  if (!limpo) return sugestao;
  if (limpo.split(separador).some((parte) => parte.trim() === sugestao)) return atual;
  return `${limpo.replace(/\s+$/, '')}${separador}${sugestao}`;
}
