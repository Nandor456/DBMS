import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { projectRoot } from "./paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getColumns(dbName, tableName) {
  const jsonPath = path.resolve(
    __dirname,
    `../../test/${dbName}/${tableName}/column.json`
  );
  if (!fs.existsSync(jsonPath)) return [];

  try {
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(jsonData);
    console.log(data);
    return data.column?.map((col) => col.name) || [];
  } catch (err) {
    console.error("Failed to read columns:", err);
    return [];
  }
}