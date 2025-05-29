import fs from "fs";
import { getDBClient } from "../../server.js";
import { convertOperator } from "../utils/convertOperator.js";
import { getMatchedIdsFromSimpleIndex } from "./getMatchedDataFromSimpleIndex.js";
import { findMatchingCompositeIndex } from "./findMatchingCompositeIndex.js";
import { getMatchedIdsFromCompositeIndex } from "./getMatchedIdsFromCompositeIndex.js";
import { isPartOfHandledComposite } from "./isPartOfHandledComposite.js";
import { isSimpleIndex } from "../utils/isSimpleIndex.js";

function intersectArrays(arr1, arr2) {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}

export async function whereSelection(condition) {
  console.log("condition", condition);
  const client = getDBClient();

  if (condition.conditions.length === 0) {
    return {
      success: true,
      result: await client
        .db(condition.dbName)
        .collection(condition.collName)
        .find()
        .toArray(),
    };
  }

  const jsonData = JSON.parse(
    fs.readFileSync(
      `test/${condition.dbName}/${condition.collName}/column.json`
    )
  );
  const indexedColumns = jsonData.metadata.indexedColumns;
  const resultSets = []; // Will hold arrays of IDs for indexed conditions
  //const operators = []; // Will hold logical operators (e.g., "AND")
  const handledCompositeColumns = [];
  let nonIndexedConditions = [];
  for (const cond of condition.conditions) {
    if (typeof cond !== "object") {
      //operators.push(cond); // e.g., 'AND'
      continue;
    }
    console.log("cond", cond);

    if (isPartOfHandledComposite(cond.column, handledCompositeColumns)) {
      console.log("already handled");
      continue;
    }
    //checks whether all the columns of a composite index exist in the condition list
    const composite = findMatchingCompositeIndex(
      cond,
      condition.conditions,
      indexedColumns
    );
    console.log("composite", composite);

    if (composite) {
      const matched = await getMatchedIdsFromCompositeIndex(
        composite,
        condition,
        jsonData,
        client
      );
      resultSets.push(matched);
      handledCompositeColumns.push(...composite.column);
      continue;
    }

    if (!isSimpleIndex(cond.column, indexedColumns)) {
      console.log(`Skipping non-indexed column: ${cond.column}`);
      nonIndexedConditions.push(cond);
      continue;
    }

    const matched = await getMatchedIdsFromSimpleIndex(
      cond,
      condition,
      jsonData,
      client
    );
    resultSets.push(matched);
  }
  console.log("resultsets", resultSets);

  let indexedData = [];

  if (resultSets.length !== 0) {
    let result = resultSets[0];
    for (let i = 1; i < resultSets.length; i++) {
      //const op = operators[i - 1]; // logical operator between i-1 and i
      //if (op === "AND") {
      result = intersectArrays(result, resultSets[i]);
      // } else {
      //   return {
      //     success: false,
      //     message: `Unsupported logical operator "${op}"`,
      //   };
      // }
    }
    console.log("result", result);

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
  const pk = jsonData.metadata.PK;
  const nonPkColumns = jsonData.column.filter(
    (elem) => !pk.includes(elem.name)
  );
  for (let i = 0; i < nonIndexedConditions.length; i++) {
    const cond = nonIndexedConditions[i];
    if (!jsonData.metadata.PK.includes(cond.column)) {
      const columnIndex = nonPkColumns.findIndex(
        (col) => col.name === cond.column
      );
      if (columnIndex === -1) {
        return {
          success: false,
          message: `Column ${cond.column} not found`,
        };
      }

      finalResult = finalResult.filter((elem) =>
        convertOperator(
          elem.value.split("#")[columnIndex],
          cond.operator,
          cond.value
        )
      );
    } else {
      finalResult = finalResult.filter((elem) =>
        convertOperator(elem._id, cond.operator, cond.value)
      );
    }
    console.log("finalRes:", finalResult);
  }
  return {
    success: true,
    result: finalResult,
  };
}
