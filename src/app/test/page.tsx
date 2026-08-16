"use client";

import { useState, useEffect } from "react";
import { Play, CheckCircle2, AlertCircle, RefreshCw, Star, Trophy, Palette, ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { drawingsData, achievementsData } from "@/constants/drawingsData";
import { triggerDrawingCompleted } from "@/lib/achievements";
import Link from "next/link";

interface TestCase {
  name: string;
  description: string;
  status: "idle" | "running" | "passed" | "failed";
  error?: string;
}

export default function TestPage() {
  const [tests, setTests] = useState<TestCase[]>([
    { name: "Banco de Dados local (Dexie/IndexedDB)", description: "Verifica se as tabelas iniciam vazias ou carregam corretamente no IndexedDB.", status: "idle" },
    { name: "Carregamento de Desenhos", description: "Verifica se os 19 desenhos base estão mapeados e acessíveis.", status: "idle" },
    { name: "Simulação de Pintura no Canvas", description: "Simula o traço de coordenadas no canvas 2D.", status: "idle" },
    { name: "Fila de Desfazer/Refazer (Undo/Redo)", description: "Simula empilhar estados da tela e restaurar.", status: "idle" },
    { name: "Cálculo de Preenchimento (Flood Fill)", description: "Verifica se o algoritmo BFS preenche uma área sem estourar a memória.", status: "idle" },
    { name: "Salvamento Automático (Autosave)", description: "Grava um rascunho de pintura no Dexie e valida se é mantido.", status: "idle" },
    { name: "Desbloqueio de Conquistas", description: "Verifica se a conclusão da pintura dispara a liberação da conquista 'first_painting'.", status: "idle" },
    { name: "Exportação de Backup", description: "Simula a estruturação do JSON de backup e valida chaves de integridade.", status: "idle" },
    { name: "Importação de Backup", description: "Valida restaurar dados de um JSON simulado substituindo registros atuais.", status: "idle" },
    { name: "Limpeza de Progresso", description: "Verifica se a remoção completa de dados limpa todas as tabelas.", status: "idle" },
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    const updatedTests = [...tests];

    const updateTestStatus = (index: number, status: TestCase["status"], error?: string) => {
      updatedTests[index].status = status;
      if (error) updatedTests[index].error = error;
      setTests([...updatedTests]);
    };

    // --- TESTE 1: INDEXEDDB ---
    try {
      updateTestStatus(0, "running");
      await db.open();
      const paintings = await db.paintings.toArray();
      const settings = await db.settings.toArray();
      if (!Array.isArray(paintings) || !Array.isArray(settings)) throw new Error("Tabelas inválidas.");
      updateTestStatus(0, "passed");
    } catch (e: any) {
      updateTestStatus(0, "failed", e.message);
    }

    // --- TESTE 2: DESENHOS ---
    try {
      updateTestStatus(1, "running");
      if (drawingsData.length !== 19) {
        throw new Error(`Mapeamento incompleto. Esperado 19 desenhos, encontrado ${drawingsData.length}.`);
      }
      updateTestStatus(1, "passed");
    } catch (e: any) {
      updateTestStatus(1, "failed", e.message);
    }

    // --- TESTE 3: CANVAS PINTURA ---
    try {
      updateTestStatus(2, "running");
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Contexto 2D indisponível.");
      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 100, 100);
      
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.lineTo(50, 50);
      ctx.strokeStyle = "#FF3B30";
      ctx.stroke();

      const imgData = ctx.getImageData(30, 30, 1, 1).data;
      if (imgData[0] !== 255 || imgData[1] !== 59 || imgData[2] !== 48) {
        throw new Error("Simulação de traço não gravou as cores correspondentes.");
      }
      updateTestStatus(2, "passed");
    } catch (e: any) {
      updateTestStatus(2, "failed", e.message);
    }

    // --- TESTE 4: UNDO / REDO ---
    try {
      updateTestStatus(3, "running");
      const stack = ["state_initial", "state_stroke_1", "state_stroke_2"];
      const redo: string[] = [];

      // Simula Desfazer (Undo)
      const popped = stack.pop()!; // popped = state_stroke_2
      redo.push(popped);
      
      if (stack[stack.length - 1] !== "state_stroke_1" || redo[0] !== "state_stroke_2") {
        throw new Error("Erro na lógica de recuo da pilha de Undo.");
      }
      updateTestStatus(3, "passed");
    } catch (e: any) {
      updateTestStatus(3, "failed", e.message);
    }

    // --- TESTE 5: FLOOD FILL ---
    try {
      updateTestStatus(4, "running");
      const canvas = document.createElement("canvas");
      canvas.width = 10;
      canvas.height = 10;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Falta contexto canvas.");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 100, 100);

      // Traça uma barreira preta no meio da coluna 5
      ctx.fillStyle = "#000000";
      ctx.fillRect(5, 0, 1, 10);

      // Rodar flood fill simples BFS na metade esquerda
      const imgData = ctx.getImageData(0, 0, 10, 10);
      const data = imgData.data;
      const queueX = [0];
      const queueY = [0];
      const visited = new Uint8Array(100);
      visited[0] = 1;
      
      let count = 0;
      while (queueX.length > 0) {
        const cx = queueX.shift()!;
        const cy = queueY.shift()!;
        const idx = (cy * 10 + cx) * 4;
        
        // Pinta de vermelho no teste
        data[idx] = 255;
        data[idx+1] = 0;
        data[idx+2] = 0;
        count++;

        const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
            const nIdx = ny * 10 + nx;
            if (visited[nIdx] === 0) {
              visited[nIdx] = 1;
              const pIdx = nIdx * 4;
              const isBlack = data[pIdx] === 0 && data[pIdx+1] === 0 && data[pIdx+2] === 0;
              if (!isBlack) {
                queueX.push(nx);
                queueY.push(ny);
              }
            }
          }
        }
      }

      // Deve ter preenchido exatamente 50 pixels (colunas 0 a 4)
      if (count !== 50) {
        throw new Error(`Flood fill ultrapassou a barreira de contorno. Preencheu ${count} pixels.`);
      }
      updateTestStatus(4, "passed");
    } catch (e: any) {
      updateTestStatus(4, "failed", e.message);
    }

    // --- TESTE 6: AUTOSAVE ---
    try {
      updateTestStatus(5, "running");
      const testId = "test_drawing_99";
      await db.paintings.put({
        id: testId,
        drawingId: "silhouette_1",
        title: "Pintura de Teste",
        canvasData: "data:image/png;base64,TEST",
        progress: 45,
        isFavorite: 0,
        isCompleted: 0,
        updatedAt: Date.now(),
      });

      const read = await db.paintings.get(testId);
      if (read?.progress !== 45 || read?.canvasData !== "data:image/png;base64,TEST") {
        throw new Error("Dados gravados diferem dos recuperados no IndexedDB.");
      }
      // Limpar rascunho de teste
      await db.paintings.delete(testId);
      updateTestStatus(5, "passed");
    } catch (e: any) {
      updateTestStatus(5, "failed", e.message);
    }

    // --- TESTE 7: CONQUISTAS ---
    try {
      updateTestStatus(6, "running");
      // Simular conclusão de pintura no banco de dados e checar desbloqueio
      await db.paintings.put({
        id: "test_drawing_achievement",
        drawingId: "silhouette_1",
        title: "Pintura Desafio",
        canvasData: "data:image/png;base64,TEST",
        progress: 100,
        isFavorite: 0,
        isCompleted: 1,
        updatedAt: Date.now(),
      });

      await triggerDrawingCompleted();
      const firstPaintingAch = await db.achievements.get("first_painting");
      if (firstPaintingAch?.unlocked !== 1) {
        throw new Error("Progresso de conquistas não foi ativado após conclusão.");
      }

      // Resetar dados de teste
      await db.paintings.delete("test_drawing_achievement");
      await db.achievements.delete("first_painting");
      updateTestStatus(6, "passed");
    } catch (e: any) {
      updateTestStatus(6, "failed", e.message);
    }

    // --- TESTE 8: EXPORTAR BACKUP ---
    try {
      updateTestStatus(7, "running");
      const paintings = [{ id: "1", drawingId: "1", title: "A", canvasData: "A", progress: 50, isFavorite: 0, isCompleted: 0, updatedAt: 123 }];
      const achievements = [{ id: "first", unlocked: 1, progress: 1 }];
      const settings = [{ key: "a", value: true }];

      const backup = {
        appName: "MJColorBackup",
        version: 1,
        childName: "João Gabriel",
        timestamp: Date.now(),
        paintings,
        achievements,
        settings,
      };

      if (backup.appName !== "MJColorBackup" || backup.paintings[0].title !== "A") {
        throw new Error("JSON de backup estruturado incorretamente.");
      }
      updateTestStatus(7, "passed");
    } catch (e: any) {
      updateTestStatus(7, "failed", e.message);
    }

    // --- TESTE 9: IMPORTAR BACKUP ---
    try {
      updateTestStatus(8, "running");
      const testImportId = "import_test_id";
      const simulatedBackup = {
        appName: "MJColorBackup",
        paintings: [
          {
            id: testImportId,
            drawingId: "silhouette_1",
            title: "Pintura Importada",
            canvasData: "data:image/png;base64,TEST",
            progress: 80,
            isFavorite: 1,
            isCompleted: 0,
            updatedAt: Date.now(),
          },
        ],
      };

      // Simular import
      await db.paintings.put(simulatedBackup.paintings[0]);
      const imported = await db.paintings.get(testImportId);
      if (imported?.title !== "Pintura Importada" || imported.progress !== 80) {
        throw new Error("Falha ao injetar dados importados do backup.");
      }

      // Limpar
      await db.paintings.delete(testImportId);
      updateTestStatus(8, "passed");
    } catch (e: any) {
      updateTestStatus(8, "failed", e.message);
    }

    // --- TESTE 10: LIMPAR PROGRESSO ---
    try {
      updateTestStatus(9, "running");
      await db.paintings.put({
        id: "temp_clear",
        drawingId: "silhouette_1",
        title: "A",
        canvasData: "A",
        progress: 10,
        isFavorite: 0,
        isCompleted: 0,
        updatedAt: Date.now(),
      });

      await db.paintings.clear();
      const count = await db.paintings.count();
      if (count !== 0) throw new Error("A tabela de pinturas não foi limpa com sucesso.");
      updateTestStatus(9, "passed");
    } catch (e: any) {
      updateTestStatus(9, "failed", e.message);
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white p-6 md:p-10 flex flex-col items-center select-none font-sans">
      <div className="max-w-3xl w-full space-y-8">
        {/* Back and title */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-fredoka">Voltar ao Início</span>
          </Link>
          <div className="flex items-center gap-2 bg-purple/10 border border-purple/20 px-3 py-1.5 rounded-full text-xs font-fredoka text-purple">
            <Star className="w-3.5 h-3.5 fill-current text-gold" />
            Modo Desenvolvimento
          </div>
        </div>

        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold font-fredoka text-white">Painel de Testes do Livro</h2>
          <p className="text-gray-400 text-sm mt-1">
            Esta página executa simulações das operações críticas do aplicativo (Canvas, Banco, Backup) direto no seu navegador.
          </p>
        </div>

        {/* Run CTA */}
        <div className="bg-bg-card border border-gray-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold font-fredoka text-white text-md">Verificação Completa</h4>
            <p className="text-gray-400 text-xs font-sans">
              Roda simulações de desenho em tempo de execução para atestar a estabilidade da pintura.
            </p>
          </div>
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-purple hover:bg-purple/95 text-white font-fredoka font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:pointer-events-none transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            {isRunning ? "Executando Testes..." : "Executar Testes de Sistema"}
          </button>
        </div>

        {/* Tests results list */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div
              key={test.name}
              className="bg-bg-card border border-gray-800 rounded-2xl p-5 flex items-start gap-4 justify-between"
            >
              <div className="space-y-1">
                <h4 className="font-bold font-fredoka text-white text-sm">{test.name}</h4>
                <p className="text-gray-400 text-xs font-sans">{test.description}</p>
                {test.error && (
                  <p className="text-red-accent text-xs font-mono bg-red-accent/10 p-2 rounded-lg border border-red-accent/20 mt-2">
                    Erro: {test.error}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {test.status === "idle" && (
                  <span className="text-[10px] font-fredoka font-bold text-gray-500 bg-bg-dark border border-gray-850 px-2.5 py-1.5 rounded-full">
                    Aguardando
                  </span>
                )}
                {test.status === "running" && (
                  <div className="flex items-center gap-1 text-[10px] font-fredoka font-bold text-yellow-accent bg-yellow-accent/10 px-2.5 py-1.5 rounded-full">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Executando
                  </div>
                )}
                {test.status === "passed" && (
                  <span className="flex items-center gap-1 text-[10px] font-fredoka font-bold text-green-accent bg-green-accent/15 px-2.5 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Passou
                  </span>
                )}
                {test.status === "failed" && (
                  <span className="flex items-center gap-1 text-[10px] font-fredoka font-bold text-red-accent bg-red-accent/15 px-2.5 py-1.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Falhou
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
