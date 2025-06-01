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
<<<<<<< HEAD
    let flatConditions = [];
    let result = null;
    if (whereStatemant?.trim()) {
      let {
        status: statusWhere,
=======
    let {
      status: statusWhere,
      message: messageWhere,
      result,
    } = parseWhere(whereStatemant, dbName, tableName, groupBy);
    if (statusWhere === 0) {
      return {
        success: false,
>>>>>>> cf4876740d8fb69b63667dbec1c312d6b1100dc1
        message: messageWhere,
        result,
      } = parseWhere(whereStatemant, dbName, tableName);

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
    //console.log("data: ", data);

    const existingColumns = data.column.map((col) => col.name);

    //buildFilterFunction(flatConditions, schema);
    return {
      success: true,
      dbName: dbName,
      collName: tableName,
      conditions: flatConditions,
    };
    //console.log("sadsa", result.logicalOperators)
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
    };
  }
}
