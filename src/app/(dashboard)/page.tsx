"use client";

import Link from "next/link";
import { Play, Sparkles, Trophy, Star, ArrowRight, Heart, Palette } from "lucide-react";
import { appConfig } from "@/constants/appConfig";
import { db } from "@/lib/db";
import { drawingsData, drawingsData as allDrawings } from "@/constants/drawingsData";
import { useLiveQuery } from "dexie-react-hooks";

export default function HomePage() {
  const state = useLiveQuery(async () => {
    const allPaintings = await db.paintings.toArray();
    const completedCount = allPaintings.filter((p) => p.isCompleted === 1).length;
    const favoriteDrawingIds = allPaintings.filter((p) => p.isFavorite === 1).map((p) => p.drawingId);

    // Encontrar o último em andamento
    const inProgress = allPaintings
      .filter((p) => p.isCompleted === 0 && p.canvasData !== "")
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];

    const inProgressDrawing = inProgress
      ? allDrawings.find((d) => d.id === inProgress.drawingId)
      : null;

    // Buscar conquistas desbloqueadas
    const allAchievements = await db.achievements.toArray();
    const unlockedAchievementsCount = allAchievements.filter((a) => a.unlocked === 1).length;

    return {
      completedCount,
      favoriteDrawingIds,
      inProgress: inProgress
        ? {
            ...inProgress,
            drawing: inProgressDrawing,
          }
        : null,
      unlockedAchievementsCount,
    };
  });

  const completedCount = state?.completedCount ?? 0;
  const inProgress = state?.inProgress ?? null;
  const favoriteDrawingIds = state?.favoriteDrawingIds ?? [];
  const unlockedAchievementsCount = state?.unlockedAchievementsCount ?? 0;

  // Selecionar 3 desenhos recomendados
  const recommendedDrawings = drawingsData
    .filter((d) => d.status === "active")
    .slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Hero Welcome Banner */}
      <section className="bg-gradient-to-r from-purple/30 via-bg-card to-blue-accent/20 rounded-3xl p-6 md:p-10 border border-gray-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-accent opacity-10 rounded-full blur-3xl -ml-10 -mb-10"></div>

        <div className="relative z-10 text-center md:text-left space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-purple/30 text-purple border border-purple/40 px-4 py-2 rounded-full text-sm font-fredoka font-semibold shadow-inner animate-bounce">
            <Sparkles className="w-4 h-4 text-yellow-accent" />
            {appConfig.welcomeMessage}
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-fredoka text-white leading-tight">
            Pronto para soltar a sua imaginação?
          </h2>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Pinte poses, roupas brilhosas e sapatos de dança com as cores do arco-íris. É hora de fazer mágica artística!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/drawings"
              className="bg-purple hover:bg-purple/90 text-white font-fredoka text-lg font-bold px-8 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple/20 transition-all duration-200 btn-kid scale-102 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Começar a colorir
            </Link>
          </div>
        </div>

        {/* Mascot / Creative abstract art placeholder */}
        <div className="relative shrink-0 w-full max-w-[260px] aspect-square rounded-2xl bg-bg-dark border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden card-kid">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple/10 to-blue-accent/10"></div>
          <div className="text-center p-6 space-y-2">
            <div className="w-16 h-16 rounded-full bg-purple/20 mx-auto flex items-center justify-center text-purple mb-2">
              <Star className="w-8 h-8 text-gold fill-current" />
            </div>
            <p className="font-fredoka text-sm text-gray-300 font-semibold">{appConfig.appName} Color</p>
            <p className="text-xs text-gray-500 font-sans">Desenhos prontos para você colorir offline!</p>
          </div>
        </div>
      </section>

      {/* Stats and Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Completed drawings */}
        <div className="bg-bg-card border border-gray-800 p-6 rounded-3xl flex items-center gap-5 shadow-lg relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-green-accent/15 flex items-center justify-center text-green-accent">
            <Star className="w-7 h-7 fill-current" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-fredoka">Desenhos Concluídos</p>
            <p className="text-3xl font-bold font-fredoka text-white">{completedCount}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-green-accent/5 pointer-events-none">
            <Star className="w-24 h-24 fill-current" />
          </div>
        </div>

        {/* Stat 2: Unlocked achievements */}
        <div className="bg-bg-card border border-gray-800 p-6 rounded-3xl flex items-center gap-5 shadow-lg relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center text-gold">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-fredoka">Conquistas Desbloqueadas</p>
            <p className="text-3xl font-bold font-fredoka text-white">{unlockedAchievementsCount}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-gold/5 pointer-events-none">
            <Trophy className="w-24 h-24" />
          </div>
        </div>

        {/* Quick info card */}
        <div className="bg-bg-card border border-gray-800 p-6 rounded-3xl flex items-center gap-5 shadow-lg relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-blue-accent/15 flex items-center justify-center text-blue-accent">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-fredoka">Total de Desenhos</p>
            <p className="text-3xl font-bold font-fredoka text-white">{allDrawings.length}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-blue-accent/5 pointer-events-none">
            <Sparkles className="w-24 h-24" />
          </div>
        </div>
      </div>

      {/* Main Row: Continue Painting & Recommendations */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Continue Painting Section */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-2xl font-bold font-fredoka text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-purple" />
            Continuar de onde parou
          </h3>

          {inProgress && inProgress.drawing ? (
            <div className="bg-bg-card border border-purple/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
              <div className="w-full sm:w-44 aspect-square rounded-2xl bg-bg-dark border border-gray-800 relative overflow-hidden flex items-center justify-center">
                {/* User painting preview */}
                <img
                  src={inProgress.canvasData}
                  alt={inProgress.title}
                  className="w-full h-full object-contain absolute z-10"
                />
                {/* Base drawing below */}
                <img
                  src={inProgress.drawing.path}
                  alt={inProgress.drawing.name}
                  className="w-full h-full object-contain opacity-40 absolute"
                />
              </div>

              <div className="space-y-4 flex-1 text-center sm:text-left">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-purple/20 text-purple border border-purple/30 rounded-full font-fredoka">
                    Em andamento
                  </span>
                  <h4 className="text-xl font-bold font-fredoka text-white mt-2">
                    {inProgress.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 font-sans">
                    Desenho: {inProgress.drawing.name} • Progresso: {inProgress.progress}%
                  </p>
                </div>

                <div className="w-full bg-bg-dark rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple h-full rounded-full transition-all duration-300"
                    style={{ width: `${inProgress.progress}%` }}
                  ></div>
                </div>

                <Link
                  href={`/editor/${inProgress.id}`}
                  className="inline-flex items-center gap-2 bg-purple hover:bg-purple/95 text-white font-fredoka px-6 py-3 rounded-2xl text-md font-bold shadow-md btn-kid hover:scale-102 cursor-pointer animate-pulse"
                >
                  Continuar Pintura
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-gray-800 rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-4 min-h-[220px]">
              <div className="w-16 h-16 rounded-full bg-purple/10 flex items-center justify-center text-purple mb-2">
                <Palette className="w-8 h-8 text-gold" />
              </div>
              <h4 className="text-xl font-bold font-fredoka text-white">Nenhuma pintura em andamento</h4>
              <p className="text-gray-400 text-sm max-w-md font-sans">
                Escolha um desenho incrível em nossa coleção para começar a pintar. Suas criações salvas aparecerão aqui automaticamente!
              </p>
              <Link
                href="/drawings"
                className="bg-purple text-white font-fredoka font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-md btn-kid hover:scale-102 mt-2 cursor-pointer"
              >
                Ver Galeria de Desenhos
              </Link>
            </div>
          )}
        </div>

        {/* Recommended Drawings */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-fredoka text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-accent" />
            Sugestões
          </h3>

          <div className="space-y-4">
            {recommendedDrawings.map((drawing) => {
              const isFav = favoriteDrawingIds.includes(drawing.id);
              return (
                <div
                  key={drawing.id}
                  className="bg-bg-card border border-gray-800 rounded-2xl p-4 flex items-center gap-4 card-kid relative overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                    <img
                      src={drawing.path}
                      alt={drawing.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold font-fredoka text-white text-sm truncate">
                      {drawing.name}
                    </h4>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      Dificuldade: {drawing.difficulty} • {drawing.estimatedTime}
                    </p>
                  </div>

                  {/* Play Button */}
                  <Link
                    href={`/editor/new_${drawing.id}`}
                    className="w-10 h-10 rounded-full bg-purple/20 text-purple flex items-center justify-center hover:bg-purple hover:text-white transition-all shrink-0 btn-kid cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </Link>

                  {/* Favorite heart icon indicator */}
                  {isFav && (
                    <div className="absolute top-2 right-2 text-red-accent">
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
