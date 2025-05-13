import { parseRows, parseInsert, parseWhere } from "../utils/parsers.js";
import {
  extractColumns,
  extractConditions,
  flattenConditions,
} from "../utils/get.js";
import { buildFilterFunction } from "../utils/whereHandle.js";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.resolve(__dirname, "../../databases.json");
const tableFile = path.resolve(__dirname, "../../table.json");

// {
//    "query": "\n\nUse aaa;\n\nSelect aa, rrr; \n\n From a; \n\n Where rrr < '2003-03-03' AND ss<= 3 "
// }

export async function getSelect(req, res) {
  console.log("getSelect loaded");
  try {
    const { query } = req.body;
    let { elements, dbName } = parseRows(query);
    console.log("elements: ", elements, dbName);
    if (!elements) {
      return res.status(400).json({ message: "Invalid query" });
    }
    let {
      status,
      message,
      elements: elementsArray,
      tableName,
      whereStatemant,
    } = parseInsert(elements, dbName);
    if (status === 0) {
      return res.status(400).json({ message: message });
    }
    let {
      status: statusWhere,
      message: messageWhere,
      result,
    } = parseWhere(whereStatemant, dbName, tableName);
    if (statusWhere === 0) {
      return res.status(400).json({ message: messageWhere });
    }
    const columns = extractColumns(result.conditions);
    console.log("result: ", columns);
    const conditions = extractConditions(result.conditions);
    console.log("conditions: ", conditions);
    const flatConditions = flattenConditions(result);
    console.log("conditionsWithOperator: ", flatConditions);
    
    const jsonPath = path.resolve(
      __dirname,
      `../../test/${dbName}/${tableName}/column.json`
    );
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(jsonData);
    //console.log("data: ", data);

    const existingColumns = data.column.map((col) => col.name);
    
    //buildFilterFunction(flatConditions, schema);

    //console.log("sadsa", result.logicalOperators)
  } catch (error) {
    console.error("Error in getSelect:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
  return res.status(200).json({ message: "Valid query" });
}
