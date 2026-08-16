"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image, Palette, Trophy, Settings, Music, Sparkles } from "lucide-react";
import { appConfig } from "@/constants/appConfig";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  color: string;
}

const navItems: NavItem[] = [
  { name: "Início", href: "/", icon: Home, color: "text-blue-accent" },
  { name: "Desenhos", href: "/drawings", icon: Image, color: "text-yellow-accent" },
  { name: "Minhas Pinturas", href: "/gallery", icon: Palette, color: "text-purple" },
  { name: "Conquistas", href: "/achievements", icon: Trophy, color: "text-gold" },
  { name: "Configurações", href: "/settings", icon: Settings, color: "text-gray-light" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [soundOn, setSoundOn] = useState(true);

  // Carregar preferências de som do banco local
  useLiveQuery(async () => {
    const soundSetting = await db.settings.get("soundEnabled");
    if (soundSetting) {
      setSoundOn(soundSetting.value);
    }
  }, []);

  const playClickSound = () => {
    if (!soundOn) return;
    try {
      const audio = new Audio("/sounds/select.mp3");
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  return (
    <div className="flex min-h-screen bg-bg-dark text-white font-sans flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col w-64 bg-bg-card border-r border-gray-800 shrink-0 fixed top-0 bottom-0 left-0 z-20">
        <div className="p-6 border-b border-gray-800 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-gold animate-pulse" />
            <h1 className="text-2xl font-bold font-fredoka text-gold tracking-wide">
              {appConfig.appName}
            </h1>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Meu Livro de Colorir
          </span>
        </div>

        {/* Navigation Items Desktop */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={playClickSound}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all duration-200 card-kid cursor-pointer ${
                  isActive
                    ? "bg-purple/20 text-white border-l-4 border-purple shadow-lg"
                    : "text-gray-400 hover:bg-bg-dark hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-fredoka text-lg">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Sidebar Footer */}
        <div className="p-6 text-center border-t border-gray-800">
          <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
            {appConfig.footerMessage}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header Mobile */}
        <header className="md:hidden bg-bg-card border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold animate-bounce" />
            <h1 className="text-xl font-bold font-fredoka text-gold tracking-wide">
              {appConfig.appName}
            </h1>
          </div>
          <span className="text-xs px-3 py-1.5 bg-bg-dark text-gray-300 font-fredoka rounded-full">
            ⭐ {appConfig.childName}
          </span>
        </header>

        {/* Inner Page View */}
        <div className="flex-1 p-6 md:p-10 w-full max-w-7xl mx-auto">
          {children}
        </div>

        {/* Mobile / Tablet Footer */}
        <footer className="md:hidden p-6 text-center text-[10px] text-gray-500 border-t border-gray-800">
          {appConfig.footerMessage}
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-bg-card/95 backdrop-blur-md border-t border-gray-800 flex items-center justify-around px-4 z-40 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={playClickSound}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-200 ${
                isActive ? "text-purple scale-110" : "text-gray-400 hover:text-white"
              }`}
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              <item.icon
                className={`w-6 h-6 mb-1 ${
                  isActive ? "stroke-[2.5px] " + item.color : "stroke-[2px]"
                }`}
              />
              <span className="text-[10px] font-fredoka font-semibold tracking-wide">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
