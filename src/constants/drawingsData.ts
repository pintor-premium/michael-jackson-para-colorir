export interface Collection {
  id: string;
  name: string;
  description: string;
  coverImage: string;
}

export interface Drawing {
  id: string;
  name: string;
  description: string;
  path: string;
  collectionId: string;
  difficulty: "Fácil" | "Médio" | "Difícil";
  estimatedTime: string;
  order: number;
  status: "active" | "inactive";
  freePlayAvailable: boolean;
  floodFillAvailable: boolean;
}

export interface Palette {
  name: string;
  colors: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  targetCount: number;
  targetType: "drawings_completed" | "favorites_added" | "days_coloring" | "zen_mode_time";
}

export const collectionsData: Collection[] = [
  {
    id: "silhouettes",
    name: "Silhuetas e Poses",
    description: "Primeira seleção de desenhos novos para colorir.",
    coverImage: "/drawings/michael/desenho-19.jpg",
  },
  {
    id: "stage",
    name: "Palco e Luz",
    description: "Segunda seleção de desenhos novos para colorir.",
    coverImage: "/drawings/michael/desenho-04.jpg",
  },
  {
    id: "dance",
    name: "Dança e Movimento",
    description: "Terceira seleção de desenhos novos para colorir.",
    coverImage: "/drawings/michael/desenho-08.jpg",
  },
  {
    id: "fashion",
    name: "Moda e Figurinos",
    description: "Quarta seleção de desenhos novos para colorir.",
    coverImage: "/drawings/michael/desenho-12.jpg",
  },
  {
    id: "patterns",
    name: "Ícones e Padrões",
    description: "Última seleção de desenhos novos para colorir.",
    coverImage: "/drawings/michael/desenho-16.jpg",
  },
];

const newDrawingFiles = [
  { id: "silhouette_1", file: "desenho-19.jpg", collectionId: "silhouettes" },
  { id: "silhouette_2", file: "desenho-01.jpg", collectionId: "silhouettes" },
  { id: "silhouette_3", file: "desenho-02.jpg", collectionId: "silhouettes" },
  { id: "silhouette_4", file: "desenho-03.jpg", collectionId: "silhouettes" },
  { id: "stage_1", file: "desenho-04.jpg", collectionId: "stage" },
  { id: "stage_2", file: "desenho-05.jpg", collectionId: "stage" },
  { id: "stage_3", file: "desenho-06.jpg", collectionId: "stage" },
  { id: "stage_4", file: "desenho-07.jpg", collectionId: "stage" },
  { id: "dance_1", file: "desenho-08.jpg", collectionId: "dance" },
  { id: "dance_2", file: "desenho-09.jpg", collectionId: "dance" },
  { id: "dance_3", file: "desenho-10.jpg", collectionId: "dance" },
  { id: "dance_4", file: "desenho-11.jpg", collectionId: "dance" },
  { id: "fashion_1", file: "desenho-12.jpg", collectionId: "fashion" },
  { id: "fashion_2", file: "desenho-13.jpg", collectionId: "fashion" },
  { id: "fashion_3", file: "desenho-14.jpg", collectionId: "fashion" },
  { id: "fashion_4", file: "desenho-15.jpg", collectionId: "fashion" },
  { id: "patterns_1", file: "desenho-16.jpg", collectionId: "patterns" },
  { id: "patterns_2", file: "desenho-17.jpg", collectionId: "patterns" },
  { id: "patterns_3", file: "desenho-18.jpg", collectionId: "patterns" },
] as const;

const difficultyByOrder: Drawing["difficulty"][] = ["Fácil", "Médio", "Fácil", "Difícil"];

export const drawingsData: Drawing[] = newDrawingFiles.map((drawing, index) => ({
  id: drawing.id,
  name: `Desenho ${index + 1}`,
  description: "Novo desenho para colorir.",
  path: `/drawings/michael/${drawing.file}`,
  collectionId: drawing.collectionId,
  difficulty: difficultyByOrder[index % difficultyByOrder.length],
  estimatedTime: `${8 + (index % 5)} min`,
  order: index + 1,
  status: "active",
  freePlayAvailable: true,
  floodFillAvailable: true,
}));

