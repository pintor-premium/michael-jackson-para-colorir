import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import "./globals.css";
import { appConfig } from "@/constants/appConfig";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0b0d14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: `${appConfig.appName} — ${appConfig.appSubtitle}`,
  description: "Um livro de colorir divertido, interativo e 100% offline para crianças e fãs de todas as idades.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: appConfig.appName,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${fredoka.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg-dark text-white flex flex-col font-sans select-none">
        {children}
      </body>
    </html>
  );
}
