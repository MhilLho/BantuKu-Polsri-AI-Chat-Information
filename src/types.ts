export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'model';
  content: string;
  sources?: string[];
  timestamp: string;
  feedback?: 'like' | 'dislike' | null;
  feedbackSubmitted?: boolean;
  likedWithHeart?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageItem[];
}

export interface QuickQuestion {
  id: string;
  title: string;
  description: string;
  category: 'surat' | 'registrasi' | 'ukt' | 'cuti' | 'umum';
  prompt: string;
}

export interface PolsriInfo {
  institution: string;
  campus: string;
  address: string;
  units: {
    akademik: {
      name: string;
      location: string;
      hours: string;
      email: string;
      phone: string;
    };
    keuangan: {
      name: string;
      location: string;
      email: string;
    };
    portal?: {
      name: string;
      url: string;
    };
    website: string;
  };
}

export interface CampusDocument {
  id: string;
  title: string;
  docNumber: string;
  category: 'peraturan' | 'sop' | 'ukt' | 'kalender' | 'beasiswa' | 'surat_edaran' | 'lainnya';
  effectiveDate: string;
  summary: string;
  content: string;
  sourceUrl?: string;
  isBuiltIn?: boolean;
}

