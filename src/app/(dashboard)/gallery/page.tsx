"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Trash2, Edit2, Copy, Download, Heart, Eye, Sparkles, AlertTriangle, X, Palette } from "lucide-react";
import { db, Painting } from "@/lib/db";
import { drawingsData } from "@/constants/drawingsData";
import { useLiveQuery } from "dexie-react-hooks";

type Tab = "all" | "in_progress" | "completed" | "favorites";

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [previewPainting, setPreviewPainting] = useState<Painting | null>(null);
  
  // Estados para modais de Ação
  const [renamePainting, setRenamePainting] = useState<Painting | null>(null);
  const [newName, setNewName] = useState("");
  
  const [deletePainting, setDeletePainting] = useState<Painting | null>(null);

  // Buscar pinturas locais do IndexedDB
  const paintings = useLiveQuery(async () => {
    const list = await db.paintings.filter(p => p.canvasData !== "").toArray();
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  });

  const list = paintings ?? [];

  // Filtrar pinturas por aba
  const filteredPaintings = list.filter((p) => {
    if (activeTab === "favorites") return p.isFavorite === 1;
    if (activeTab === "in_progress") return p.isCompleted === 0;
    if (activeTab === "completed") return p.isCompleted === 1;
    return true;
  });

  // Ações: Renomear
  const handleRename = async () => {
    if (!renamePainting || !newName.trim()) return;
    await db.paintings.update(renamePainting.id, {
      title: newName.trim(),
      updatedAt: Date.now(),
    });
    setRenamePainting(null);
    setNewName("");
  };

  // Ações: Duplicar
  const handleDuplicate = async (painting: Painting, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const uniqueId = `${painting.drawingId}_${Date.now()}`;
    await db.paintings.put({
      ...painting,
      id: uniqueId,
      title: `${painting.title} (Cópia)`,
      updatedAt: Date.now(),
    });
  };

  // Ações: Excluir
  const handleDelete = async () => {
    if (!deletePainting) return;
    await db.paintings.delete(deletePainting.id);
    setDeletePainting(null);
  };

  // Ações: Alternar Favorito
  const toggleFavorite = async (painting: Painting, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const newFav = painting.isFavorite === 1 ? 0 : 1;
    await db.paintings.update(painting.id, {
      isFavorite: newFav,
      updatedAt: Date.now(),
    });
  };

  // Ações: Baixar Imagem
  const handleDownload = (painting: Painting, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const drawing = drawingsData.find(d => d.id === painting.drawingId);
    if (!drawing) return;

    const imgOutline = new Image();
    const imgPaint = new Image();

    imgOutline.src = drawing.path;
    imgPaint.src = painting.canvasData;

    let loadedCount = 0;
    const mergeAndDownload = () => {
      loadedCount++;
      if (loadedCount === 2) {
        const canvas = document.createElement("canvas");
        canvas.width = imgOutline.naturalWidth || 800;
        canvas.height = imgOutline.naturalHeight || 600;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(imgPaint, 0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.globalCompositeOperation = "multiply";
          ctx.drawImage(imgOutline, 0, 0, canvas.width, canvas.height);
          ctx.restore();
          
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `${painting.title}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    };

    imgOutline.onload = mergeAndDownload;
    imgPaint.onload = mergeAndDownload;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-fredoka text-white flex items-center gap-2">
            <Palette className="w-8 h-8 text-purple" />
            Minhas Pinturas
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-sans">
            Gerencie todas as artes que você já pintou! Você pode continuar editando, duplicar para fazer versões diferentes ou baixar.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-gray-800">
        {(["all", "in_progress", "completed", "favorites"] as Tab[]).map((tab) => {
          const names: Record<Tab, string> = {
            all: "Todas as Pinturas",
            in_progress: "Em Andamento",
            completed: "Concluídas",
            favorites: "Favoritas ❤️",
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full font-fredoka text-md font-semibold cursor-pointer shrink-0 transition-all ${
                activeTab === tab
                  ? "bg-purple text-white shadow-lg shadow-purple/20"
                  : "bg-transparent text-gray-400 hover:text-white"
              }`}
            >
              {names[tab]}
            </button>
          );
        })}
      </section>

      {/* Paintings Grid */}
      <section>
        {filteredPaintings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPaintings.map((painting) => {
              const drawing = drawingsData.find((d) => d.id === painting.drawingId);
              if (!drawing) return null;

              return (
                <div
                  key={painting.id}
                  className="bg-bg-card border border-gray-800 rounded-3xl overflow-hidden shadow-xl card-kid flex flex-col group relative"
                >
                  {/* Drawing Image Box */}
                  <div className="aspect-[4/3] bg-white m-3 rounded-2xl border border-gray-200 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={painting.canvasData}
                      alt={painting.title}
                      className="w-full h-full object-contain absolute z-10 p-3"
                    />
                    <img
                      src={drawing.path}
                      alt={drawing.name}
                      className="w-full h-full object-contain opacity-20 absolute p-3"
                    />

                    {/* Progress overlay */}
                    {painting.progress > 0 && !painting.isCompleted && (
                      <div className="absolute bottom-2 left-2 bg-purple/90 text-white font-fredoka text-xs font-bold px-2 py-1 rounded-lg z-20">
                        {painting.progress}%
                      </div>
                    )}

                    {/* Completion Tag */}
                    {painting.isCompleted === 1 && (
                      <div className="absolute top-2 left-2 bg-green-accent text-white font-fredoka text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 z-20">
                        ⭐ Concluída
                      </div>
                    )}

                    {/* Heart button */}
                    <button
                      onClick={(e) => toggleFavorite(painting, e)}
                      className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-red-accent transition-colors cursor-pointer z-20"
                      style={{ minWidth: "36px", minHeight: "36px" }}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          painting.isFavorite === 1 ? "fill-red-accent text-red-accent" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-purple uppercase tracking-wider font-fredoka">
                        <span>{drawing.difficulty}</span>
                        <span>{new Date(painting.updatedAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <h4 className="text-md font-bold font-fredoka text-white line-clamp-1">
                        {painting.title}
                      </h4>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-5 gap-1.5 border-t border-gray-800/80 pt-3">
                      <Link
                        href={`/editor/${painting.id}`}
                        title="Continuar Pintando"
                        className="col-span-2 bg-purple hover:bg-purple/90 text-white rounded-xl py-2 px-3 flex items-center justify-center gap-1 text-xs font-bold font-fredoka transition-all btn-kid cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        Pintar
                      </Link>

                      <button
                        onClick={() => setPreviewPainting(painting)}
                        title="Ver em tela cheia"
                        className="bg-bg-dark hover:bg-gray-800 text-gray-300 rounded-xl p-2 flex items-center justify-center transition-all cursor-pointer"
                        style={{ minWidth: "36px", minHeight: "36px" }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setRenamePainting(painting);
                          setNewName(painting.title);
                        }}
                        title="Renomear"
                        className="bg-bg-dark hover:bg-gray-800 text-gray-300 rounded-xl p-2 flex items-center justify-center transition-all cursor-pointer"
                        style={{ minWidth: "36px", minHeight: "36px" }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDuplicate(painting, e)}
                        title="Duplicar"
                        className="bg-bg-dark hover:bg-gray-800 text-gray-300 rounded-xl p-2 flex items-center justify-center transition-all cursor-pointer"
                        style={{ minWidth: "36px", minHeight: "36px" }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDownload(painting, e)}
                        title="Baixar"
                        className="col-span-1 bg-green-accent/20 hover:bg-green-accent text-green-accent hover:text-white rounded-xl p-2 flex items-center justify-center transition-all cursor-pointer"
                        style={{ minWidth: "36px", minHeight: "36px" }}
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletePainting(painting)}
                        title="Excluir Pintura"
                        className="col-span-4 bg-red-accent/10 hover:bg-red-accent text-red-accent hover:text-white rounded-xl py-2 flex items-center justify-center gap-1.5 text-xs font-bold font-fredoka transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-bg-card border border-gray-800 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4 max-w-xl mx-auto mt-10">
            <div className="w-16 h-16 rounded-full bg-purple/10 flex items-center justify-center text-purple mb-2">
              <Palette className="w-8 h-8 text-gold" />
            </div>
            <h4 className="text-xl font-bold font-fredoka text-white">Nenhuma pintura encontrada</h4>
            <p className="text-gray-400 text-sm font-sans">
              Você ainda não pintou nenhum desenho com essa categoria. Comece a pintar agora mesmo!
            </p>
            <Link
              href="/drawings"
              className="bg-purple text-white font-fredoka font-bold px-6 py-2.5 rounded-xl text-sm transition-all btn-kid shadow-md cursor-pointer"
            >
              Começar Pintura
            </Link>
          </div>
        )}
      </section>

      {/* MODAL: Visualização da Imagem Ampliada */}
      {previewPainting && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-gray-800 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative">
            <button
              onClick={() => setPreviewPainting(null)}
              className="absolute top-4 right-4 bg-bg-dark/80 hover:bg-gray-800 text-white rounded-full p-2 cursor-pointer z-10"
              style={{ minWidth: "40px", minHeight: "40px" }}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 pb-2 text-center border-b border-gray-800">
              <h3 className="text-2xl font-bold font-fredoka text-white">{previewPainting.title}</h3>
              <p className="text-xs text-gray-500 font-sans mt-1">
                Baseado em: {drawingsData.find(d => d.id === previewPainting.drawingId)?.name}
              </p>
            </div>
            <div className="aspect-[4/3] bg-white m-6 rounded-2xl flex items-center justify-center relative shadow-inner">
              <img
                src={previewPainting.canvasData}
                alt={previewPainting.title}
                className="w-full h-full object-contain absolute z-10 p-6"
              />
              <img
                src={drawingsData.find(d => d.id === previewPainting.drawingId)?.path}
                alt="Base outline"
                className="w-full h-full object-contain opacity-20 absolute p-6"
              />
            </div>
            <div className="p-6 bg-bg-dark/50 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setPreviewPainting(null)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-fredoka font-semibold rounded-xl text-sm cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={(e) => {
                  handleDownload(previewPainting, e);
                  setPreviewPainting(null);
                }}
                className="px-6 py-2.5 bg-green-accent hover:bg-green-accent/90 text-white font-fredoka font-semibold rounded-xl text-sm flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Baixar Arte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Renomear Pintura */}
      {renamePainting && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-gray-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple">
              <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-purple" />
              </div>
              <h3 className="text-xl font-bold font-fredoka text-white">Renomear Pintura</h3>
            </div>
            <p className="text-sm text-gray-400 font-sans">
              Qual nome legal você quer dar para esta pintura?
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-bg-dark border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple font-fredoka"
              placeholder="Ex: Poses Brilhantes"
              maxLength={40}
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRenamePainting(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-fredoka rounded-xl text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleRename}
                className="px-5 py-2 bg-purple hover:bg-purple/90 text-white font-fredoka font-bold rounded-xl text-sm cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Excluir Confirmação */}
      {deletePainting && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-gray-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-accent">
              <div className="w-10 h-10 rounded-full bg-red-accent/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-fredoka text-white">Excluir Pintura?</h3>
            </div>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              Você tem certeza que quer excluir <strong className="text-white">{deletePainting.title}</strong>? Essa ação apagará essa arte do dispositivo para sempre e não pode ser desfeita!
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletePainting(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-fredoka rounded-xl text-sm cursor-pointer"
              >
                Manter Arte
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-accent hover:bg-red-accent/90 text-white font-fredoka font-bold rounded-xl text-sm cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
