const fs = require("fs");
const path = require("path");

console.log("--------------------------------------------------");
console.log("INICIANDO TESTES DO SISTEMA DE METADADOS (CLI)...");
console.log("--------------------------------------------------");

// Carregar o arquivo drawingsData compilando de forma simples
const drawingsDataPath = path.join(__dirname, "../src/constants/drawingsData.ts");

if (!fs.existsSync(drawingsDataPath)) {
  console.error("❌ ERRO: Arquivo drawingsData.ts não encontrado.");
  process.exit(1);
}

const content = fs.readFileSync(drawingsDataPath, "utf8");

// Validar coleções
console.log("1. Validando Coleções...");
const collectionsRegex = /id:\s*"([^"]+)"/g;
let match;
const collectionIds = [];
while ((match = collectionsRegex.exec(content)) !== null) {
  if (!collectionIds.includes(match[1]) && ["silhouettes", "stage", "dance", "fashion", "patterns"].includes(match[1])) {
    collectionIds.push(match[1]);
  }
}
console.log(`   - Encontradas ${collectionIds.length} coleções mapeadas.`);
if (collectionIds.length !== 5) {
  console.error("❌ ERRO: Devem haver exatamente 5 coleções.");
  process.exit(1);
}

// Validar contagem de desenhos
console.log("2. Validando Contagem de Desenhos...");
const drawingIdRegex = /id:\s*"([^"]+)"/g;
const drawingIds = [];
while ((match = drawingIdRegex.exec(content)) !== null) {
  const id = match[1];
  if (id.startsWith("silhouette_") || id.startsWith("stage_") || id.startsWith("dance_") || id.startsWith("fashion_") || id.startsWith("patterns_")) {
    if (!drawingIds.includes(id)) {
      drawingIds.push(id);
    }
  }
}
console.log(`   - Encontrados ${drawingIds.length} desenhos únicos cadastrados.`);
if (drawingIds.length !== 20) {
  console.error("❌ ERRO: O aplicativo precisa ter exatamente 20 desenhos mapeados.");
  process.exit(1);
}

// Validar integridade dos arquivos em public/drawings
console.log("3. Validando existência dos arquivos físicos de contorno...");
const publicPath = path.join(__dirname, "../public");
const folders = ["silhouettes", "stage", "dance", "fashion", "patterns"];

folders.forEach((folder) => {
  const folderPath = path.join(publicPath, "drawings", folder);
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ ERRO: Pasta public/drawings/${folder} não existe.`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".png"));
  console.log(`   - Pasta ${folder}: ${files.length} arquivos PNG encontrados.`);
  if (files.length === 0) {
    console.error(`❌ ERRO: Pasta public/drawings/${folder} está vazia.`);
    process.exit(1);
  }
});

console.log("--------------------------------------------------");
console.log("✅ TODOS OS TESTES DE INTEGRIDADE PASSARAM!");
console.log("--------------------------------------------------");
process.exit(0);
