import Dexie, { type Table } from "dexie";

export interface Painting {
  id: string; // ID único (ex: 'silhouette_1_1723790123')
  drawingId: string; // ID do desenho base (ex: 'silhouette_1')
  title: string; // Título customizado (ex: 'Meu Astro Colorido 1')
  canvasData: string; // Data URL (Base64) da imagem pintada
  progress: number; // Porcentagem concluída (0 a 100)
  isFavorite: number; // 0 ou 1
  isCompleted: number; // 0 ou 1
  completedAt?: number; // Timestamp
  updatedAt: number; // Timestamp
}

export interface UserAchievement {
  id: string; // Código da conquista (ex: 'first_painting')
  unlocked: number; // 0 ou 1
  unlockedAt?: number; // Timestamp
  progress: number; // Progresso atual
}

export interface AppSetting {
  key: string; // Chave da configuração
  value: any; // Valor
}

class MJColorDatabase extends Dexie {
  paintings!: Table<Painting, string>;
  achievements!: Table<UserAchievement, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super("MJColorDatabase");
    this.version(1).stores({
      paintings: "id, drawingId, progress, isFavorite, isCompleted, updatedAt",
      achievements: "id, unlocked",
      settings: "key",
    });
  }
}

export const db = new MJColorDatabase();
export { Dexie };
