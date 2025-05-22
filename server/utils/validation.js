import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.resolve(__dirname, "../../databases.json");
const tableFile = path.resolve(__dirname, "../../table.json");

export function useDB(use, dbName) {
  if (!use || !dbName || use !== "USE") {
    console.log("nem adott meg mindent");
    return 0;
  }
  return 1;
}

export function checkQuery(query) {
  if (!query) {
    console.log("Ures query");
    return 0;
  }
  return 1;
}

export function checkDbName(dbName) {
  let data = JSON.parse(fs.readFileSync(dbFile));
  if (!data.some((database) => database === dbName)) {
    console.log("Nem letezik az Adatbazis");
    return 0;
  }
  return 1;
}

export function checkSelect(dbName, tableName, selectedColumns) {
  const jsonPath = path.resolve(
    __dirname,
    `../../test/${dbName}/${tableName}/column.json`
  );
  const jsonData = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(jsonData);
  //console.log("data: ", data);

  const existingColumns = data.column.map((col) => col.name);
  //console.log("existingColumns: ", existingColumns);
  existingColumns.push("*");
  const missing = selectedColumns.filter(
    (col) => !existingColumns.includes(col)
  );
  console.log("missing: ", missing);
  if (missing.length > 0) {
    console.log("van hiba a column nevekkel");
    return { status: 0, message: "Invalid column names", missing };
  }
  return { status: 1, message: "Valid column names" };
}

export function checkTableName(dbName, tableName) {
  let data = JSON.parse(fs.readFileSync(tableFile));
  console.log("data: ", data);
  if (
    !Object.entries(data).some(
      ([db, tables]) =>
        db === dbName && Array.isArray(tables) && tables.includes(tableName)
    )
  ) {
    console.log("Nem letezik a tabla");
    return { status: 0, message: "Invalid table name" };
  }
  return { status: 1, message: "Valid table name" };
}

export function Checkwhere(where) {
  if (!where) {
    console.log("Ures where");
    return 0;
  }
  if (where.toUpperCase() !== "WHERE") {
    console.log("Nem WHERE");
    return 0;
  }
  return 1;
}

export function isNumber(elem) {
  return !isNaN(elem) && typeof Number(elem) === "number";
}

export function isBoolean(elem) {
  return elem === "true" || elem === "false" || typeof elem === "boolean";
}

export function isString(elem) {
  return typeof elem === "string";
}

export function isDate(elem) {
  return /^\d{4}-\d{2}-\d{2}$/.test(elem);
  //return !isNaN(Date.parse(elem));
}
