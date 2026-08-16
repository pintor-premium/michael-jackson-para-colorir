"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Heart, Search, Filter, Palette, Award } from "lucide-react";
import { drawingsData, collectionsData } from "@/constants/drawingsData";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

type ProgressFilter = "all" | "favorites" | "not_started" | "in_progress" | "completed";
type DifficultyFilter = "all" | "Fácil" | "Médio" | "Difícil";

export default function DrawingsCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");

  // Buscar dados das pinturas locais do IndexedDB
  const paintingsState = useLiveQuery(async () => {
    const list = await db.paintings.toArray();
    const map: Record<string, { progress: number; isCompleted: number; isFavorite: number; id: string }> = {};
    
    // Ordena de modo que o mais recente atualizado sobressaia
    list.sort((a, b) => b.updatedAt - a.updatedAt).forEach((p) => {
      if (!map[p.drawingId]) {
        map[p.drawingId] = {
          progress: p.progress,
          isCompleted: p.isCompleted,
          isFavorite: p.isFavorite,
          id: p.id,
        };
      }
    });
    return map;
  });

  const paintingsMap = paintingsState ?? {};

  // Alternar favorito no IndexedDB para todas as instâncias desse desenho
  const toggleFavorite = async (drawingId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const list = await db.paintings.where("drawingId").equals(drawingId).toArray();
    if (list.length > 0) {
      const isCurrentlyFav = list.some(item => item.isFavorite === 1);
      const newFav = isCurrentlyFav ? 0 : 1;
      
      for (const item of list) {
        await db.paintings.update(item.id, {
          isFavorite: newFav,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Cria registro inicial apenas para marcar como favorito
      const drawingInfo = drawingsData.find((d) => d.id === drawingId);
      const uniqueId = `${drawingId}_${Date.now()}`;
      await db.paintings.put({
        id: uniqueId,
        drawingId,
        title: drawingInfo ? `Meu ${drawingInfo.name}` : "Minha Pintura",
        canvasData: "",
        progress: 0,
        isFavorite: 1,
        isCompleted: 0,
        updatedAt: Date.now(),
      });
    }
  };

  // Filtrar desenhos
  const filteredDrawings = drawingsData.filter((drawing) => {
    const matchesSearch = drawing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCollection = selectedCollection === "all" || drawing.collectionId === selectedCollection;

    const matchesDifficulty = difficultyFilter === "all" || drawing.difficulty === difficultyFilter;

    const localData = paintingsMap[drawing.id];
    let matchesProgress = true;
    if (progressFilter === "favorites") {
      matchesProgress = localData?.isFavorite === 1;
    } else if (progressFilter === "not_started") {
      matchesProgress = !localData || (localData.progress === 0 && localData.isCompleted === 0);
    } else if (progressFilter === "in_progress") {
      matchesProgress = !!localData && localData.progress > 0 && localData.isCompleted === 0;
    } else if (progressFilter === "completed") {
      matchesProgress = localData?.isCompleted === 1;
    }

    return matchesSearch && matchesCollection && matchesDifficulty && matchesProgress && drawing.status === "active";
  });

  return (
    <div className="space-y-8">
      {/* Header and Search */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-fredoka text-white flex items-center gap-2">
            <Palette className="w-8 h-8 text-yellow-accent" />
            Galeria de Desenhos
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-sans">
            Escolha sua arte preferida e comece a colorir com suas cores preferidas!
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Procurar desenho..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-card border border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple font-sans"
          />
        </div>
      </section>

      {/* Collection Quick Filters */}
      <section className="flex items-center gap-3 overflow-x-auto pb-3 -mx-6 px-6 scrollbar-thin">
        <button
          onClick={() => setSelectedCollection("all")}
          className={`px-5 py-2.5 rounded-full font-fredoka text-md font-semibold cursor-pointer shrink-0 transition-all ${
            selectedCollection === "all"
              ? "bg-purple text-white shadow-lg shadow-purple/20"
              : "bg-bg-card text-gray-400 border border-gray-800 hover:text-white"
          }`}
        >
          Todos
        </button>
        {collectionsData.map((col) => (
          <button
            key={col.id}
            onClick={() => setSelectedCollection(col.id)}
            className={`px-5 py-2.5 rounded-full font-fredoka text-md font-semibold cursor-pointer shrink-0 transition-all ${
              selectedCollection === col.id
                ? "bg-purple text-white shadow-lg shadow-purple/20"
                : "bg-bg-card text-gray-400 border border-gray-800 hover:text-white"
            }`}
          >
            {col.name}
          </button>
        ))}
      </section>

      {/* Filters Area */}
      <section className="bg-bg-card border border-gray-800 p-5 rounded-3xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider font-fredoka">
          <Filter className="w-4 h-4 text-purple" />
          Filtros:
        </div>

        {/* Progress Filter */}
        <select
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value as ProgressFilter)}
          className="bg-bg-dark border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 font-fredoka focus:outline-none focus:border-purple cursor-pointer"
        >
          <option value="all">Progresso: Todos</option>
          <option value="favorites">Favoritos ❤️</option>
          <option value="not_started">Não Iniciados 🎨</option>
          <option value="in_progress">Em Andamento ⚡</option>
          <option value="completed">Concluídos ⭐</option>
        </select>

        {/* Difficulty Filter */}
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
          className="bg-bg-dark border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-300 font-fredoka focus:outline-none focus:border-purple cursor-pointer"
        >
          <option value="all">Dificuldade: Todas</option>
          <option value="Fácil">Fácil (Iniciante)</option>
          <option value="Médio">Médio (Intermediário)</option>
          <option value="Difícil">Difícil (Desafio)</option>
        </select>
      </section>

      {/* Drawings Grid */}
      <section>
        {filteredDrawings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredDrawings.map((drawing) => {
              const localData = paintingsMap[drawing.id];
              const isFavorite = localData?.isFavorite === 1;
              const isCompleted = localData?.isCompleted === 1;
              const progress = localData?.progress ?? 0;

              const editorUrl = localData?.id ? `/editor/${localData.id}` : `/editor/new_${drawing.id}`;

              return (
                <div
                  key={drawing.id}
                  className="bg-bg-card border border-gray-800 rounded-3xl overflow-hidden shadow-xl card-kid flex flex-col group relative"
                >
                  {/* Drawing Image Box */}
                  <div className="aspect-[4/3] bg-white m-3 rounded-2xl border border-gray-200 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-200">
                    <img
                      src={drawing.path}
                      alt={drawing.name}
                      className="w-full h-full object-contain p-4 invert"
                    />

                    {/* Progress overlay */}
                    {progress > 0 && !isCompleted && (
                      <div className="absolute bottom-2 left-2 bg-purple/90 text-white font-fredoka text-xs font-bold px-2 py-1 rounded-lg">
                        {progress}%
                      </div>
                    )}

                    {/* Completion Tag */}
                    {isCompleted && (
                      <div className="absolute top-2 left-2 bg-green-accent text-white font-fredoka text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 fill-current" />
                        Concluído
                      </div>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={(e) => toggleFavorite(drawing.id, e)}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-red-accent transition-colors cursor-pointer"
                      style={{ minWidth: "36px", minHeight: "36px" }}
                      aria-label="Favoritar"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFavorite ? "fill-red-accent text-red-accent" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple uppercase tracking-wider font-fredoka">
                          {collectionsData.find((c) => c.id === drawing.collectionId)?.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-fredoka ${
                            drawing.difficulty === "Fácil"
                              ? "bg-green-accent/15 text-green-accent"
                              : drawing.difficulty === "Médio"
                              ? "bg-yellow-accent/15 text-yellow-accent"
                              : "bg-red-accent/15 text-red-accent"
                          }`}
                        >
                          {drawing.difficulty}
                        </span>
                      </div>
                      <h4 className="text-md font-bold font-fredoka text-white line-clamp-1">
                        {drawing.name}
                      </h4>
                    </div>

                    {/* Progress Bar */}
                    {progress > 0 && (
                      <div className="w-full bg-bg-dark rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted ? "bg-green-accent" : "bg-purple"
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={editorUrl}
                        className="flex-1 bg-purple hover:bg-purple/90 text-white font-fredoka font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all btn-kid cursor-pointer shadow-lg shadow-purple/10"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                        {progress > 0 ? (isCompleted ? "Pintar de novo" : "Continuar") : "Começar"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-bg-card border border-gray-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto mt-10">
            <div className="w-16 h-16 rounded-full bg-yellow-accent/10 flex items-center justify-center text-yellow-accent mb-2">
              <Search className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold font-fredoka text-white">Nenhum desenho encontrado</h4>
            <p className="text-gray-400 text-sm font-sans">
              Tente alterar os filtros para encontrar novos desenhos!
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCollection("all");
                setProgressFilter("all");
                setDifficultyFilter("all");
              }}
              className="bg-purple text-white font-fredoka font-bold px-6 py-2.5 rounded-xl text-sm transition-all btn-kid shadow-md"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
