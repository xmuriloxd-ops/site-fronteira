export type PageId = 'inicio' | 'edital' | 'galeria' | 'identidade' | 'jogo';

export interface Photo {
  id: string;
  src: string;
  title: string;
  caption: string;
}

export interface Palette {
  ink: string;
  ink2: string;
  brand: string;
  brandSoft: string;
  gold: string;
  alert: string;
  paper: string;
}

export interface SiteConfig {
  sigla: string;
  nome: string;
  unidade: string;
  cidade: string;
  slogan: string;
  logoDataUrl: string | null;
  palette: Palette;
  photos: Photo[];
  edital: {
    numero: string;
    ano: string;
    abertura: string;
    encerramento: string;
    prova: string;
    vagas: string;
    vagasReserva: string;
    taxa: string;
    link: string;
    banca: string;
    local: string;
    cargaHoraria: string;
  };
  requisitos: string[];
  etapas: { titulo: string; descricao: string; peso: string }[];
  avisos: string[];
}

export const PALETTE_PRESETS: { nome: string; descricao: string; palette: Palette }[] = [
  {
    nome: 'Noite Operacional',
    descricao: 'Azul profundo, dourado e vermelho — padrão RONE',
    palette: {
      ink: '#070c14',
      ink2: '#0d1522',
      brand: '#123a63',
      brandSoft: '#1d5488',
      gold: '#c8a04a',
      alert: '#b81f2b',
      paper: '#e9eef4',
    },
  },
  {
    nome: 'Aço e Prata',
    descricao: 'Grafite com prata e azul gelo',
    palette: {
      ink: '#0b0e11',
      ink2: '#161b21',
      brand: '#2b3a48',
      brandSoft: '#57718a',
      gold: '#9fb3c8',
      alert: '#c0392b',
      paper: '#eef2f5',
    },
  },
  {
    nome: 'Selva',
    descricao: 'Verde-oliva com areia e bronze',
    palette: {
      ink: '#0c110c',
      ink2: '#151d15',
      brand: '#2f4429',
      brandSoft: '#4b6b3f',
      gold: '#c2a878',
      alert: '#a8341f',
      paper: '#e8ead9',
    },
  },
  {
    nome: 'Camuflado Urbano',
    descricao: 'Cinza chumbo com laranja de sinalização',
    palette: {
      ink: '#111215',
      ink2: '#1b1d22',
      brand: '#3b3f46',
      brandSoft: '#5d636d',
      gold: '#e08a2e',
      alert: '#d0432f',
      paper: '#f0f1f3',
    },
  },
  {
    nome: 'Azul Instrução',
    descricao: 'Azul PM, branco e dourado claro',
    palette: {
      ink: '#08131f',
      ink2: '#0f2135',
      brand: '#14497a',
      brandSoft: '#2b6ca3',
      gold: '#e0c078',
      alert: '#a5212c',
      paper: '#f2f6fa',
    },
  },
];

const seedPhotos = (): Photo[] => [
  {
    id: 'p1',
    src: '/images/hero-viatura.jpg',
    title: 'Viatura de patrulhamento',
    caption: 'Pronta-resposta noturna — substitua por uma foto oficial.',
  },
  {
    id: 'p2',
    src: '/images/operacao.jpg',
    title: 'Operação ostensiva',
    caption: 'Equipe em deslocamento tático.',
  },
  {
    id: 'p3',
    src: '/images/treinamento.jpg',
    title: 'Deslocamento em comboio',
    caption: 'Coordenação e disciplina de fração.',
  },
  {
    id: 'p4',
    src: '/images/equipamento.jpg',
    title: 'Equipamento individual',
    caption: 'Material de proteção e comunicação.',
  },
];

