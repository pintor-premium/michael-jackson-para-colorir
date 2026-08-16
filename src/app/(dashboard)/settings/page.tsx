"use client";

import { useState, useRef } from "react";
import { Settings, Volume2, ShieldAlert, Download, Upload, Trash2, HelpCircle, ToggleLeft, ToggleRight, Check, Info } from "lucide-react";
import { db } from "@/lib/db";
import { appConfig } from "@/constants/appConfig";
import { useLiveQuery } from "dexie-react-hooks";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modais de confirmação
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingBackupData, setPendingBackupData] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Carregar preferências do IndexedDB
  const preferences = useLiveQuery(async () => {
    const sound = await db.settings.get("soundEnabled");
    const vibrations = await db.settings.get("vibrationsEnabled");
    const animations = await db.settings.get("animationsEnabled");
    const contrast = await db.settings.get("highContrastEnabled");
    const buttonSize = await db.settings.get("largeButtonsEnabled");

    return {
      sound: sound ? sound.value : true,
      vibrations: vibrations ? vibrations.value : true,
      animations: animations ? animations.value : true,
      contrast: contrast ? contrast.value : false,
      buttonSize: buttonSize ? buttonSize.value : false,
    };
  });

  const prefs = preferences ?? {
    sound: true,
    vibrations: true,
    animations: true,
    contrast: false,
    buttonSize: false,
  };

  const updatePreference = async (key: string, value: any) => {
    await db.settings.put({ key, value });
    showFeedback("Configuração atualizada!");
  };

  const showFeedback = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // EXPORTAR BACKUP JSON
  const handleExportBackup = async () => {
    try {
      const paintings = await db.paintings.toArray();
      const achievements = await db.achievements.toArray();
      const settings = await db.settings.toArray();

      const backup = {
        appName: "MJColorBackup",
        version: 1,
        childName: appConfig.childName,
        timestamp: Date.now(),
        paintings,
        achievements,
        settings,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${appConfig.appName.toLowerCase().replace(/\s+/g, "_")}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showFeedback("Backup criado e baixado!");
    } catch (e) {
      alert("Não foi possível criar o backup.");
    }
  };

  // IMPORTAR BACKUP JSON
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (content.appName !== "MJColorBackup") {
          alert("Ops! Este arquivo não é um backup válido do nosso aplicativo de colorir.");
          return;
        }

        setPendingBackupData(content);
        setShowImportConfirm(true);
      } catch (err) {
        alert("Erro ao ler o arquivo. Certifique-se de que é um arquivo JSON válido.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const executeImport = async () => {
    if (!pendingBackupData) return;
    try {
      const { paintings, achievements, settings } = pendingBackupData;

      if (paintings) {
        await db.paintings.clear();
        await db.paintings.bulkPut(paintings);
      }
      if (achievements) {
        await db.achievements.clear();
        await db.achievements.bulkPut(achievements);
      }
      if (settings) {
        await db.settings.clear();
        await db.settings.bulkPut(settings);
      }

      setShowImportConfirm(false);
      setPendingBackupData(null);
      showFeedback("Backup restaurado com sucesso!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      alert("Ocorreu um erro ao restaurar o backup.");
    }
  };

  // APAGAR TODO O PROGRESSO
  const handleClearProgress = async () => {
    try {
      await db.paintings.clear();
      await db.achievements.clear();
      await db.settings.clear();
      setShowClearConfirm(false);
      showFeedback("Tudo limpo! Recomeçando...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) {
      alert("Não foi possível apagar o progresso.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <section>
        <h2 className="text-3xl font-bold font-fredoka text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-gray-400" />
          Configurações
        </h2>
        <p className="text-gray-400 text-sm mt-1 font-sans">
          Ajuste as opções de som, acessibilidade e crie cópias de segurança do seu livro de colorir.
        </p>
      </section>

      {/* Floating Success Message */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-accent text-white font-fredoka font-semibold px-6 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2 transition-opacity duration-300">
          <Check className="w-5 h-5 stroke-[2.5px]" />
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preferências Físicas */}
        <section className="bg-bg-card border border-gray-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-xl font-bold font-fredoka text-white border-b border-gray-800 pb-3 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-purple" />
            Preferências do Aplicativo
          </h3>

          <div className="space-y-4">
            {/* Efeitos Sonoros */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-fredoka text-lg font-bold text-white">Efeitos Sonoros</p>
                <p className="text-xs text-gray-500 font-sans">Toca sons fofos ao escolher cores ou terminar desenhos.</p>
              </div>
              <button
                onClick={() => updatePreference("soundEnabled", !prefs.sound)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {prefs.sound ? (
                  <ToggleRight className="w-12 h-12 text-purple" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-gray-600" />
                )}
              </button>
            </div>

            {/* Vibração */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-fredoka text-lg font-bold text-white">Vibração ao Tocar</p>
                <p className="text-xs text-gray-500 font-sans">Dá um pequeno tremor ao clicar nas ferramentas (em celulares).</p>
              </div>
              <button
                onClick={() => updatePreference("vibrationsEnabled", !prefs.vibrations)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {prefs.vibrations ? (
                  <ToggleRight className="w-12 h-12 text-purple" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-gray-600" />
                )}
              </button>
            </div>

            {/* Confete */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-fredoka text-lg font-bold text-white">Animações de Confete</p>
                <p className="text-xs text-gray-500 font-sans">Animações alegres ao terminar desenhos e conquistas.</p>
              </div>
              <button
                onClick={() => updatePreference("animationsEnabled", !prefs.animations)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {prefs.animations ? (
                  <ToggleRight className="w-12 h-12 text-purple" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-gray-600" />
                )}
              </button>
            </div>

            {/* Alto Contraste */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-fredoka text-lg font-bold text-white">Alto Contraste</p>
                <p className="text-xs text-gray-500 font-sans">Aumenta o contraste das bordas e botões da interface.</p>
              </div>
              <button
                onClick={() => updatePreference("highContrastEnabled", !prefs.contrast)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {prefs.contrast ? (
                  <ToggleRight className="w-12 h-12 text-purple" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-gray-600" />
                )}
              </button>
            </div>

            {/* Botões Gigantes */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-fredoka text-lg font-bold text-white">Botões Gigantes</p>
                <p className="text-xs text-gray-500 font-sans">Aumenta o tamanho dos botões de controle para dedos pequenos.</p>
              </div>
              <button
                onClick={() => updatePreference("largeButtonsEnabled", !prefs.buttonSize)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                {prefs.buttonSize ? (
                  <ToggleRight className="w-12 h-12 text-purple" />
                ) : (
                  <ToggleLeft className="w-12 h-12 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Gerenciamento de Backup */}
        <section className="bg-bg-card border border-gray-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-fredoka text-white border-b border-gray-800 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-yellow-accent" />
              Cópia de Segurança & Limpeza
            </h3>

            <div className="bg-yellow-accent/10 border border-yellow-accent/20 rounded-2xl p-4 flex gap-3 text-sm text-yellow-accent font-sans">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Atenção!</strong> Como este aplicativo é 100% offline, os desenhos e o progresso ficam salvos localmente. <strong>Se você limpar os dados do navegador, suas pinturas serão apagadas!</strong> Crie um backup JSON abaixo para guardar a salvo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleExportBackup}
                className="bg-purple/20 hover:bg-purple text-purple hover:text-white border border-purple/30 rounded-2xl py-3 px-4 font-fredoka font-bold text-md flex items-center justify-center gap-2 transition-all btn-kid cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                Exportar Backup
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-accent/15 hover:bg-green-accent text-green-accent hover:text-white border border-green-accent/20 rounded-2xl py-3 px-4 font-fredoka font-bold text-md flex items-center justify-center gap-2 transition-all btn-kid cursor-pointer shadow-md"
              >
                <Upload className="w-4 h-4" />
                Importar Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full bg-red-accent/10 hover:bg-red-accent text-red-accent hover:text-white border border-red-accent/20 rounded-2xl py-3.5 px-4 font-fredoka font-bold text-md flex items-center justify-center gap-2 transition-all btn-kid cursor-pointer shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              Apagar Todo o Progresso
            </button>
          </div>
        </section>
      </div>

      {/* Info Box */}
      <section className="bg-bg-card border border-gray-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="w-12 h-12 bg-bg-dark border border-gray-800 rounded-full flex items-center justify-center text-gray-400 shrink-0">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold font-fredoka text-white text-md">Sobre o Livro de Colorir</h4>
          <p className="text-gray-400 text-xs font-sans leading-relaxed">
            Aplicativo desenvolvido especialmente para diversão familiar e uso pessoal. Imagens de contorno e arquivos locais podem ser alterados nas pastas internas do projeto. Desenvolvido em Next.js e IndexedDB para máxima privacidade.
          </p>
        </div>
      </section>

      {/* MODAL CONFIRMATION: APAGAR TUDO */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-gray-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-accent">
              <div className="w-10 h-10 rounded-full bg-red-accent/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-fredoka text-white">Apagar Tudo?</h3>
            </div>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              Você tem certeza absoluta que quer apagar <strong>todas as suas pinturas e conquistas</strong>? Suas artes salvas serão excluídas para sempre do aparelho e você começará de novo!
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-fredoka rounded-xl text-sm cursor-pointer"
              >
                Manter Pinturas
              </button>
              <button
                onClick={handleClearProgress}
                className="px-5 py-2 bg-red-accent hover:bg-red-accent/90 text-white font-fredoka font-bold rounded-xl text-sm cursor-pointer"
              >
                Sim, Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION: IMPORTAR BACKUP */}
      {showImportConfirm && pendingBackupData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-gray-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-green-accent">
              <div className="w-10 h-10 rounded-full bg-green-accent/15 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-fredoka text-white">Restaurar Backup?</h3>
            </div>
            <p className="text-sm text-gray-400 font-sans leading-relaxed">
              Encontramos um backup de <strong className="text-white">{pendingBackupData.childName}</strong> criado em {new Date(pendingBackupData.timestamp).toLocaleDateString("pt-BR")}. 
              <br />
              <br />
              Ao importar, <strong>todas as pinturas atuais do dispositivo serão substituídas</strong> pelas pinturas salvas no arquivo! Quer continuar?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowImportConfirm(false);
                  setPendingBackupData(null);
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-fredoka rounded-xl text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeImport}
                className="px-5 py-2 bg-green-accent hover:bg-green-accent/90 text-white font-fredoka font-bold rounded-xl text-sm cursor-pointer"
              >
                Substituir e Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
