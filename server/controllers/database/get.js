import fs from "fs";
import { getDatabasePath, getTablePath } from "../../utils/paths.js";

export function getOldDb(_, res) {
  const dbFile = getDatabasePath();
  console.log("Old keres");
  let jsonData = JSON.parse(fs.readFileSync(dbFile));
  res.json(jsonData);
}

export function getOldTables(_, res) {
  const tableFile = getTablePath();
  console.log("Old tabla keres");
  let jsonData = JSON.parse(fs.readFileSync(tableFile));
  console.log(jsonData);
  res.json(jsonData);
}
