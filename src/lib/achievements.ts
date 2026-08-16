import { db } from "./db";
import { achievementsData, drawingsData } from "@/constants/drawingsData";
import { playAchievementSound } from "./sounds";

// Verifica se os achievements estão ativados
const isAchievementsEnabled = async (): Promise<boolean> => {
  return true; // sempre ativo por padrão
};

// Atualiza o progresso de uma conquista e a desbloqueia se atingir a meta
export const updateAchievementProgress = async (
  achievementId: string,
  newProgress: number
) => {
  if (!(await isAchievementsEnabled())) return;

  const config = achievementsData.find((a) => a.id === achievementId);
  if (!config) return;

  const current = await db.achievements.get(achievementId);
  const alreadyUnlocked = current?.unlocked === 1;

  if (alreadyUnlocked) return;

  const isUnlocked = newProgress >= config.targetCount ? 1 : 0;
  
  await db.achievements.put({
    id: achievementId,
    unlocked: isUnlocked,
    unlockedAt: isUnlocked ? Date.now() : undefined,
    progress: Math.min(newProgress, config.targetCount),
  });

  if (isUnlocked && !alreadyUnlocked) {
    // Toca som de conquista!
    playAchievementSound();
  }
};

// Gatilho: Desenho Concluído
export const triggerDrawingCompleted = async () => {
  try {
    const list = await db.paintings.toArray();
    const completedList = list.filter((p) => p.isCompleted === 1);
    const completedCount = completedList.length;

    // 1. Minha Primeira Pintura
    await updateAchievementProgress("first_painting", completedCount);

    // 2. Artista Iniciante (3)
    await updateAchievementProgress("beginner_artist", completedCount);

    // 3. Cinco Estrelas (5)
    await updateAchievementProgress("five_completed", completedCount);

    // 4. Mestre Pintor (10)
    await updateAchievementProgress("ten_completed", completedCount);

    // 5. Mestre das Cores (15)
    await updateAchievementProgress("color_master", completedCount);

    // 6. Coleção Completa
    // Verifica se completou todos os desenhos de QUALQUER uma das coleções (cada uma tem 4 desenhos, exceto patterns que tem 4 também)
    const collections = ["silhouettes", "stage", "dance", "fashion", "patterns"];
    for (const colId of collections) {
      const colDrawings = drawingsData.filter((d) => d.collectionId === colId).map(d => d.id);
      const colDrawingsCompleted = completedList.filter(p => colDrawings.includes(p.drawingId));
      if (colDrawingsCompleted.length >= colDrawings.length) {
        await updateAchievementProgress("collection_complete", 4);
        break; // encontrou uma completa, libera conquista
      }
    }
  } catch (e) {
    console.error("Erro ao processar conquista de desenho concluído", e);
  }
};

// Gatilho: Favorito Tocado
export const triggerFavoriteAdded = async () => {
  try {
    const list = await db.paintings.toArray();
    const favoritesCount = list.filter((p) => p.isFavorite === 1).length;

    // Explorador de Paletas (5 favoritos)
    await updateAchievementProgress("palette_explorer", favoritesCount);
  } catch (e) {}
};

// Gatilho: Dia ativo jogando
export const triggerDayActive = async () => {
  try {
    // Salvar o dia atual no settings e calcular o streak
    const today = new Date().toDateString();
    const lastActiveSetting = await db.settings.get("lastActiveDate");
    const streakSetting = await db.settings.get("activeDaysStreak");

    let streak = streakSetting ? streakSetting.value : 0;
    const lastActiveDate = lastActiveSetting ? lastActiveSetting.value : "";

    if (lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastActiveDate === yesterdayStr) {
        // Consecutivo! Incrementa
        streak += 1;
      } else {
        // Quebrou streak, reinicia
        streak = 1;
      }

      await db.settings.put({ key: "lastActiveDate", value: today });
      await db.settings.put({ key: "activeDaysStreak", value: streak });

      // Atualizar conquistas de dias
      await updateAchievementProgress("three_days_active", streak);
      await updateAchievementProgress("seven_days_active", streak);
    }
  } catch (e) {}
};
