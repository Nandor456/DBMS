import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.resolve(__dirname, "../../databases.json");
const tableFile = path.resolve(__dirname, "../../table.json");

export function columnType(dbName, tableName, columnNames) {
  const jsonPath = path.resolve(
    __dirname,
    `../../test/${dbName}/${tableName}/column.json`
  );
  const jsonData = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(jsonData);
  console.log("data: ", data);
  const existingColumns = data.column.map((col) => col.name);
  const types = data.column.map((col) => col.type);
  const zippedColumns = existingColumns.map((name, index) => ({
    name,
    type: types[index],
  }));
  let columnNamesArray = [];
  for (const columnName of columnNames) {
    zippedColumns.forEach((column) => {
      if (column.name === columnName) {
        columnNamesArray.push({ column: column.name, type: column.type });
      }
    });
  }
  console.log("columnNamesArray: ", columnNamesArray);
  return { columnNamesArray };
}

export function extractColumns(conditions) {
  let columns = [];

  for (const cond of conditions) {
    if (Array.isArray(cond.conditions)) {
      // Rekurzív ág: zárójelezett kifejezés
      columns.push(...extractColumns(cond.conditions));
    } else if (cond.column) {
      columns.push(cond.column);
    }
  }

  return columns;
}

export function extractConditions(conditions) {
  let extracted = [];

  for (const cond of conditions) {
    // Ha ez egy rekurzív blokk (pl. zárójelben lévő rész)
    if (cond && typeof cond === "object" && Array.isArray(cond.conditions)) {
      extracted.push(...extractConditions(cond.conditions));
    }
    // Ha ez egy alap feltétel
    else if (cond && cond.column) {
      extracted.push(cond);
    }
  }

  return extracted;
}

export function extractConditionsWithOperators(conditions) {
  let extracted = [];
  let operators = [];

  for (const cond of conditions) {
    if (cond && typeof cond === "object" && Array.isArray(cond.conditions)) {
      const sub = extractConditionsWithOperators(cond.conditions);
      extracted.push(...sub.conditions);
      operators.push(...sub.operators);
    } else if (cond && cond.column) {
      extracted.push(cond);
    }
  }

  return { conditions: extracted, operators };
}

export function flattenConditions(tree) {
  const { conditions, logicalOperators } = tree;

  let result = [];
  for (let i = 0; i < conditions.length; i++) {
    const current = conditions[i];

    if (Array.isArray(current.conditions)) {
      // Rekurzív hívás zárójelezett részre
      const sub = flattenConditions(current);
      result.push(sub);
    } else {
      result.push(current);
    }

    // Operátor hozzáfűzése (ha van következő)
    if (i < logicalOperators.length) {
      result.push(logicalOperators[i]);
    }
  }

  return result;
}
