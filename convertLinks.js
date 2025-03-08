/**
 * Script para converter links Markdown no formato:
 *   [Texto](1.%20Pré-estudos.md#Prazos%20e%20Metas)
 * para o formato esperado pelo Digital Garden:
 *   [Texto](/estudos/1.%20pr%C3%A9-estudos/#prazos-e-metas)
 *
 * O script percorre recursivamente o diretório de saída ("dist")
 * e atualiza os arquivos HTML gerados.
 */

const fs = require('fs');
const path = require('path');

/**
 * Remove a extensão .md, converte para minúsculas, substitui espaços por hífens e aplica URL encoding.
 * Ex.: "1. Pré-estudos.md" -> "1.-pré-estudos" (depois codificado)
 */
function normalizeFilename(filename) {
  // Remove a extensão .md (ignorando case) e converte para minúsculas
  const base = filename.replace(/\.md$/i, '').trim().toLowerCase();
  // Substitui espaços por hífens
  const slug = base.replace(/\s+/g, '-');
  return encodeURIComponent(slug);
}

/**
 * Converte o fragmento (parte após o "#") para minúsculas, remove espaços extras e substitui espaços por hífens.
 * Ex.: "Prazos e Metas" -> "prazos-e-metas"
 */
function normalizeFragment(fragment) {
  return fragment.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Converte um link do formato original para o novo formato.
 * Exemplo:
 *   Input: "1.%20Pré-estudos.md#Prazos%20e%20Metas"
 *   Output: "/estudos/1.-pr%C3%A9-estudos/#prazos-e-metas"
 */
function convertLink(oldLink) {
  // Separa a parte do arquivo e o fragmento (se existir)
  const parts = oldLink.split('#');
  const filePart = parts[0];
  const fragmentPart = parts[1]; // Pode ser undefined

  // Decodifica e normaliza o nome do arquivo
  const normalizedFile = normalizeFilename(decodeURIComponent(filePart));
  
  // Monta a URL final. Aqui, assumimos que as notas são servidas em "/estudos/"
  let newLink = `/estudos/${normalizedFile}/`;
  if (fragmentPart) {
    newLink += `#${normalizeFragment(fragmentPart)}`;
  }
  return newLink;
}

/**
 * Processa um arquivo HTML, substituindo os links problemáticos.
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex para capturar links no formato: [Texto](arquivo.md#Fragmento)
  const regex = /\[([^\]]+)\]\(([^)]+\.md(?:#[^)]+)?)\)/g;
  
  // Substitui cada ocorrência mantendo o texto original, mas alterando o href
  const newContent = content.replace(regex, (match, text, link) => {
    const newHref = convertLink(link);
    return `[${text}](${newHref})`;
  });
  
  // Sobrescreve o arquivo com o conteúdo modificado
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Processado: ${filePath}`);
}

/**
 * Percorre recursivamente o diretório e processa os arquivos HTML.
 */
function processDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.html')) {
      processFile(fullPath);
    }
  });
}

// Diretório de saída conforme definido no .eleventy.js (no seu caso, "dist")
const outputDir = './dist';

if (fs.existsSync(outputDir)) {
  processDirectory(outputDir);
  console.log('Conversão de links concluída com sucesso!');
} else {
  console.error(`Diretório "${outputDir}" não encontrado.`);
}
