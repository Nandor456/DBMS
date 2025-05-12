import { parseRows, parseInsert, parseWhere } from "../utils/parsers.js";
import { extractColumns, extractConditions, flattenConditions } from "../utils/get.js";
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
    const conditionsWithOperator = flattenConditions(
      result
    );
    console.log("conditionsWithOperator: ", conditionsWithOperator);

    //console.log("sadsa", result.logicalOperators)
  } catch (error) {
    console.error("Error in getSelect:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
  return res.status(200).json({ message: "Valid query" });
}
