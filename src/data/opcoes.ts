/** Listas de apoio ao preenchimento (sugestões rápidas, não obrigatórias). */

/** Natureza da denúncia. */
export const CATEGORIAS = [
  'Conduta em serviço',
  'Abuso de autoridade',
  'Desrespeito ao cidadão',
  'Uso indevido de arma de fogo',
  'Assédio (moral ou sexual)',
  'Discriminação / racismo',
  'Negligência ou descumprimento de ordem',
  'Tráfico de influência',
  'Conduta fora do serviço',
  'Outro',
];

/** Postos e graduações da PMPR. */
export const POSTOS = [
  'Soldado PM',
  'Cabo PM',
  'Sargento PM',
  'Subtenente',
  'Tenente',
  'Capitão',
  'Major',
  'Tenente-Coronel',
  'Coronel',
  'Não sei informar',
];

/** Unidades / OPMs da Polícia Militar do Paraná. */
export const UNIDADES = [
  '1º BPM',
  '2º BPM',
  '3º BPM',
  '4º BPM',
  '5º BPM',
  '6º BPM',
  '7º BPM',
  'GEPAR — Grupo Especial de Policiamento',
  'CIOP — Centro Integrado de Operações Policiais',
  'Academia de Polícia Militar',
  'Corregedoria-Geral',
  'Comando Geral',
  'Outra unidade',
];

/** Trechos sugeridos para abrir o relato dos fatos. */
export const RELATO_SUGERIDO = [
  'Em ' + '____/____/______, por volta das ____h,',
  'O(s) militar(es) estava(m) em serviço,',
  'Testemunhas presentes:',
  'Há registro de vídeo/foto:',
  'O fato foi presenciado por mim em:',
];

/** Acrescenta uma sugestão sem duplicar e sem apagar o que já foi digitado. */
export function anexarSugestao(atual: string, sugestao: string, separador = '\n'): string {
  const limpo = atual.trim();
  if (!limpo) return sugestao;
  if (limpo.split(separador).some((parte) => parte.trim() === sugestao)) return atual;
  return `${limpo.replace(/\s+$/, '')}${separador}${sugestao}`;
}
