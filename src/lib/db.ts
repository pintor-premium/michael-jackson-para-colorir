import Dexie, { type Table } from "dexie";

export interface Painting {
  id: string;
  drawingId: string;
  baseImagePath?: string;
  title: string;
  canvasData: string;
  progress: number;
  isFavorite: number;
  isCompleted: number;
  completedAt?: number;
  updatedAt: number;
}

export interface UserAchievement {
  id: string;
  unlocked: number;
  unlockedAt?: number;
  progress: number;
}

export interface AppSetting {
  key: string;
  value: any;
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
