import {
  useDB,
  checkQuery,
  checkDbName,
  checkSelect,
  checkTableName,
  Checkwhere,
  isNumber,
  isString,
  isBoolean,
  isDate,
} from "../utils/validation.js";
import { columnType, extractColumns } from "../utils/get.js";

export function parseRows(query) {
  if (!query) {
    return { elements: 0, dbName: 0 };
  }
  let elements = [];
  const lines = query.split("\n");
  for (const line of lines) {
    if (line.trim() !== "") {
      elements.push(line);
    }
  }
  let element = "";
  while (elements.length > 1) {
    element = elements.pop() + " " + element;
  }
  element = element.trim();
  console.log("elements: ", element);
  const firstElement = elements.pop();
  let use = firstElement.split(" ")[0].toUpperCase();
  console.log("use: ", use);
  const dbName = firstElement.split(" ")[1].replace(/;$/, "");
  console.log("dbName: ", dbName);
  if (!useDB(use, dbName) || !checkQuery(element) || !checkDbName(dbName)) {
    return { elements: 0, dbName: 0 };
  }
  return { elements: element, dbName };
}

export function parseInsert(query, dbName, groupBy) {
  let select = query.split(" ")[0];
  let selectElements = query.split(" ")[1];
  let i = 2;
  while (!selectElements.includes(";")) {
    selectElements = selectElements + " " + query.split(" ")[i];
    i++;
  }
  selectElements = selectElements.replace(";", "");
  const selectElementsContainer = selectElements
    .split(",")
    .map((v) => v.trim().replace(/^'|'$/g, "").replace(/;$/, ""));

  const from = query.split(";")[1].trimStart().split(" ")[0];
  if (from.toUpperCase() !== "FROM") {
    console.log("Invalid query");
    return { status: 0, message: "Invalid query" };
  }
  console.log("from: ", from);
  let fromTable = query.split(from)[1].trimStart().split(" ")[0];
  fromTable = fromTable.replace(/^'|'$/g, "").replace(/;$/, "");
  console.log("fromTable: ", fromTable);
  const { status: statusTable, message: messageTable } = checkTableName(
    dbName,
    fromTable
  );
  console.log("statusTable: ", statusTable);
  if (statusTable === 0) {
    console.log("Invalid table name");
    return { status: 0, message: messageTable };
  }
  if (!groupBy) {
    const { status, message } = checkSelect(
      dbName,
      fromTable,
      selectElementsContainer
    );
    if (status === 0) {
      console.log("Invalid column names");
      return { status: 0, message };
    }
  }
  const parts = query.split(";");
  const where = parts.length > 2 ? parts[2].trimStart() : "";
  console.log("where: ", where);
  console.log("itt");
  return {
    status: 1,
    message: "Valid column names",
    elements: selectElementsContainer,
    tableName: fromTable,
    whereStatemant: where,
  };
}

function tokenizeWhere(expression) {
  let tokens = [];
  let current = "";
  let inQuote = false;
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];
    //console.log("char: ", char);
    const next = expression.slice(i).toUpperCase();
    //console.log("next: ", next);

    if (char === "'") {
      inQuote = !inQuote;
      current += char;
      i++;
      continue;
    }

    if (!inQuote && (char === "(" || char === ")")) {
      if (current.trim()) tokens.push(current.trim());
      tokens.push(char);
      current = "";
      i++;
      continue;
    }

    // Csak akkor különítsük el az AND/OR-t, ha nem vagyunk idézőjelben és ténylegesen szóközzel határolt
    if (
      !inQuote &&
      (next.startsWith("AND ") ||
        next.startsWith("OR ") ||
        next === "AND" ||
        next === "OR")
    ) {
      if (current.trim()) tokens.push(current.trim());
      const op = next.startsWith("AND") ? "AND" : "OR";
      tokens.push(op);
      i += op.length;

      // Léptess tovább a szóközökön
      while (expression[i] === " ") i++;

      current = "";
      continue;
    }

    current += char;
    i++;
    // Ha idézőjelben vagyunk, és a következő karakter AND/OR, de nem idézőjelben van, akkor ne adjuk hozzá a current-hez
    if (
      inQuote &&
      !next.trim().startsWith("AND'") &&
      !next.trim().startsWith("OR'") &&
      (next.trim().startsWith("AND") || next.trim().startsWith("OR"))
    ) {
      console.log("current: ", next);
      return 0;
    }
  }

  if (current.trim()) tokens.push(current.trim());

  return tokens;
}