export const DEFAULT_CONFIG: SiteConfig = {
  sigla: 'RONE',
  nome: 'Rondas Ostensivas de Natureza Especial',
  unidade: 'Batalhão de Operações Especiais · Polícia Militar do Paraná',
  cidade: 'Curitiba / PR',
  slogan: 'Presença que intimida. Disciplina que protege.',
  logoDataUrl: null,
  palette: PALETTE_PRESETS[0].palette,
  photos: seedPhotos(),
  edital: {
    numero: 'ED-03/2026',
    ano: '2026',
    abertura: '2026-12-01',
    encerramento: '2027-01-15',
    prova: '2027-02-08',
    vagas: '60',
    vagasReserva: '20',
    taxa: 'R$ 90,00',
    link: 'https://www.pmpr.pr.gov.br',
    banca: 'Comissão de Concursos PMPR',
    local: 'Escola de Formação de Oficiais — Curitiba/PR',
    cargaHoraria: '420 horas (C-RONE)',
  },
  requisitos: [
    'Ser brasileiro(a), com direitos políticos em dia.',
    'Ter entre 21 e 35 anos na data da matrícula no curso.',
    'Altura mínima de 1,65 m (masculino) e 1,60 m (feminino), conforme norma vigente.',
    'Escolaridade mínima: ensino médio completo.',
    'Estar quite com as obrigações militares e eleitorais.',
    'Possuir Carteira Nacional de Habilitação, no mínimo categoria B.',
    'Não possuir antecedentes criminais incompatíveis com a função.',
    'Aptidão física e sanitária comprovada em inspeção oficial.',
    'Ter concluído com aproveitamento o estágio operacional da unidade.',
  ],
  etapas: [
    {
      titulo: 'Pré-inscrição online',
      descricao:
        'Envio de dados pessoais, anexo da documentação digitalizada e pagamento da taxa de inscrição.',
      peso: 'Eliminatória',
    },
    {
      titulo: 'Inspeção de saúde',
      descricao:
        'Avaliação clínica, oftalmológica, odontológica e toxicológica realizada por junta designada.',
      peso: 'Eliminatória',
    },
    {
      titulo: 'Teste de aptidão física — TAF',
      descricao:
        'Corrida de 2.400 m, flexões, abdominais e teste de força de preensão, conforme tabela do edital.',
      peso: 'Eliminatória',
    },
    {
      titulo: 'Avaliação psicológica',
      descricao:
        'Bateria de testes aplicada por equipe de psicologia, com entrevista técnica complementar.',
      peso: 'Eliminatória',
    },
    {
      titulo: 'Prova de tiro e tática',
      descricao:
        'Tiro defensivo, manejo de armamento, técnicas de entrada e abordagem de alto risco.',
      peso: 'Classificatória',
    },
    {
      titulo: 'Investigação social e documental',
      descricao: 'Análise de idoneidade, certidões e verificação de conduta funcional.',
      peso: 'Eliminatória',
    },
    {
      titulo: 'Curso C-RONE',
      descricao:
        'Formação específica com carga horária integral, regime de internato e avaliação contínua.',
      peso: 'Classificatória',
    },
  ],
  avisos: [
    'Este é um site demonstrativo e não substitui publicação oficial. Consulte sempre o Diário Oficial.',
    'Envie suas fotos, logos e cores na aba "Galeria" e "Identidade Visual" — tudo é salvo no seu navegador.',
    'As datas e o número de vagas acima são exemplos e podem ser editados no painel de configuração.',
  ],
};

const STORAGE_KEY = 'rone.site.config.v3';

export function loadConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      edital: { ...DEFAULT_CONFIG.edital, ...(parsed.edital ?? {}) },
      palette: { ...DEFAULT_CONFIG.palette, ...(parsed.palette ?? {}) },
      photos: Array.isArray(parsed.photos) && parsed.photos.length ? parsed.photos : DEFAULT_CONFIG.photos,
      requisitos: parsed.requisitos?.length ? parsed.requisitos : DEFAULT_CONFIG.requisitos,
      etapas: parsed.etapas?.length ? parsed.etapas : DEFAULT_CONFIG.etapas,
      avisos: parsed.avisos?.length ? parsed.avisos : DEFAULT_CONFIG.avisos,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: SiteConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Não foi possível salvar a configuração (armazenamento cheio?).', err);
  }
}

export function applyPalette(palette: Palette) {
  const root = document.documentElement;
  root.style.setProperty('--c-ink', palette.ink);
  root.style.setProperty('--c-ink-2', palette.ink2);
  root.style.setProperty('--c-brand', palette.brand);
  root.style.setProperty('--c-brand-soft', palette.brandSoft);
  root.style.setProperty('--c-gold', palette.gold);
  root.style.setProperty('--c-alert', palette.alert);
  root.style.setProperty('--c-paper', palette.paper);
}

/** Lê um arquivo de imagem, redimensiona e devolve um dataURL leve. */
export function fileToOptimizedDataUrl(file: File, maxSize = 1500, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem (JPG, PNG ou WEBP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponível neste navegador.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const keepAlpha = file.type === 'image/png' && maxSize <= 700;
        resolve(canvas.toDataURL(keepAlpha ? 'image/png' : 'image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
