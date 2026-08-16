# MICHAEL JACKSON PARA COLORIR — Meu Livro de Colorir (MJ Color)

Este é um aplicativo web progressivo (PWA) de pintura digital, projetado e desenvolvido de forma **100% offline-first** para uso pessoal e familiar. Ele foi construído utilizando as tecnologias mais modernas do ecossistema web, sem qualquer dependência de servidores de terceiros, autenticação ou banco de dados remotos. Toda a pintura e o progresso do usuário são gravados de forma segura diretamente no próprio navegador.

---

## 🚀 Como Iniciar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter instalado em seu computador:
- **Node.js** (versão 18 ou superior)
- **NPM** (gerenciador de pacotes padrão)

### Passo 1: Instalar Dependências
Abra o terminal no diretório do projeto e execute:
```bash
npm install
```

### Passo 2: Executar em Modo de Desenvolvimento
Inicie o servidor de desenvolvimento local:
```bash
npm run dev
```
O aplicativo estará disponível em: `http://localhost:3000`.

---

## 🎨 Como Substituir ou Adicionar Novos Desenhos

Os desenhos do catálogo estão organizados fisicamente na pasta `/public/drawings/` e divididos em 5 categorias/coleções.

### 1. Formato Recomendado dos Desenhos
Para que o recurso de **Balde de Preenchimento (Flood Fill)** funcione perfeitamente:
- **Tipo de Arquivo**: Imagem em formato **PNG**.
- **Resolução Ideal**: Recomenda-se imagens quadradas (ex: `800x800` pixels) para melhor proporção em telas de celulares e tablets.
- **Traço (Contorno)**: O desenho deve ser estilo "Line-Art", com linhas pretas ou escuras e fundo preferencialmente transparente ou branco puro (`#ffffff`). Quanto mais fechadas as áreas do traço, melhor será a precisão do preenchimento de cores.

### 2. Organizar as Imagens nas Pastas
Cole as novas imagens PNG nas respectivas subpastas em `/public/drawings/`:
- `silhouettes/` — Silhuetas e Poses
- `stage/` — Palco e Luz
- `dance/` — Dança e Movimento
- `fashion/` — Moda e Figurinos
- `patterns/` — Ícones e Padrões

### 3. Cadastrar no Arquivo de Configuração
Após colar o arquivo de imagem (ex: `meu_desenho.png` em `public/drawings/silhouettes/`), você deve cadastrá-lo no arquivo de controle TypeScript para que o catálogo o liste.