function parseTokens(tokens) {
  const conditions = [];
  const logicalOps = [];

  while (tokens.length > 0) {
    const token = tokens.shift();

    if (token === "(") {
      const subExpression = [];
      let depth = 1;
      while (tokens.length > 0) {
        const t = tokens.shift();
        if (t === "(") depth++;
        else if (t === ")") depth--;

        if (depth === 0) break;
        subExpression.push(t);
      }

      const parsedSub = parseTokens(subExpression);
      conditions.push(parsedSub);
      continue;
    }

    if (token === "AND" || token === "OR") {
      logicalOps.push(token);
      continue;
    }

    // Feldolgozd a feltételt
    const operators = ["<=", ">=", "<", ">", "="];
    const operator = operators.find((op) => token.includes(op));
    if (!operator) throw new Error("Invalid condition syntax: " + token);

    let [column, value] = token.split(operator).map((part) => part.trim());
    column = column.replace(/^'|'$/g, "").replace(/;$/, "");
    value = value.replace(/^'|'$/g, "").replace(/;$/, "");

    conditions.push({ column, value, operator });
  }
  console.log("logicalOps2: ", logicalOps);

  return { conditions, logicalOperators: logicalOps };
}

function validateConditionTypes(conditions, columnTypesMap) {
  for (const cond of conditions) {
    if (Array.isArray(cond.conditions)) {
      // Rekurzívan ellenőrizzük a zárójelezett kifejezést
      const result = validateConditionTypes(cond.conditions, columnTypesMap);
      if (result.status === 0) return result;
    } else {
      const { column, value, operator } = cond;
      console.log("ide: ", columnTypesMap);
      const type = columnTypesMap[column];
      console.log("operator: ", operator, type);
      if (type === "number" && !isNumber(value)) {
        return {
          status: 0,
          message: `Invalid number value for column ${column}`,
        };
      }
      if (type === "string" && (!isString(value) || operator !== "=")) {
        return {
          status: 0,
          message: `Invalid string value or operator for column ${column}`,
        };
      }
      if (type === "boolean" && (!isBoolean(value) || operator !== "=")) {
        return {
          status: 0,
          message: `Invalid boolean value or operator for column ${column}`,
        };
      }
      if (type === "date" && (!isDate(value) || operator !== "=")) {
        return {
          status: 0,
          message: `Invalid date value or operator for column ${column}`,
        };
      }
    }
  }

  return { status: 1, message: "All values are valid" };
}

export function parseWhere(whereStatement, dbName, tableName, groupBy) {
  if (!whereStatement) {
    return { status: 0, message: "Invalid where statement" };
  }

  const where = whereStatement.trim().split(" ")[0];
  if (!Checkwhere(where)) {
    return { status: 0, message: "Invalid where statement" };
  }

  const expression = whereStatement.slice(where.length).trim();
  console.log("expression: ", expression);

  const tokens = tokenizeWhere(expression);
  if (!tokens) {
    return {
      status: 0,
      message: "Invalid where statement ( And/Or used with/without ' )",
    };
  }

  console.log("rawParts:", tokens);
  const parsed = parseTokens(tokens);
  const { conditions, logicalOperators } = parsed;
  console.log("conditions: ", conditions);
  if (!groupBy) {
    const { status, message } = checkSelect(
      dbName,
      tableName,
      extractColumns(conditions)
    );
    if (status === 0) {
      return { status: 0, message };
    }
  }

  // Típusellenőrzés
  const { columnNamesArray: columnTypes } = columnType(
    dbName,
    tableName,
    extractColumns(conditions)
  );
  console.log("columnTypes: ", columnTypes);
  const columnTypesMap = {};
  for (const { column, type } of columnTypes) {
    console.log("column: ", column, type);
    columnTypesMap[column] = type;
  }

  const { status: typeStatus, message: typeMessage } = validateConditionTypes(
    conditions,
    columnTypesMap
  );
  if (typeStatus === 0) {
    return { status: 0, message: typeMessage };
  }
  return {
    status: 1,
    message: "Valid where statement",
    result: {
      conditions,
      logicalOperators,
    },
  };
}

// export function parseWhere(whereStatement, dbName, tableName) {
//   if (!whereStatement) {
//     return { status: 0, message: "Invalid where statement" };
//   }

//   const where = whereStatement.trim().split(" ")[0];
//   if (!Checkwhere(where)) {
//     return { status: 0, message: "Invalid where statement" };
//   }

//   const expression = whereStatement.slice(where.length).trim();
//   console.log("expression: ", expression);
//   // Tokenizálás: feltételek + operátorok (AND/OR)
//   // const splitRegex = /\s+(AND|OR)\s+/i;
//   // const tokens = expression.split(splitRegex);
//   const tokens = tokenizeWhere(expression);
//   if (!tokens) {
//     return {
//       status: 0,
//       message: "Invalid where statement ( And/Or used with/without ' )",
//     };
//   }

//   console.log("rawParts:", tokens);
//   let conditions = [];
//   let logicalOps = [];

//   const operators = ["<=", ">=", "<", ">", "="];

