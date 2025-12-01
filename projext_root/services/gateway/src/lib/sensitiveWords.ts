import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, "../config/sensitive-words.json");

let cachedWords: string[] | null = null;

export async function getSensitiveWords(): Promise<string[]> {
  if (cachedWords) {
    return cachedWords;
  }
  try {
    const raw = await readFile(configPath, "utf-8");
    cachedWords = JSON.parse(raw);
  } catch {
    cachedWords = [];
  }
  return cachedWords!;
}

export async function setSensitiveWords(words: string[]) {
  cachedWords = words;
  await writeFile(configPath, JSON.stringify(words, null, 2), "utf-8");
}