export const colorPalettes: Palette[] = [
  {
    name: "Cores Vibrantes",
    colors: ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF", "#5856D6", "#FF2D55"],
  },
  {
    name: "Tons Pastéis",
    colors: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BFFCC6", "#A7DBD8", "#C7CEEA", "#E8D7F1", "#F4C2D7"],
  },
  {
    name: "Tons de Palco",
    colors: ["#0B0D14", "#151B2C", "#2A1B4E", "#4B154A", "#721035", "#D2AD55", "#FFD84D", "#7557FF"],
  },
  {
    name: "Dourado e Preto",
    colors: ["#000000", "#1A1A1A", "#333333", "#666666", "#999999", "#D2AD55", "#F2D07B", "#FFFFFF"],
  },
  {
    name: "Azul e Roxo",
    colors: ["#0D0B1C", "#1D1936", "#322E5C", "#4C4687", "#6D64C5", "#8E85E3", "#B1A7F8", "#DCD6FF"],
  },
  {
    name: "Arco-Íris",
    colors: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3", "#FFFFFF"],
  },
  {
    name: "Tons de Pele",
    colors: ["#FFDFC4", "#F0C7A1", "#E0A890", "#C68642", "#8D5524", "#613D1A", "#3B220B", "#F6D0B1"],
  },
  {
    name: "Cores Especiais",
    colors: ["#FFD700", "#C0C0C0", "#E5E4E2", "#A3C1AD", "#6E260E", "#0047AB", "#A45A52", "#131313"],
  },
];

export const achievementsData: Achievement[] = [
  {
    id: "first_painting",
    name: "Minha Primeira Pintura",
    description: "Você coloriu o seu primeiro desenho do astro!",
    iconName: "Palette",
    targetCount: 1,
    targetType: "drawings_completed",
  },
  {
    id: "beginner_artist",
    name: "Artista Iniciante",
    description: "Coloriu 3 desenhos com capricho.",
    iconName: "Brush",
    targetCount: 3,
    targetType: "drawings_completed",
  },
  {
    id: "five_completed",
    name: "Cinco Estrelas",
    description: "Coloriu 5 desenhos incríveis!",
    iconName: "Star",
    targetCount: 5,
    targetType: "drawings_completed",
  },
  {
    id: "ten_completed",
    name: "Mestre Pintor",
    description: "Uau! Completou 10 pinturas brilhantes!",
    iconName: "Trophy",
    targetCount: 10,
    targetType: "drawings_completed",
  },
  {
    id: "color_master",
    name: "Mestre das Cores",
    description: "Usou cores em 15 desenhos no total.",
    iconName: "Sparkles",
    targetCount: 15,
    targetType: "drawings_completed",
  },
  {
    id: "palette_explorer",
    name: "Explorador de Paletas",
    description: "Adicionou 5 desenhos aos seus favoritos.",
    iconName: "Heart",
    targetCount: 5,
    targetType: "favorites_added",
  },
  {
    id: "zen_artist",
    name: "Artista Zen",
    description: "Coloriu por mais de 5 minutos sem pressa.",
    iconName: "Moon",
    targetCount: 300,
    targetType: "zen_mode_time",
  },
  {
    id: "collection_complete",
    name: "Coleção Completa",
    description: "Coloriu todos os desenhos de uma mesma coleção.",
    iconName: "Award",
    targetCount: 1,
    targetType: "drawings_completed",
  },
  {
    id: "three_days_active",
    name: "3 Dias Colorindo",
    description: "Abriu o livro e coloriu por 3 dias seguidos.",
    iconName: "Calendar",
    targetCount: 3,
    targetType: "days_coloring",
  },
  {
    id: "seven_days_active",
    name: "Super Dedicado!",
    description: "Que constância! Colorindo por 7 dias seguidos.",
    iconName: "Flame",
    targetCount: 7,
    targetType: "days_coloring",
  },
];
