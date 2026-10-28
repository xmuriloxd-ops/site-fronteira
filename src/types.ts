export interface Post {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  location?: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  url: string;
  caption: string;
  tag: string;
  author: string;
  createdAt: string;
}

export interface Settings {
  siteName: string;
  unit: string;
  server: string;
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  instagram: string;
  discord: string;
  email: string;
  whatsapp: string;
  heroImage: string;
  foundedYear: string;
}

export interface Bootstrap {
  settings: Settings;
  posts: Post[];
  photos: Photo[];
}

export interface AdminSession {
  token: string;
  user: { username: string; role: string };
}

export interface AccessLog {
  id: string;
  timestamp: string;
  path: string;
  userAgent: string;
  ip: string;
  referrer: string;
}

export const CATEGORIES = ['Operação', 'Notícia', 'Curso', 'Formatura', 'Comunicado'] as const;

export const PHOTO_TAGS = ['Operacional', 'Treinamento', 'Curso', 'Formatura', 'Comunidade'] as const;
