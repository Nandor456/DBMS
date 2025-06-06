import { parseRows, parseInsert, parseWhere } from "../utils/parsers.js";
import {
  extractColumns,
  extractConditions,
  flattenConditions,
} from "../utils/get.js";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { group } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.resolve(__dirname, "../../databases.json");
const tableFile = path.resolve(__dirname, "../../table.json");

// {
//    "query": "\n\nUse aaa;\n\nSelect aa, rrr; \n\n From a; \n\n Where rrr < '2003-03-03' AND ss<= 3 "
// }

export function getConditions(elem, groupBy) {
  console.log("getSelect loaded");
  try {
    const { query } = elem;
    let { elements, dbName } = parseRows(query);
    console.log("elements: ", elements);
    if (!elements) {
      return {
        success: false,
        message: "Invalid query",
      };
    }
    let {
      status,
      message,
      elements: elementsArray,
      tableName,
      whereStatemant,
    } = parseInsert(elements, dbName, groupBy);
    if (status === 0) {
      return {
        success: false,
        message: message,
      };
    }
    let flatConditions = [];
    let result = null;
    console.log("it--------------", whereStatemant)
    if (whereStatemant) {
      let parseRes;
      try {
        parseRes = parseWhere(whereStatemant, dbName, tableName);
      } catch (err) {
        console.error("parseWhere threw error:", err);
        return {
          success: false,
          message: "Syntax error in WHERE clause: " + err.message,
        };
      }

      const {
        status: statusWhere,
        message: messageWhere,
        result: whereResult,
      } = parseRes;
      if (statusWhere === 0) {
        return {
          success: false,
          message: messageWhere,
        };
      }

      result = whereResult;
    }
    if (result) {
      const columns = extractColumns(result.conditions);
      console.log("result: ", columns);
      const conditions = extractConditions(result.conditions);
      console.log("conditions: ", conditions);
      flatConditions = flattenConditions(result);
      console.log("conditionsWithOperator: ", flatConditions);
    }

    const jsonPath = path.resolve(
      __dirname,
      `../../test/${dbName}/${tableName}/column.json`
    );
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const data = JSON.parse(jsonData);

    const existingColumns = data.column.map((col) => col.name);

    return {
      success: true,
      where: whereStatemant? true : false,
      dbName: dbName,
      collName: tableName,
      conditions: flatConditions,
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      message: "Internal server error",
    };
  }
}
