"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Play, ArrowLeft, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize, Minimize, PaintBucket, Brush, PenTool, Highlighter, Eraser, Pipette, Palette, Heart, CheckCircle2, RefreshCw, Sparkles, X, Star, Trophy, Download } from "lucide-react";
import { db, Painting } from "@/lib/db";
import { drawingsData, colorPalettes, drawingsData as allDrawings } from "@/constants/drawingsData";
import { playSelectSound, playCompleteSound } from "@/lib/sounds";
import { triggerDrawingCompleted, triggerFavoriteAdded, triggerDayActive } from "@/lib/achievements";
import { useLiveQuery } from "dexie-react-hooks";

type Tool = "brush" | "pencil" | "marker" | "bucket" | "eraser" | "picker";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const containerRef = useRef<HTMLDivElement>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenOutlineCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Estados do Editor
  const [painting, setPainting] = useState<Painting | null>(null);
  const [drawing, setDrawing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Ferramentas e Cores
  const [activeTool, setActiveTool] = useState<Tool>("bucket");
  const [activeColor, setActiveColor] = useState("#FF3B30");
  const [brushSize, setBrushSize] = useState(12);
  const [brushOpacity, setBrushOpacity] = useState(1.0);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [isZenMode, setIsZenMode] = useState(false);

  // Zoom e Pan
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [pinchStartDist, setPinchStartDist] = useState<number | null>(null);

  // Pilhas de Histórico (Undo/Redo)
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Estados de UI
  const [saveStatus, setSaveStatus] = useState<"salvando" | "salvo" | "erro">("salvo");
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettis, setConfettis] = useState<{ id: number; left: number; delay: number; color: string; duration: number }[]>([]);
  const [canvasAspectRatio, setCanvasAspectRatio] = useState("1 / 1");
  const [isCanvasLandscape, setIsCanvasLandscape] = useState(false);

  // Desenho ativo
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const autoSaveSequenceRef = useRef(0);
  const multiTouchActiveRef = useRef(false);
  const pendingSingleTouchRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
  } | null>(null);

  // Carregar preferências
  const preferences = useLiveQuery(async () => {
    const sound = await db.settings.get("soundEnabled");
    const contrast = await db.settings.get("highContrastEnabled");
    const buttons = await db.settings.get("largeButtonsEnabled");
    const favs = await db.settings.get("favoriteColors");
    if (favs) setFavoriteColors(favs.value);
    
    return {
      sound: sound ? sound.value : true,
      contrast: contrast ? contrast.value : false,
      largeButtons: buttons ? buttons.value : false,
    };
  });

  const soundOn = preferences?.sound ?? true;
  const isContrast = preferences?.contrast ?? false;
  const isLargeButtons = preferences?.largeButtons ?? false;

  // 1. CARREGAR OU INICIALIZAR PINTURA
  useEffect(() => {
    const loadPainting = async () => {
      setLoading(true);
      try {
        await triggerDayActive(); // Registrar dia ativo
        
        if (rawId.startsWith("new_")) {
          const drawingId = rawId.substring(4);
          const drawingInfo = allDrawings.find((d) => d.id === drawingId);
          if (!drawingInfo) {
            setError(true);
            setLoading(false);
            return;
          }

          // Verificar se já existe algum rascunho em andamento para esse desenho
          const existing = await db.paintings
            .where("drawingId")
            .equals(drawingId)
            .toArray();

          const allList = await db.paintings.toArray();
          const uniqueId = `${drawingId}_${Date.now()}`;
          const newPainting: Painting = {
            id: uniqueId,
            drawingId: drawingId,
            baseImagePath: drawingInfo.path,
            title: `Pintura ${allList.length + 1}`,
            canvasData: "",
            progress: 0,
            isFavorite: existing.length > 0 ? existing[0].isFavorite : 0,
            isCompleted: 0,
            updatedAt: Date.now(),
          };

          await db.paintings.put(newPainting);
          
          // Alterar a rota de forma silenciosa para o ID real do rascunho
          setPainting(newPainting);
          setDrawing(drawingInfo);
          router.replace(`/editor/${newPainting.id}`);
        } else {
          // Carregar pintura existente
          const p = await db.paintings.get(rawId);
          if (!p) {
            setError(true);
            setLoading(false);
            return;
          }
          const drawingInfo = allDrawings.find((d) => d.id === p.drawingId);
          if (!drawingInfo) {
            setError(true);
            setLoading(false);
            return;
          }
          if (p.canvasData && p.baseImagePath !== drawingInfo.path) {
            p.canvasData = "";
            p.progress = 0;
            p.isCompleted = 0;
            p.completedAt = undefined;
            p.baseImagePath = drawingInfo.path;
            await db.paintings.update(p.id, {
              canvasData: "",
              progress: 0,
              isCompleted: 0,
              completedAt: undefined,
              baseImagePath: drawingInfo.path,
              updatedAt: Date.now(),
            });
          }
          setPainting(p);
          setDrawing(drawingInfo);
        }
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadPainting();
  }, [rawId]);

  // 2. INICIALIZAR O CANVAS
  useEffect(() => {
    if (!painting || !drawing || loading) return;

    const paintCanvas = paintCanvasRef.current;
    const hiddenOutline = hiddenOutlineCanvasRef.current;
    if (!paintCanvas || !hiddenOutline) return;

    const ctx = paintCanvas.getContext("2d");
    const outlineCtx = hiddenOutline.getContext("2d");
    if (!ctx || !outlineCtx) return;

    const outlineImg = new Image();
    outlineImg.src = drawing.path;
    outlineImg.onload = () => {
      // Ajustar o tamanho dos canvas para as dimensões originais da imagem
      const w = outlineImg.naturalWidth || 800;
      const h = outlineImg.naturalHeight || 800;

      paintCanvas.width = w;
      paintCanvas.height = h;
      hiddenOutline.width = w;
      hiddenOutline.height = h;
      setCanvasAspectRatio(`${w} / ${h}`);
      setIsCanvasLandscape(w >= h);

      // Desenhar o contorno no canvas auxiliar oculto
      outlineCtx.drawImage(outlineImg, 0, 0, w, h);

      // Preencher o fundo do canvas de pintura de branco se for novo
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Restaurar progresso se existir
      if (painting.canvasData) {
        const paintImg = new Image();
        paintImg.src = painting.canvasData;
        paintImg.onload = () => {
          ctx.drawImage(paintImg, 0, 0, w, h);
          // Iniciar pilha de Undo com o estado inicial restaurado
          setUndoStack([painting.canvasData]);
        };
      } else {
        // Estado inicial em branco
        setUndoStack([paintCanvas.toDataURL()]);
      }
    };
  }, [painting, drawing, loading]);

  // 3. ATALHOS DE TECLADO
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompletedModalOpen) return;
      
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === "b" || e.key === "B") {
        setTool("brush");
      } else if (e.key === "e" || e.key === "E") {
        setTool("eraser");
      } else if (e.key === "f" || e.key === "F") {
        setTool("bucket");
      } else if (e.key === "i" || e.key === "I") {
        setTool("picker");
      } else if (e.key === "+") {
        adjustZoom(0.2);
      } else if (e.key === "-") {
        adjustZoom(-0.2);
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undoStack, redoStack, isCompletedModalOpen]);

  // Tocar som de toque
  const setTool = (tool: Tool) => {
    setActiveTool(tool);
    if (soundOn) playSelectSound();
  };

  // 4. MÉTODOS DE HISTÓRICO (UNDO / REDO)
  const saveStateToUndo = (dataUrl: string) => {
    setUndoStack((prev) => [...prev.slice(-14), dataUrl]); // Limitar a 15 estados
    setRedoStack([]); // Limpar redo
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return; // Precisa ter pelo menos o estado inicial
    
    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext("2d");
    if (!paintCanvas || !ctx) return;

    const current = undoStack[undoStack.length - 1];
    const previous = undoStack[undoStack.length - 2];

    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, current]);

    const img = new Image();
    img.src = previous;
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
      ctx.drawImage(img, 0, 0);
      autoSave(previous);
    };
    if (soundOn) playSelectSound();
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext("2d");
    if (!paintCanvas || !ctx) return;

    const next = redoStack[redoStack.length - 1];

    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, next]);

    const img = new Image();
    img.src = next;
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
      ctx.drawImage(img, 0, 0);
      autoSave(next);
    };
    if (soundOn) playSelectSound();
  };

  const handleClearCanvas = () => {
    if (!window.confirm("Quer apagar toda a pintura deste desenho e recomeçar?")) return;
    
    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext("2d");
    if (!paintCanvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);

    const dataUrl = paintCanvas.toDataURL();
    saveStateToUndo(dataUrl);
    autoSave(dataUrl);
  };

  // 5. SALVAMENTO AUTOMÁTICO
  const autoSave = async (canvasUrl: string) => {
    if (!painting) return;
    const sequence = ++autoSaveSequenceRef.current;
    setSaveStatus("salvando");
    try {
      const paintCanvas = paintCanvasRef.current;
      let progress = painting.progress;
      if (paintCanvas) {
        progress = calculateProgress(paintCanvas);
      }

      await db.paintings.update(painting.id, {
        baseImagePath: drawing.path,
        canvasData: canvasUrl,
        progress,
        updatedAt: Date.now(),
      });

      if (sequence !== autoSaveSequenceRef.current) return;

      setPainting((prev) => (prev ? { ...prev, baseImagePath: drawing.path, canvasData: canvasUrl, progress } : null));
      setSaveStatus("salvo");
    } catch (e) {
      if (sequence !== autoSaveSequenceRef.current) return;
      setSaveStatus("erro");
    }
  };

  // Cálculo de Progresso (amostra de 1% dos pixels)
  const calculateProgress = (canvas: HTMLCanvasElement): number => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;

    let colored = 0;
    let total = 0;
    const step = 8; // amostra 1 de 64 pixels para velocidade absurda

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        // Se a cor for diferente de branco puro (#ffffff), conta como pintado
        if (r < 250 || g < 250 || b < 250) {
          colored++;
        }
        total++;
      }
    }

    return Math.round((colored / total) * 100);
  };

  // 6. ALGORITMO FLOOD FILL OTIMIZADO (QUEUE DE INT32ARRAY)
  const runFloodFill = (
    paintCtx: CanvasRenderingContext2D,
    outlineCtx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    hexColor: string,
    width: number,
    height: number
  ) => {
    // Converter Hex em RGB
    const rHex = parseInt(hexColor.slice(1, 3), 16);
    const gHex = parseInt(hexColor.slice(3, 5), 16);
    const bHex = parseInt(hexColor.slice(5, 7), 16);
    const fillColor = { r: rHex, g: gHex, b: bHex, a: 255 };

    const paintImg = paintCtx.getImageData(0, 0, width, height);
    const paintData = paintImg.data;

    const outlineImg = outlineCtx.getImageData(0, 0, width, height);
    const outlineData = outlineImg.data;

    const targetIdx = (startY * width + startX) * 4;
    const targetColor = {
      r: paintData[targetIdx],
      g: paintData[targetIdx + 1],
      b: paintData[targetIdx + 2],
      a: paintData[targetIdx + 3],
    };
    const colorTolerance = 12;
    const matchesTargetPaint = (idx: number) => (
      Math.abs(paintData[idx] - targetColor.r) <= colorTolerance &&
      Math.abs(paintData[idx + 1] - targetColor.g) <= colorTolerance &&
      Math.abs(paintData[idx + 2] - targetColor.b) <= colorTolerance &&
      Math.abs(paintData[idx + 3] - targetColor.a) <= colorTolerance
    );

    // Se clicou direto em um contorno preto, não faz nada
    const isStartLine = (outlineData[targetIdx + 3] > 30 && (outlineData[targetIdx] + outlineData[targetIdx + 1] + outlineData[targetIdx + 2]) / 3 < 150);
    if (isStartLine) return;

    // Se já tiver pintado com a mesma cor no destino, aborta
    if (
      Math.abs(targetColor.r - fillColor.r) <= colorTolerance &&
      Math.abs(targetColor.g - fillColor.g) <= colorTolerance &&
      Math.abs(targetColor.b - fillColor.b) <= colorTolerance &&
      Math.abs(targetColor.a - fillColor.a) <= colorTolerance
    ) {
      return;
    }

    // Estruturas de Fila Otimizadas
    const queueX = new Int32Array(width * height);
    const queueY = new Int32Array(width * height);
    let head = 0;
    let tail = 0;

    queueX[tail] = startX;
    queueY[tail] = startY;
    tail++;

    const visited = new Uint8Array(width * height);
    visited[startY * width + startX] = 1;

    while (head < tail) {
      const cx = queueX[head];
      const cy = queueY[head];
      head++;

      const index = (cy * width + cx) * 4;
      paintData[index] = fillColor.r;
      paintData[index + 1] = fillColor.g;
      paintData[index + 2] = fillColor.b;
      paintData[index + 3] = fillColor.a;

      // Vizinhos de 4 vias
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];

      for (let i = 0; i < 4; i++) {
        const nx = cx + dirs[i][0];
        const ny = cy + dirs[i][1];

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIndex = ny * width + nx;
          if (visited[nIndex] === 0) {
            visited[nIndex] = 1;
            const pIdx = nIndex * 4;

            // Verifica se é contorno preto (barreira)
            const r = outlineData[pIdx];
            const g = outlineData[pIdx + 1];
            const b = outlineData[pIdx + 2];
            const a = outlineData[pIdx + 3];
            const isLine = (a > 30 && (r + g + b) / 3 < 150);

            if (!isLine && matchesTargetPaint(pIdx)) {
              queueX[tail] = nx;
              queueY[tail] = ny;
              tail++;
            }
          }
        }
      }
    }

    paintCtx.putImageData(paintImg, 0, 0);
  };

  // Mapeamento de coordenadas da viewport para a resolução do canvas
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return null;

    const rect = paintCanvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || paintCanvas.width === 0 || paintCanvas.height === 0) {
      return null;
    }

    const canvasRatio = paintCanvas.width / paintCanvas.height;
    const rectRatio = rect.width / rect.height;
    let visibleWidth = rect.width;
    let visibleHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (rectRatio > canvasRatio) {
      visibleWidth = rect.height * canvasRatio;
      offsetX = (rect.width - visibleWidth) / 2;
    } else {
      visibleHeight = rect.width / canvasRatio;
      offsetY = (rect.height - visibleHeight) / 2;
    }

    const localX = clientX - rect.left - offsetX;
    const localY = clientY - rect.top - offsetY;

    if (localX < 0 || localY < 0 || localX > visibleWidth || localY > visibleHeight) {
      return null;
    }

    const x = Math.floor((localX / visibleWidth) * paintCanvas.width);
    const y = Math.floor((localY / visibleHeight) * paintCanvas.height);
    
    return {
      x: Math.max(0, Math.min(paintCanvas.width - 1, x)),
      y: Math.max(0, Math.min(paintCanvas.height - 1, y)),
    };
  };

  // 7. PINTURA - COMEÇAR (DOWN)
  const handleDrawStart = (clientX: number, clientY: number) => {
    if (activeTool === "picker") {
      runEyedropper(clientX, clientY);
      return;
    }

    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext("2d");
    const hiddenOutline = hiddenOutlineCanvasRef.current;
    if (!paintCanvas || !ctx || !hiddenOutline) return;

    if (activeTool === "bucket") {
      runFloodFill(ctx, hiddenOutline.getContext("2d")!, coords.x, coords.y, activeColor, paintCanvas.width, paintCanvas.height);
      const dataUrl = paintCanvas.toDataURL();
      saveStateToUndo(dataUrl);
      autoSave(dataUrl);
      return;
    }

    setIsDrawing(true);
    setLastPos(coords);

    // Configurar pincel
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    if (activeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 1.5; // Borracha levemente maior
    } else {
      ctx.globalCompositeOperation = "source-over";
      if (activeTool === "marker") {
        ctx.globalAlpha = 0.4;
      } else if (activeTool === "pencil") {
        ctx.lineWidth = Math.max(2, brushSize / 4);
        ctx.globalAlpha = brushOpacity;
      } else {
        ctx.globalAlpha = brushOpacity;
      }
    }

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  // PINTURA - DESENHAR (MOVE)
  const handleDrawMove = (clientX: number, clientY: number) => {
    if (!isDrawing) return;

    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext("2d");
    if (!paintCanvas || !ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPos(coords);
  };

  // PINTURA - TERMINAR (UP)
  const handleDrawEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext("2d");
    if (!paintCanvas || !ctx) return;

    // Resetar opacidade e blend mode
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = "source-over";

    // Adicionar histórico e autosave
    const dataUrl = paintCanvas.toDataURL();
    saveStateToUndo(dataUrl);
    autoSave(dataUrl);
  };

  // CONTA-GOTAS (EYEDROPPER)
  const runEyedropper = (clientX: number, clientY: number) => {
    const coords = getCanvasCoords(clientX, clientY);
    if (!coords) return;

    const paintCanvas = paintCanvasRef.current;
    const ctx = paintCanvas?.getContext("2d");
    if (!paintCanvas || !ctx) return;

    const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;
    // Se for branco ou transparente, não altera nada relevante
    if (pixel[3] < 10) return;

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    
    setActiveColor(hex);
    // Adicionar nas cores recentes
    setRecentColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 8));
    setActiveTool("bucket");
  };

  // FAVORITAR COR
  const toggleFavoriteColor = async () => {
    let list = [...favoriteColors];
    if (list.includes(activeColor)) {
      list = list.filter((c) => c !== activeColor);
    } else {
      list = [activeColor, ...list].slice(0, 16);
    }
    setFavoriteColors(list);
    await db.settings.put({ key: "favoriteColors", value: list });
  };

  // SELECIONAR COR
  const handleSelectColor = (hex: string) => {
    setActiveColor(hex);
    setRecentColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 8));
    if (activeTool === "eraser") {
      setActiveTool("bucket");
    }
  };

  // 8. GERENCIAR ZOOM E PAN (MOUSE & MULTI-TOUCH)
  const adjustZoom = (amount: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(5.0, prev + amount)));
  };

  const handleZoomReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Apenas clique esquerdo
    if (activeTool === "picker") {
      runEyedropper(e.clientX, e.clientY);
      return;
    }

    // Se estiver em modo de Panning (usando barra de espaço ou ferramenta selecionada) ou com clique secundário
    if (e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      handleDrawStart(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else {
      handleDrawMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    } else {
      handleDrawEnd();
    }
  };

  // Touch handlers para celular/tablet (Suporte a Pinch-to-zoom com 2 dedos e pintura com 1 dedo)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Começar Pinch-to-zoom
      setIsDrawing(false);
      setIsPanning(true);
      
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      setPinchStartDist(dist);
      
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      setPanStart({ x: midX - pan.x, y: midY - pan.y });
    } else if (e.touches.length === 1) {
      if (activeTool === "picker") {
        runEyedropper(e.touches[0].clientX, e.touches[0].clientY);
        return;
      }
      handleDrawStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPanning) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      // Calcular zoom
      if (pinchStartDist !== null) {
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const factor = dist / pinchStartDist;
        setZoom((prev) => Math.max(0.5, Math.min(5.0, prev * factor)));
        setPinchStartDist(dist);
      }

      // Calcular pan
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      setPan({ x: midX - panStart.x, y: midY - panStart.y });
    } else if (e.touches.length === 1 && isDrawing) {
      handleDrawMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    if (isPanning) {
      setIsPanning(false);
      setPinchStartDist(null);
    } else {
      handleDrawEnd();
    }
  };

  const handleMobileTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length >= 2) {
      multiTouchActiveRef.current = true;
      pendingSingleTouchRef.current = null;
      setIsDrawing(false);
      setIsPanning(true);

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      setPinchStartDist(dist);

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      setPanStart({ x: midX - pan.x, y: midY - pan.y });
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      pendingSingleTouchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        moved: false,
      };
    }
  };

  const handleMobileTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length >= 2) {
      multiTouchActiveRef.current = true;
      pendingSingleTouchRef.current = null;
      setIsDrawing(false);
      setIsPanning(true);

      const t1 = e.touches[0];
      const t2 = e.touches[1];

      if (pinchStartDist !== null) {
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const factor = dist / pinchStartDist;
        setZoom((prev) => Math.max(0.5, Math.min(5.0, prev * factor)));
        setPinchStartDist(dist);
      }

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      setPan({ x: midX - panStart.x, y: midY - panStart.y });
      return;
    }

    if (e.touches.length === 1 && !multiTouchActiveRef.current) {
      const touch = e.touches[0];
      const pendingTouch = pendingSingleTouchRef.current;
      if (!pendingTouch) return;

      const distance = Math.hypot(touch.clientX - pendingTouch.startX, touch.clientY - pendingTouch.startY);
      pendingSingleTouchRef.current = {
        ...pendingTouch,
        lastX: touch.clientX,
        lastY: touch.clientY,
        moved: pendingTouch.moved || distance > 3,
      };

      if (activeTool === "bucket" || activeTool === "picker") return;

      if (!isDrawing) {
        handleDrawStart(pendingTouch.startX, pendingTouch.startY);
      }
      handleDrawMove(touch.clientX, touch.clientY);
    }
  };

  const handleMobileTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length > 0) {
      if (multiTouchActiveRef.current) {
        setIsDrawing(false);
      }
      return;
    }

    if (multiTouchActiveRef.current || isPanning) {
      multiTouchActiveRef.current = false;
      pendingSingleTouchRef.current = null;
      setIsDrawing(false);
      setIsPanning(false);
      setPinchStartDist(null);
      return;
    }

    const pendingTouch = pendingSingleTouchRef.current;
    pendingSingleTouchRef.current = null;

    if (pendingTouch && !pendingTouch.moved) {
      handleDrawStart(pendingTouch.startX, pendingTouch.startY);
      handleDrawEnd();
      return;
    }

    handleDrawEnd();
  };

  // 9. CONCLUSÃO E CELEBRAÇÃO (CONFETE E CONQUISTAS)
  const handleCompleteDrawing = async () => {
    if (!painting) return;
    const paintCanvas = paintCanvasRef.current;
    const canvasData = paintCanvas?.toDataURL() || painting.canvasData;

    // Atualizar no IndexedDB que está concluído
    await db.paintings.update(painting.id, {
      canvasData,
      baseImagePath: drawing.path,
      isCompleted: 1,
      completedAt: Date.now(),
      progress: 100,
      updatedAt: Date.now(),
    });

    setPainting((prev) => prev ? { ...prev, canvasData, baseImagePath: drawing.path, isCompleted: 1, progress: 100 } : null);

    // Rodar conquistas
    await triggerDrawingCompleted();
    
    // Disparar confetes!
    triggerConfetti();

    // Tocar som de celebração
    if (soundOn) playCompleteSound();

    // Abrir Modal de Conclusão
    setIsCompletedModalOpen(true);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    const list = [];
    const colors = ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#007AFF", "#7557FF", "#FF2D55", "#D2AD55"];
    
    for (let i = 0; i < 80; i++) {
      list.push({
        id: i,
        left: Math.random() * 100, // porcentagem
        delay: Math.random() * 2,  // segundos
        duration: 3 + Math.random() * 2, // segundos de queda
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setConfettis(list);
  };

  const handleDownloadFromModal = () => {
    if (!painting) return;
    
    const outlineImg = new Image();
    outlineImg.src = drawing.path;

    const downloadCanvas = (canvas: HTMLCanvasElement) => {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${painting.title}.png`;
      link.click();
    };

    const drawOutlineOverPaint = (
      ctx: CanvasRenderingContext2D,
      outlineImg: HTMLImageElement,
      width: number,
      height: number
    ) => {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(outlineImg, 0, 0, width, height);
      ctx.restore();
    };

    outlineImg.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = outlineImg.naturalWidth || 800;
      canvas.height = outlineImg.naturalHeight || 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentPaintCanvas = paintCanvasRef.current;
      if (currentPaintCanvas && currentPaintCanvas.width > 0 && currentPaintCanvas.height > 0) {
        ctx.drawImage(currentPaintCanvas, 0, 0, canvas.width, canvas.height);
        drawOutlineOverPaint(ctx, outlineImg, canvas.width, canvas.height);
        downloadCanvas(canvas);
        return;
      }

      if (!painting.canvasData) {
        ctx.drawImage(outlineImg, 0, 0, canvas.width, canvas.height);
        downloadCanvas(canvas);
        return;
      }

      const paintImg = new Image();
      paintImg.onload = () => {
        ctx.drawImage(paintImg, 0, 0, canvas.width, canvas.height);
        drawOutlineOverPaint(ctx, outlineImg, canvas.width, canvas.height);
        downloadCanvas(canvas);
      };
      paintImg.src = painting.canvasData;
    };
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center gap-5 p-6">
        <img
          src="/pagina-carregamento.png"
          alt="Carregando"
          className="w-full max-w-xs sm:max-w-sm h-auto object-contain"
        />
        <RefreshCw className="w-8 h-8 text-purple animate-spin" />
      </div>
    );
  }

  if (error || !painting || !drawing) {
    return (
      <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Star className="w-12 h-12 text-red-accent animate-pulse" />
        <h3 className="text-2xl font-bold font-fredoka">Ops! Desenho não encontrado</h3>
        <p className="text-gray-400 text-sm max-w-sm font-sans">
          Esse desenho não pôde ser carregado. Pode ter sido apagado do IndexedDB.
        </p>
        <button
          onClick={() => router.push("/drawings")}
          className="bg-purple text-white font-fredoka px-6 py-3 rounded-xl font-bold btn-kid"
        >
          Voltar para Desenhos
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-bg-dark text-white flex flex-col select-none relative pb-36 md:pb-0 ${
        isContrast ? "border-4 border-purple" : ""
      }`}
    >
      {/* 1. TOP HEADER (Editor Controls) */}
      <header className="h-16 bg-bg-card border-b border-gray-800 flex items-center justify-between px-4 md:px-6 z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/drawings")}
            className="w-10 h-10 rounded-xl bg-bg-dark hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
            style={{ minWidth: isLargeButtons ? "48px" : "40px", minHeight: isLargeButtons ? "48px" : "40px" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="font-bold font-fredoka text-sm md:text-md text-white tracking-wide">
              {painting.title}
            </h1>
            <p className="text-[10px] text-gray-500 font-sans">
              Baseado em: {drawing.name}
            </p>
          </div>
        </div>

        {/* Undo, Redo, Save Status */}
        <div className="flex items-center gap-2">
          {/* Status do Autosave */}
          <div className="hidden xs:flex items-center gap-1.5 px-3 py-1 bg-bg-dark/65 rounded-full border border-gray-850 text-[10px] font-fredoka font-semibold text-gray-400">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === "salvando"
                  ? "bg-yellow-accent animate-ping"
                  : saveStatus === "salvo"
                  ? "bg-green-accent"
                  : "bg-red-accent"
              }`}
            ></div>
            {saveStatus === "salvando" ? "Salvando..." : saveStatus === "salvo" ? "Salvo local" : "Erro ao salvar"}
          </div>

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length <= 1}
            title="Desfazer (Ctrl + Z)"
            className="w-10 h-10 rounded-xl bg-bg-dark hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
            style={{ minWidth: isLargeButtons ? "48px" : "40px", minHeight: isLargeButtons ? "48px" : "40px" }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="Refazer (Ctrl + Shift + Z)"
            className="w-10 h-10 rounded-xl bg-bg-dark hover:bg-gray-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
            style={{ minWidth: isLargeButtons ? "48px" : "40px", minHeight: isLargeButtons ? "48px" : "40px" }}
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Limpar Tudo */}
          <button
            onClick={handleClearCanvas}
            title="Recomeçar desenho do zero"
            className="w-10 h-10 rounded-xl bg-red-accent/15 hover:bg-red-accent text-red-accent hover:text-white flex items-center justify-center transition-all cursor-pointer"
            style={{ minWidth: isLargeButtons ? "48px" : "40px", minHeight: isLargeButtons ? "48px" : "40px" }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <span className="w-px h-6 bg-gray-800 mx-1"></span>

          {/* Modo Zen */}
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            title="Modo Zen (oculta barras)"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isZenMode ? "bg-purple text-white shadow-lg shadow-purple/20" : "bg-bg-dark hover:bg-gray-800 text-gray-400"
            }`}
            style={{ minWidth: isLargeButtons ? "48px" : "40px", minHeight: isLargeButtons ? "48px" : "40px" }}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            title="Alternar Tela Cheia"
            className="hidden sm:flex w-10 h-10 rounded-xl bg-bg-dark hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
            style={{ minWidth: isLargeButtons ? "48px" : "40px", minHeight: isLargeButtons ? "48px" : "40px" }}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Concluir */}
          <button
            onClick={handleCompleteDrawing}
            className="bg-green-accent hover:bg-green-accent/90 text-white font-fredoka font-bold text-sm px-4 h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-green-accent/25 transition-all btn-kid cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Concluir
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT (Workspace: Left Toolbar, Canvas, Right Palettes) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT TOOLBAR (Desktop, ocultável no Modo Zen) */}
        {!isZenMode && (
          <aside className="hidden md:flex flex-col items-center w-20 bg-bg-card border-r border-gray-800 p-4 justify-between shrink-0 select-none">
            <div className="flex flex-col gap-3 w-full">
              {/* Balde */}
              <button
                onClick={() => setTool("bucket")}
                title="Balde de Tinta (Preenchimento de Área)"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === "bucket" ? "bg-purple text-white shadow-lg shadow-purple/25" : "bg-bg-dark hover:bg-gray-800 text-gray-400"
                }`}
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <PaintBucket className="w-5 h-5" />
              </button>

              {/* Pincel */}
              <button
                onClick={() => setTool("brush")}
                title="Pincel Clássico"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === "brush" ? "bg-purple text-white shadow-lg shadow-purple/25" : "bg-bg-dark hover:bg-gray-800 text-gray-400"
                }`}
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <Brush className="w-5 h-5" />
              </button>

              {/* Lápis */}
              <button
                onClick={() => setTool("pencil")}
                title="Lápis Fino"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === "pencil" ? "bg-purple text-white shadow-lg shadow-purple/25" : "bg-bg-dark hover:bg-gray-800 text-gray-400"
                }`}
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <PenTool className="w-5 h-5" />
              </button>

              {/* Marcador */}
              <button
                onClick={() => setTool("marker")}
                title="Marcador de Texto"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === "marker" ? "bg-purple text-white shadow-lg shadow-purple/25" : "bg-bg-dark hover:bg-gray-800 text-gray-400"
                }`}
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <Highlighter className="w-5 h-5" />
              </button>

              {/* Borracha */}
              <button
                onClick={() => setTool("eraser")}
                title="Borracha de Pintura"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === "eraser" ? "bg-purple text-white shadow-lg shadow-purple/25" : "bg-bg-dark hover:bg-gray-800 text-gray-400"
                }`}
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <Eraser className="w-5 h-5" />
              </button>

              {/* Conta Gotas */}
              <button
                onClick={() => setTool("picker")}
                title="Conta-gotas"
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  activeTool === "picker" ? "bg-purple text-white shadow-lg shadow-purple/25" : "bg-bg-dark hover:bg-gray-800 text-gray-400"
                }`}
                style={{ minWidth: "48px", minHeight: "48px" }}
              >
                <Pipette className="w-5 h-5" />
              </button>
            </div>

            {/* Brush Size / Opacity slider trigger (Vertical) */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-fredoka font-semibold text-gray-500">Tamanho</span>
              <input
                type="range"
                min="2"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer -rotate-90 origin-center my-8 accent-purple"
              />
              <span className="text-[10px] font-fredoka font-bold text-gray-400">{brushSize}px</span>
            </div>
          </aside>
        )}

        {/* CANVAS WORKSPACE (Center) */}
        <section
          className="flex-1 bg-bg-dark relative overflow-hidden flex items-center justify-center cursor-crosshair select-none touch-none"
          style={{ touchAction: "none" }}
        >
          {/* Zoom & Pan floating controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-bg-card/80 backdrop-blur-sm border border-gray-800 p-1.5 rounded-2xl z-20">
            <button
              onClick={() => adjustZoom(0.25)}
              className="w-9 h-9 rounded-xl bg-bg-dark hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
              style={{ minWidth: "36px", minHeight: "36px" }}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-fredoka font-bold px-1 min-w-[36px] text-center text-gray-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => adjustZoom(-0.25)}
              className="w-9 h-9 rounded-xl bg-bg-dark hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
              style={{ minWidth: "36px", minHeight: "36px" }}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomReset}
              className="w-9 h-9 rounded-xl bg-bg-dark hover:bg-gray-800 flex items-center justify-center text-xs font-fredoka font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
              style={{ minWidth: "36px", minHeight: "36px" }}
            >
              100%
            </button>
          </div>

          {/* DUAL CANVAS WRAPPER (Handles Drag/Scale CSS transforms) */}
          <div
            className="relative bg-white shadow-2xl rounded-2xl flex items-center justify-center origin-center select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isPanning ? "none" : "transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              // Definir tamanho baseado nas proporções originais
              aspectRatio: canvasAspectRatio,
              ...(isCanvasLandscape
                ? { width: "min(90vw, 90vh - 12rem)" }
                : { height: "min(90vw, 90vh - 12rem)" }),
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMobileTouchStart}
            onTouchMove={handleMobileTouchMove}
            onTouchEnd={handleMobileTouchEnd}
            onTouchCancel={handleMobileTouchEnd}
          >
            {/* 1. Paint Canvas (Bottom Layer) */}
            <canvas
              ref={paintCanvasRef}
              className="w-full h-full object-contain rounded-2xl absolute inset-0 pointer-events-none"
            />

            {/* 2. Drawing Outline Image (Top Layer) */}
            <img
              src={drawing.path}
              alt={drawing.name}
              className="w-full h-full object-contain absolute inset-0 pointer-events-none mix-blend-multiply select-none"
              style={{ userSelect: "none" }}
            />

            {/* Hidden Outline Canvas for pixel reading */}
            <canvas ref={hiddenOutlineCanvasRef} className="hidden" />
          </div>

        </section>

        {/* RIGHT PALETTE (Desktop, ocultável no Modo Zen) */}
        {!isZenMode && (
          <aside className="hidden lg:flex flex-col w-72 bg-bg-card border-l border-gray-800 p-6 space-y-6 shrink-0 overflow-y-auto select-none">
            {/* Color preview and fav color */}
            <div className="flex items-center justify-between bg-bg-dark p-4 rounded-2xl border border-gray-800">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl border border-white/20 shadow-md shrink-0"
                  style={{ backgroundColor: activeColor }}
                />
                <div>
                  <p className="font-fredoka font-bold text-sm text-white">Cor Ativa</p>
                  <p className="text-[10px] font-mono text-gray-500 uppercase">{activeColor}</p>
                </div>
              </div>
              <button
                onClick={toggleFavoriteColor}
                title="Favoritar Cor"
                className="w-9 h-9 rounded-xl bg-bg-card hover:bg-gray-800 border border-gray-850 flex items-center justify-center text-gray-400 hover:text-red-accent transition-all cursor-pointer"
                style={{ minWidth: "36px", minHeight: "36px" }}
              >
                <Heart
                  className={`w-4 h-4 ${favoriteColors.includes(activeColor) ? "fill-red-accent text-red-accent" : ""}`}
                />
              </button>
            </div>

            {/* Custom color picker grid */}
            <div className="space-y-3">
              <p className="font-fredoka text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple" />
                Paletas Prontas
              </p>
              
              <div className="space-y-4">
                {colorPalettes.map((palette) => (
                  <div key={palette.name} className="space-y-1.5">
                    <span className="text-[10px] font-fredoka font-semibold text-gray-400">{palette.name}</span>
                    <div className="grid grid-cols-8 gap-1.5">
                      {palette.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleSelectColor(color)}
                          className={`w-6 aspect-square rounded-lg transition-transform hover:scale-115 active:scale-90 border border-white/5 cursor-pointer ${
                            activeColor === color ? "ring-2 ring-purple ring-offset-2 ring-offset-bg-card scale-110" : ""
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite colors */}
            {favoriteColors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-850">
                <span className="text-[10px] font-fredoka font-semibold text-gray-400 flex items-center gap-1">
                  ❤️ Minhas Cores Favoritas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {favoriteColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSelectColor(color)}
                      className={`w-6 aspect-square rounded-lg border border-white/5 cursor-pointer ${
                        activeColor === color ? "ring-2 ring-purple ring-offset-2 ring-offset-bg-card scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent colors */}
            {recentColors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-850">
                <span className="text-[10px] font-fredoka font-semibold text-gray-400 flex items-center gap-1">
                  🕒 Recentes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recentColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleSelectColor(color)}
                      className={`w-6 aspect-square rounded-lg border border-white/5 cursor-pointer ${
                        activeColor === color ? "ring-2 ring-purple ring-offset-2 ring-offset-bg-card scale-110" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 3. MOBILE BAR CONTROLS (Oculto no Modo Zen) */}
      {!isZenMode && (
        <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-gray-800 px-4 py-3 z-50 select-none flex flex-col gap-3">
          {/* Paletas de Cores Rápida Mobile */}
          <div className="hidden">
            {colorPalettes[0].colors.map((color) => (
              <button
                key={color}
                onClick={() => handleSelectColor(color)}
                className={`w-8 h-8 rounded-full shrink-0 border border-white/10 transition-transform active:scale-90 cursor-pointer ${
                  activeColor === color ? "ring-2 ring-purple ring-offset-2 ring-offset-bg-card scale-110" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            {/* Botão de abrir painel deslizante de cores adicionais se quiser, ou mostrar todas as paletas em scroll */}
            <span className="w-px h-6 bg-gray-800 shrink-0"></span>
            {colorPalettes[2].colors.map((color) => (
              <button
                key={color}
                onClick={() => handleSelectColor(color)}
                className={`w-8 h-8 rounded-full shrink-0 border border-white/10 transition-transform active:scale-90 cursor-pointer ${
                  activeColor === color ? "ring-2 ring-purple ring-offset-2 ring-offset-bg-card scale-110" : ""
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl border border-white/20 shrink-0"
              style={{ backgroundColor: activeColor }}
            />
            <button
              onClick={toggleFavoriteColor}
              title="Favoritar Cor"
              className="w-9 h-9 rounded-xl bg-bg-dark border border-gray-850 flex items-center justify-center text-gray-400 active:scale-95 cursor-pointer shrink-0"
              style={{ minWidth: "36px", minHeight: "36px" }}
            >
              <Heart
                className={`w-4 h-4 ${favoriteColors.includes(activeColor) ? "fill-red-accent text-red-accent" : ""}`}
              />
            </button>
            <div className="flex-1 min-w-0 overflow-x-auto overscroll-x-contain scrollbar-none py-1 px-1">
              <div className="flex items-center gap-2 w-max">
                {[...colorPalettes.flatMap((palette) => palette.colors), ...favoriteColors, ...recentColors].map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    onClick={() => handleSelectColor(color)}
                    className={`w-9 h-9 rounded-xl shrink-0 border border-white/10 transition-transform active:scale-90 cursor-pointer ${
                      activeColor === color ? "ring-2 ring-purple ring-offset-2 ring-offset-bg-card scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ferramentas Mobile */}
          <div className="flex items-center justify-around">
            {/* Balde */}
            <button
              onClick={() => setTool("bucket")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTool === "bucket" ? "text-purple scale-110 font-bold" : "text-gray-400"
              }`}
            >
              <PaintBucket className="w-6 h-6" />
              <span className="text-[9px] font-fredoka mt-0.5">Balde</span>
            </button>

            {/* Pincel */}
            <button
              onClick={() => setTool("brush")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTool === "brush" ? "text-purple scale-110 font-bold" : "text-gray-400"
              }`}
            >
              <Brush className="w-6 h-6" />
              <span className="text-[9px] font-fredoka mt-0.5">Pincel</span>
            </button>

            {/* Borracha */}
            <button
              onClick={() => setTool("eraser")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTool === "eraser" ? "text-purple scale-110 font-bold" : "text-gray-400"
              }`}
            >
              <Eraser className="w-6 h-6" />
              <span className="text-[9px] font-fredoka mt-0.5">Apagar</span>
            </button>

            {/* Conta Gotas */}
            <button
              onClick={() => setTool("picker")}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all cursor-pointer ${
                activeTool === "picker" ? "text-purple scale-110 font-bold" : "text-gray-400"
              }`}
            >
              <Pipette className="w-6 h-6" />
              <span className="text-[9px] font-fredoka mt-0.5">Conta-gotas</span>
            </button>
            
            <span className="w-px h-6 bg-gray-800"></span>

            {/* Brush Size Controls Mobile (Quick increment) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBrushSize((prev) => Math.max(4, prev - 4))}
                className="w-8 h-8 bg-bg-dark border border-gray-800 rounded-xl text-xs font-bold font-fredoka flex items-center justify-center active:scale-95 cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-fredoka font-bold text-gray-300 min-w-[28px] text-center">
                {brushSize}
              </span>
              <button
                onClick={() => setBrushSize((prev) => Math.min(50, prev + 4))}
                className="w-8 h-8 bg-bg-dark border border-gray-800 rounded-xl text-xs font-bold font-fredoka flex items-center justify-center active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* 4. MODAL DE CONCLUSÃO & CELEBRAÇÃO */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          {/* Confetti Falling Layer */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {confettis.map((c) => (
                <div
                  key={c.id}
                  className="absolute top-0 w-2.5 h-2.5 rounded-sm opacity-90 animate-fall"
                  style={{
                    left: `${c.left}%`,
                    animationDelay: `${c.delay}s`,
                    animationDuration: `${c.duration}s`,
                    backgroundColor: c.color,
                    animationFillMode: "both",
                    // Custom keyframe falling styles
                    transform: `rotate(${Math.random() * 360}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="bg-bg-card border border-gold/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative space-y-6 z-20 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-gold/15 border border-gold/30 mx-auto flex items-center justify-center text-gold relative animate-bounce">
              <Trophy className="w-10 h-10" />
              <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-yellow-accent animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-bold font-fredoka text-gold leading-tight">Parabéns João Gabriel!</h3>
              <p className="text-xl font-bold font-fredoka text-white">Sua pintura ficou incrível! ⭐</p>
              <p className="text-sm text-gray-400 font-sans max-w-sm mx-auto leading-relaxed">
                Você coloriu com muito capricho o desenho <strong>{drawing.name}</strong> e adicionou uma linda obra à sua galeria.
              </p>
            </div>

            {/* Painting miniature frame */}
            <div className="aspect-[4/3] bg-white rounded-2xl border-4 border-gold p-2 max-w-[260px] mx-auto flex items-center justify-center relative overflow-hidden shadow-xl">
              <img
                src={painting.canvasData}
                alt="Pintura final"
                className="w-full h-full object-contain absolute z-10"
              />
              <img
                src={drawing.path}
                alt="Outline base"
                className="w-full h-full object-contain opacity-25 absolute"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleDownloadFromModal}
                className="w-full bg-green-accent hover:bg-green-accent/90 text-white font-fredoka font-bold py-3.5 px-6 rounded-2xl text-md flex items-center justify-center gap-2 shadow-lg shadow-green-accent/20 btn-kid cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Salvar Imagem no Aparelho
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsCompletedModalOpen(false)}
                  className="bg-bg-dark border border-gray-800 hover:bg-gray-800 text-gray-300 font-fredoka py-3 rounded-2xl text-sm font-semibold transition-all btn-kid cursor-pointer"
                >
                  Continuar Editando
                </button>
                <button
                  onClick={() => router.push("/drawings")}
                  className="bg-purple hover:bg-purple/90 text-white font-fredoka py-3 rounded-2xl text-sm font-bold transition-all btn-kid cursor-pointer"
                >
                  Ver Outros Desenhos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind CSS inline confetti animations styles */}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
        @keyframes scaleUp {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}
