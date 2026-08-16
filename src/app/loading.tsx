import { RefreshCw } from "lucide-react";

export default function Loading() {
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
