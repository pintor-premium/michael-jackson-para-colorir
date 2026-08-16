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
  path: string; // Caminho para a imagem de contorno
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
    description: "Desenhos baseados nas silhuetas mais famosas e poses marcantes do astro.",
    coverImage: "/drawings/silhouettes/1.png",
  },
  {
    id: "stage",
    name: "Palco e Luz",
    description: "Ilustrações de performances em palcos iluminados e efeitos de holofotes.",
    coverImage: "/drawings/stage/1.png",
  },
  {
    id: "dance",
    name: "Dança e Movimento",
    description: "Desenhos inspirados em coreografias e passos de dança clássicos.",
    coverImage: "/drawings/dance/1.png",
  },
  {
    id: "fashion",
    name: "Moda e Figurinos",
    description: "Jaquetas icônicas, luvas brilhantes, chapéus e sapatos lendários.",
    coverImage: "/drawings/fashion/1.png",
  },
  {
    id: "patterns",
    name: "Ícones e Padrões",
    description: "Padrões geométricos divertidos mesclados com ícones inspiradores.",
    coverImage: "/drawings/patterns/1.png",
  },
];

export const drawingsData: Drawing[] = [
  // Silhuetas e Poses
  {
    id: "silhouette_1",
    name: "Pose Clássica na Ponta dos Pés",
    description: "O astro equilibrando-se na ponta dos sapatos com seu chapéu icônico.",
    path: "/drawings/silhouettes/1.png",
    collectionId: "silhouettes",
    difficulty: "Fácil",
    estimatedTime: "8 min",
    order: 1,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "silhouette_2",
    name: "Silhueta sob o Holofote",
    description: "A sombra marcante em contraste com uma forte luz traseira.",
    path: "/drawings/silhouettes/2.png",
    collectionId: "silhouettes",
    difficulty: "Médio",
    estimatedTime: "12 min",
    order: 2,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "silhouette_3",
    name: "O Aceno do Chapéu",
    description: "A pose de abertura do show segurando a aba do chapéu preto.",
    path: "/drawings/silhouettes/3.png",
    collectionId: "silhouettes",
    difficulty: "Fácil",
    estimatedTime: "10 min",
    order: 3,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "silhouette_4",
    name: "Estrela Inclinada",
    description: "A pose desafiadora da gravidade em um ângulo surpreendente.",
    path: "/drawings/silhouettes/4.png",
    collectionId: "silhouettes",
    difficulty: "Difícil",
    estimatedTime: "15 min",
    order: 4,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },

  // Palco e Luz
  {
    id: "stage_1",
    name: "Performance Sob a Chuva",
    description: "Efeitos mágicos de luz em um palco cheio de energia e água.",
    path: "/drawings/stage/1.png",
    collectionId: "stage",
    difficulty: "Médio",
    estimatedTime: "12 min",
    order: 5,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "stage_2",
    name: "Luzes do Espetáculo",
    description: "Cenário brilhante com refletores cruzando o palco escuro.",
    path: "/drawings/stage/2.png",
    collectionId: "stage",
    difficulty: "Fácil",
    estimatedTime: "9 min",
    order: 6,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "stage_3",
    name: "Microfone de Ouro",
    description: "O pedestal de microfone sob as luzes douradas do show.",
    path: "/drawings/stage/3.png",
    collectionId: "stage",
    difficulty: "Fácil",
    estimatedTime: "7 min",
    order: 7,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "stage_4",
    name: "Palco de Estrelas",
    description: "O astro de braços abertos agradecendo ao público brilhante.",
    path: "/drawings/stage/4.png",
    collectionId: "stage",
    difficulty: "Difícil",
    estimatedTime: "18 min",
    order: 8,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },

  // Dança e Movimento
  {
    id: "dance_1",
    name: "O Deslizar para Trás",
    description: "O movimento lendário que simula andar flutuando no espaço.",
    path: "/drawings/dance/1.png",
    collectionId: "dance",
    difficulty: "Médio",
    estimatedTime: "10 min",
    order: 9,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "dance_2",
    name: "Giro Veloz",
    description: "Efeito visual de giros rápidos com faixas de luz ao redor.",
    path: "/drawings/dance/2.png",
    collectionId: "dance",
    difficulty: "Médio",
    estimatedTime: "11 min",
    order: 10,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "dance_3",
    name: "Chute no Ar",
    description: "A pose acrobática com o pé levantado em alta velocidade.",
    path: "/drawings/dance/3.png",
    collectionId: "dance",
    difficulty: "Fácil",
    estimatedTime: "8 min",
    order: 11,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "dance_4",
    name: "Passo Sincronizado",
    description: "Coreografia em grupo desenhada com linhas simples e elegantes.",
    path: "/drawings/dance/4.png",
    collectionId: "dance",
    difficulty: "Difícil",
    estimatedTime: "14 min",
    order: 12,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },

  // Moda e Figurinos
  {
    id: "fashion_1",
    name: "A Jaqueta Vermelha",
    description: "A jaqueta icônica com zíperes que marcou a história da música.",
    path: "/drawings/fashion/1.png",
    collectionId: "fashion",
    difficulty: "Fácil",
    estimatedTime: "9 min",
    order: 13,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "fashion_2",
    name: "Luva de Cristais",
    description: "A luva única que brilha sob as luzes de qualquer teatro.",
    path: "/drawings/fashion/2.png",
    collectionId: "fashion",
    difficulty: "Fácil",
    estimatedTime: "6 min",
    order: 14,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "fashion_3",
    name: "Sapatos e Meias Brancas",
    description: "A combinação clássica que destaca os pés durante a dança.",
    path: "/drawings/fashion/3.png",
    collectionId: "fashion",
    difficulty: "Médio",
    estimatedTime: "10 min",
    order: 15,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "fashion_4",
    name: "Jaqueta Militar Dourada",
    description: "O casaco majestoso com detalhes dourados e botões brilhantes.",
    path: "/drawings/fashion/4.png",
    collectionId: "fashion",
    difficulty: "Difícil",
    estimatedTime: "16 min",
    order: 16,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },

  // Ícones e Padrões
  {
    id: "patterns_1",
    name: "Padrão de Chapéus e Luvas",
    description: "Padrão repetitivo dos dois maiores símbolos visuais do astro.",
    path: "/drawings/patterns/1.png",
    collectionId: "patterns",
    difficulty: "Médio",
    estimatedTime: "15 min",
    order: 17,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "patterns_2",
    name: "Estrelas e Notas Musicais",
    description: "Uma divertida mistura de estrelas coloridas e melodia.",
    path: "/drawings/patterns/2.png",
    collectionId: "patterns",
    difficulty: "Fácil",
    estimatedTime: "10 min",
    order: 18,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "patterns_3",
    name: "O Símbolo Coroa",
    description: "Uma coroa estilizada rodeada por notas de dança e raios.",
    path: "/drawings/patterns/3.png",
    collectionId: "patterns",
    difficulty: "Fácil",
    estimatedTime: "8 min",
    order: 19,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
  {
    id: "patterns_4",
    name: "Geometria Musical",
    description: "Linhas abstratas e silhuetas que criam uma mandala rítmica.",
    path: "/drawings/patterns/4.png",
    collectionId: "patterns",
    difficulty: "Difícil",
    estimatedTime: "18 min",
    order: 20,
    status: "active",
    freePlayAvailable: true,
    floodFillAvailable: true,
  },
];

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
    name: "Arco-íris",
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
    targetCount: 300, // 300 segundos
    targetType: "zen_mode_time",
  },
  {
    id: "collection_complete",
    name: "Coleção Completa",
    description: "Coloriu todos os desenhos de uma mesma coleção.",
    iconName: "Award",
    targetCount: 4,
    targetType: "drawings_completed", // custom logic inside
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