Abra o arquivo [`src/constants/drawingsData.ts`](file:///c:/Users/sandr/Desktop/APP%20MICHAEL%20JACKSON%20PARA%20COLORIR/codigo-app-michael/src/constants/drawingsData.ts) e edite o array `drawingsData`:
```typescript
{
  id: "identificador_unico_do_desenho",
  name: "Nome Bonito para a Criança ver",
  description: "Uma breve descrição divertida sobre o desenho.",
  path: "/drawings/silhouettes/meu_desenho.png", // Caminho correto do arquivo
  collectionId: "silhouettes", // Id da coleção correspondente
  difficulty: "Fácil", // 'Fácil' | 'Médio' | 'Difícil'
  estimatedTime: "10 min",
  order: 21, // Número de ordenação no catálogo
  status: "active",
  freePlayAvailable: true,
  floodFillAvailable: true,
}
```
*Obs: O aplicativo requer exatamente **20 desenhos** ativos para o layout demonstrativo atual passar nos testes de integridade.*

---

## ⚙️ Como Personalizar o Nome da Criança e Títulos

Você pode alterar os títulos do app, mensagem de boas-vindas e o nome da criança de forma centralizada.

Abra o arquivo [`src/constants/appConfig.ts`](file:///c:/Users/sandr/Desktop/APP%20MICHAEL%20JACKSON%20PARA%20COLORIR/codigo-app-michael/src/constants/appConfig.ts) e altere as variáveis:
```typescript
export const appConfig = {
  appName: "Michael Jackson", // Título principal do cabeçalho
  appSubtitle: "MJ Color — Meu Livro de Colorir",
  childName: "João Gabriel", // Nome do seu filho exibido no app
  welcomeMessage: "Olá João Gabriel! Vamos colorir?", // Mensagem de boas-vindas do topo
  footerMessage: "Projeto pessoal e não oficial, criado exclusivamente para uso familiar.",
  enableSounds: true,
  enableAchievements: true,
  enableOfflineMode: true,
};
```

---

## 💾 Armazenamento Local, Limitações e Backups

### Como funciona o salvamento local?
As pinturas são gravadas no banco de dados local do navegador chamado **IndexedDB**, através da biblioteca **Dexie.js**. É um banco de dados persistente, rápido e seguro. O progresso é salvo automaticamente a cada traço ou preenchimento concluído no canvas e ao sair da página.

### Limitações do Armazenamento
- O IndexedDB é associado ao navegador específico e ao dispositivo em que está sendo usado.
- **Importante**: Se os dados de navegação forem limpos pelo usuário (limpar histórico, limpar cache, restaurar navegador), as pinturas em andamento serão perdidas.

### Como criar e restaurar backups?
Para evitar perdas de dados:
1. Vá na tela de **Configurações**.
2. Clique em **Exportar Backup**. Um arquivo `.json` com todas as pinturas e conquistas será baixado no dispositivo.
3. Se mudar de aparelho ou precisar limpar o navegador, volte em Configurações, clique em **Importar Backup** e selecione o arquivo gerado para restaurar todo o progresso!

---

## 📲 Como Instalar o Aplicativo (PWA)

O aplicativo está totalmente configurado como uma PWA (Progressive Web App).

### No Celular (Android / Chrome)
1. Acesse o endereço do aplicativo publicado.
2. O navegador exibirá um botão ou banner flutuante para instalar.
3. Se não aparecer automaticamente, toque nos 3 pontinhos do menu do Chrome e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.

### No iPhone (iOS / Safari)
1. Abra o site no Safari.
2. Toque no botão de **Compartilhar** (ícone com quadrado e seta para cima).
3. Role a lista e selecione **"Adicionar à Tela de Início"**.

### No Computador (Chrome / Edge)
1. Um pequeno ícone de monitor com uma seta de download aparecerá no canto direito da barra de endereços do navegador.
2. Clique nele ou vá em Configurações (3 pontinhos) e clique em **"Instalar Michael Jackson"**.

---

## 🧪 Como Executar Testes

Desenvolvemos duas baterias de testes:

### 1. Testes de Integridade (CLI no terminal)
Verifica se as chaves, caminhos dos arquivos físicos e contagem de desenhos estão corretos para evitar builds com links quebrados.
Execute:
```bash
npm run test
```

### 2. Testes de Fluxo Interativos (Visual no navegador)
Executa simulações reais das ferramentas de pintura (pincel, desfazer/refazer, flood fill), conexões IndexedDB e backup/restore no navegador.
1. Abra o app no navegador.
2. Acesse a rota secreta de testes digitando `/test` na barra de endereços (ex: `http://localhost:3000/test`).
3. Clique em **"Executar Testes de Sistema"** e assista a simulação rodar em tempo real.

---

## 🏗️ Build de Produção

Para gerar o build de produção compilado e minificado:
```bash
npm run build
```

---

## ☁️ Como Publicar na Vercel

O projeto foi totalmente otimizado para implantação sem servidor na Vercel em apenas alguns cliques.

### Método Rápido (Vercel CLI)
1. Instale a CLI global da Vercel (se não tiver): `npm i -g vercel`.
2. Execute `vercel` no diretório do projeto e siga os passos do terminal para associar sua conta e publicar.

### Método do GitHub (Recomendado)
1. Suba esta pasta de código em um repositório privado ou público no seu **GitHub**.
2. Acesse a dashboard da [Vercel](https://vercel.com).
3. Clique em **Add New > Project** e selecione o repositório do GitHub criado.
4. Clique em **Deploy**. A Vercel detectará o Next.js, criará os caches de PWA, compilará o TypeScript e publicará o site com domínio público HTTPS seguro!

---

## 📝 Avisos de Direitos Autorais

Este projeto foi construído **exclusivamente para uso familiar e pessoal**. Ele não deve ser exposto como um produto comercial oficial e não contém músicas, gravações ou imagens protegidas de Michael Jackson obtidas sem autorização. Todas as ilustrações originais devem ser inseridas pelo usuário nas pastas indicadas sob sua própria responsabilidade e fins domésticos.
