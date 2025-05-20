import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Visszamegyünk a projekt gyökerébe (2 szint)
export const projectRoot = path.resolve(__dirname, "../../");

export function getDatabasePath(){
    return path.join(projectRoot, "databases.json");    
}

export function getTablePath(){
    return path.join(projectRoot, "table.json");    
}

export function getFolderPath(){
    return path.join(projectRoot, "test");
}