//   for (let i = 0; i < tokens.length; i++) {
//     if (tokens.length % 2 === 0) {
//       return {
//         status: 0,
//         message: "Hibás WHERE feltétel: hiányzó feltétel egy AND vagy OR után.",
//       };
//     }
//     const token = tokens[i];
//     if (/^AND$/i.test(token) || /^OR$/i.test(token)) {
//       logicalOps.push(token.toUpperCase());
//       continue;
//     }

//     let operator = operators.find((op) => token.includes(op));
//     if (!operator) {
//       return { status: 0, message: "Invalid where condition syntax" };
//     }

//     let [column, value] = token.split(operator).map((part) => part.trim());
//     if (!column || !value) {
//       return { status: 0, message: "Invalid where condition" };
//     }

//     column = column.replace(/^'|'$/g, "").replace(/;$/, "");
//     value = value.replace(/^'|'$/g, "").replace(/;$/, "");

//     conditions.push({
//       column,
//       value,
//       operator,
//     });
//   }

//   // Ellenőrzés: oszlopok érvényesek?
//   const { status, message } = checkSelect(
//     dbName,
//     tableName,
//     conditions.map((c) => c.column)
//   );
//   if (status === 0) {
//     return { status: 0, message };
//   }

//   // Típusellenőrzés
//   const { columnNamesArray: columnTypes } = columnType(
//     dbName,
//     tableName,
//     conditions.map((c) => c.column)
//   );

//   for (let i = 0; i < conditions.length; i++) {
//     const cond = conditions[i];
//     const type = columnTypes[i].type;
//     const value = cond.value;
//     const op = cond.operator;

//     if (type === "number" && !isNumber(value))
//       return { status: 0, message: "Invalid value type" };
//     if (type === "string" && (!isString(value) || op !== "="))
//       return { status: 0, message: "Invalid value type" };
//     if (type === "boolean" && (!isBoolean(value) || op !== "="))
//       return { status: 0, message: "Invalid value type" };
//     if (type === "date" && (!isDate(value) || op !== "="))
//       return { status: 0, message: "Invalid value type" };
//   }

//   return {
//     status: 1,
//     message: "Valid where statement",
//     result: {
//       conditions,
//       logicalOperators: logicalOps,
//     },
//   };
// }

// export function parseWhere(whereStatemant, dbName, tableName) {
//   if (!whereStatemant) {
//     return { status: 0, message: "Invalid where statement" };
//   }
//   const whereElements = whereStatemant.split(" ");
//   const where = whereElements[0];
//   if (!Checkwhere(where)) {
//     return { status: 0, message: "Invalid where statement" };
//   }
//   const whereColumn = whereElements
//     .slice(1)
//     .join(" ")
//     .split(/\s+AND\s+/i)
//     .map((condition) => condition.trim());
//   let columns = [];
//   let values = [];
//   let valueOperators = [];
//   for (let element of whereColumn) {
//     const operators = ["<=", ">=", "<", ">", "="];
//     let operator = operators.find((op) => element.includes(op));
//     if (!operator) {
//       return { status: 0, message: "Invalid where statement" };
//     }
//     let [column, value] = element.split(operator).map((part) => part.trim());
//     if (!column || !value) {
//       return { status: 0, message: "Invalid where statement" };
//     }
//     column = column.replace(/^'|'$/g, "").replace(/;$/, "");
//     value = value.replace(/^'|'$/g, "").replace(/;$/, "");
//     console.log("column: ", column);
//     console.log("value: ", value);
//     columns.push(column);
//     values.push(value);
//     valueOperators.push(operator);
//   }
//   const { status, message } = checkSelect(dbName, tableName, columns);
//   if (status === 0) {
//     console.log("Invalid column names");
//     return { status: 0, message };
//   }
//   const { columnNamesArray: columnTypes } = columnType(
//     dbName,
//     tableName,
//     columns
//   );
//   console.log("columnTypes: ", columnTypes);
//   let result = [];
//   for (const [index, columnType] of columnTypes.entries()) {
//     if (columnType.type === "number" && !isNumber(values[index])) {
//       return { status: 0, message: "Invalid value type" };
//     }
//     if (
//       columnType.type === "string" &&
//       (!isString(values[index]) || valueOperators[index] !== "=")
//     ) {
//       return { status: 0, message: "Invalid value type" };
//     }
//     if (
//       columnType.type === "boolean" &&
//       (!isBoolean(values[index]) || valueOperators[index] !== "=")
//     ) {
//       return { status: 0, message: "Invalid value type" };
//     }
//     if (
//       columnType.type === "date" &&
//       (!isDate(values[index]) || valueOperators[index] !== "=")
//     ) {
//       return { status: 0, message: "Invalid value type" };
//     }
//     console.log("valueoperator: ", valueOperators[index]);
//     result.push({
//       column: columns[index],
//       value: values[index],
//       operator: valueOperators[index],
//     });
//   }
//   console.log("result: ", result);
//   return { status: 1, message: "Valid where statement", result };
// }
