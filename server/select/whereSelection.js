import fs from "fs";
import { getIndexedFileName } from "./getIndexedFileName.js";
import { getDBClient } from "../../server.js";
import { convertOperator } from "../utils/convertOperator.js";

function intersectArrays(arr1, arr2) {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}

export async function whereSelection(condition) {
  const client = getDBClient();

  const jsonData = JSON.parse(
    fs.readFileSync(
      `test/${condition.dbName}/${condition.collName}/column.json`
    )
  );
  const indexedColumns = jsonData.metadata.indexedColumns;
  const nonIndexedConditions = condition.conditions.filter((elem) => {
    if (typeof elem !== "object") return false;

    const isIndexed = indexedColumns.some(
      (indexArr) =>
        indexArr.column.length === 1 && indexArr.column[0] === elem.column
    );

    return !isIndexed;
  });

  console.log("non indexed", nonIndexedConditions);

  const resultSets = []; // Will hold arrays of IDs for indexed conditions
  const operators = []; // Will hold logical operators (e.g., "AND")

  for (const cond of condition.conditions) {
    if (typeof cond !== "object") {
      operators.push(cond); // e.g., 'AND'
      continue;
    }

    const columnName = cond.column;
    const operator = cond.operator;
    const value = cond.value;

    const simpleIndex = indexedColumns.find(
      (indexArr) =>
        indexArr.column.length === 1 && indexArr.column[0] === columnName
    );

    if (!simpleIndex) continue;
    const indexedFileName = getIndexedFileName(
      jsonData,
      columnName,
      condition.collName
    );

    let mongoOperator;
    try {
      mongoOperator = convertOperator(operator);
    } catch (error) {
      return { success: false, message: error.message };
    }

    const isInequality = [">", "<", ">=", "<="].includes(operator);
    const parsedValue = isInequality ? parseFloat(value) : value;

    const pipeline = isInequality
      ? [
          { $addFields: { idAsNumber: { $toDouble: "$_id" } } },
          { $match: { idAsNumber: { [mongoOperator]: parsedValue } } },
        ]
      : [{ $match: { _id: { [mongoOperator]: parsedValue } } }];

    const data = await client
      .db(condition.dbName)
      .collection(indexedFileName)
      .aggregate(pipeline)
      .toArray();

    const matched = data.map((doc) => doc.value.split("#")).flat();

    resultSets.push(matched);
  }
  let indexedData = [];

  if (resultSets.length !== 0) {
    let result = resultSets[0];
    for (let i = 1; i < resultSets.length; i++) {
      const op = operators[i - 1]; // logical operator between i-1 and i
      if (op === "AND") {
        result = intersectArrays(result, resultSets[i]);
      } else {
        return {
          success: false,
          message: `Unsupported logical operator "${op}"`,
        };
      }
    }
    for (let i = 0; i < result.length; i++) {
      indexedData.push(
        await client
          .db(condition.dbName)
          .collection(condition.collName)
          .findOne({ _id: result[i] })
      );
    }
  }
  //indexelt oszlopok szerint kapott eredmeny
  console.log("indexedData: ", indexedData);
  //TODO: berakni a pkt az indexed columnok koze
  //vesszuk a nem indexelt felteteleket
  let finalResult;
  if (indexedData.length === 0) {
    finalResult = await client
      .db(condition.dbName)
      .collection(condition.collName)
      .find()
      .toArray();
  } else {
    finalResult = indexedData;
  }
  console.log("finalRes:", finalResult);

  const pk = jsonData.metadata.PK;
  const nonPkColumns = jsonData.column.filter(
    (elem) => !pk.includes(elem.name)
  );
  for (let i = 0; i < nonIndexedConditions.length; i++) {
    const cond = nonIndexedConditions[i];
    const columnIndex = nonPkColumns.findIndex(
      (col) => col.name === cond.column
    );
    if (columnIndex === -1) {
      return {
        success: false,
        message: `Column ${cond.column} not found`,
      };
    }

    finalResult = finalResult.filter(
      (elem) => elem.value.split("#")[columnIndex] === cond.value
    );
  }
  return {
    success: true,
    result: finalResult,
  };
}
