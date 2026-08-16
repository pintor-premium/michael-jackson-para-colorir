"use client";

import { Trophy, Award, Palette, Brush, Star, Heart, Moon, Calendar, Flame, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { achievementsData } from "@/constants/drawingsData";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

const iconMap: Record<string, any> = {
  Palette,
  Brush,
  Star,
  Trophy,
  Heart,
  Moon,
  Award,
  Calendar,
  Flame,
  Sparkles,
};

export default function AchievementsPage() {
  // Buscar conquistas desbloqueadas locais
  const achievementsState = useLiveQuery(async () => {
    const list = await db.achievements.toArray();
    const map: Record<string, { unlocked: number; progress: number; unlockedAt?: number }> = {};
    list.forEach((a) => {
      map[a.id] = {
        unlocked: a.unlocked,
        progress: a.progress,
        unlockedAt: a.unlockedAt,
      };
    });
    return map;
  });

  const dbMap = achievementsState ?? {};

  // Contagem de conquistas concluídas
  const totalCount = achievementsData.length;
  const unlockedCount = Object.values(dbMap).filter((a) => a.unlocked === 1).length;

  return (
    <div className="space-y-8">
      {/* Header and Banner */}
      <section className="bg-gradient-to-r from-gold/10 via-bg-card to-purple/10 rounded-3xl p-6 md:p-8 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <h2 className="text-3xl font-bold font-fredoka text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-gold animate-bounce" />
            Minhas Conquistas
          </h2>
          <p className="text-gray-400 text-sm max-w-xl font-sans">
            Cada desenho que você colore com carinho ajuda a liberar troféus! Quantos você consegue colecionar?
          </p>
        </div>

        {/* Progress Circular/Badge */}
        <div className="shrink-0 bg-bg-dark/60 border border-gray-800 rounded-2xl px-6 py-4 text-center min-w-[140px] z-10">
          <p className="text-xs text-gray-500 font-fredoka font-semibold uppercase tracking-wider">Progresso</p>
          <p className="text-4xl font-extrabold font-fredoka text-gold mt-1">
            {unlockedCount}<span className="text-xl text-gray-500">/{totalCount}</span>
          </p>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gold h-full rounded-full transition-all duration-300"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Achievements List */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievementsData.map((item) => {
          const dbItem = dbMap[item.id];
          const isUnlocked = dbItem?.unlocked === 1;
          const currentProgress = dbItem?.progress ?? 0;
          
          const IconComponent = iconMap[item.iconName] || Award;
          
          return (
            <div
              key={item.id}
              className={`bg-bg-card border rounded-3xl p-6 shadow-md flex items-start gap-5 transition-all card-kid relative overflow-hidden ${
                isUnlocked
                  ? "border-gold/30 hover:border-gold/50"
                  : "border-gray-800 hover:border-gray-700 opacity-80"
              }`}
            >
              {/* Achievement Icon */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 relative ${
                  isUnlocked
                    ? "bg-gold/15 text-gold border border-gold/20"
                    : "bg-bg-dark text-gray-600 border border-gray-800"
                }`}
              >
                <IconComponent className="w-9 h-9" />
                {!isUnlocked && (
                  <div className="absolute -bottom-1 -right-1 bg-bg-dark border border-gray-800 rounded-full p-1 text-gray-500">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Description & Progress */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-lg font-bold font-fredoka leading-tight ${isUnlocked ? "text-gold" : "text-white"}`}>
                    {item.name}
                  </h4>
                  {isUnlocked && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-accent bg-green-accent/15 px-2 py-0.5 rounded-full font-fredoka shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Liberado
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs font-sans leading-relaxed">
                  {item.description}
                </p>

                {/* Progress bar inside */}
                {!isUnlocked && item.targetCount > 1 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-fredoka font-semibold">
                      <span>Progresso</span>
                      <span>{currentProgress}/{item.targetCount}</span>
                    </div>
                    <div className="w-full bg-bg-dark border border-gray-850 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, (currentProgress / item.targetCount) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {isUnlocked && dbItem?.unlockedAt && (
                  <p className="text-[10px] text-gray-500 font-sans mt-2">
                    Desbloqueado em: {new Date(dbItem.unlockedAt).toLocaleDateString("pt-BR")} às {new Date(dbItem.unlockedAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
