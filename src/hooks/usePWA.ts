"use client";

import { useEffect, useState } from "react";

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Impede o mini-infobar padrão no mobile
      e.preventDefault();
      // Salva o evento para ser disparado posteriormente
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Verificar se o app já está rodando em modo autônomo (standalone)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return false;
    
    // Exibe a tela de confirmação de instalação do próprio navegador
    installPrompt.prompt();
    
    // Aguarda a resposta do usuário
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstallable(false);
      return true;
    }
    
    return false;
  };

  return { isInstallable, installApp };
}
