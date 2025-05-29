import { getProjection } from "../../select/getProjection.js";
import { isSimpleIndex } from "../../utils/isSimpleIndex.js";
import { getJsonData } from "../../utils/getJsonData.js";

export async function simpleNestedLoopJoin(tables, joinConditions) {
  console.log("tables", tables);
  console.log("join", joinConditions);

  if (tables.length < 2 || joinConditions.length !== tables.length - 1) {
    throw new Error("Invalid number of tables or join conditions");
  }

  // Start with the first table as base
  const firstTable = tables[0];
  let result = getProjection(
    firstTable.data,
    firstTable.dbName,
    firstTable.collName
  );
  console.log("first table", result);

  for (let i = 1; i < tables.length; i++) {
    const currentTable = tables[i];
    const dataB = getProjection(
      currentTable.data,
      currentTable.dbName,
      currentTable.collName
    );
    console.log("dataB", dataB);

    const { left, right } = joinConditions[i - 1]; // join condition for current step

    const [leftAlias, leftField] = left.split(".");
    const [rightAlias, rightField] = right.split(".");
    const jsonData = getJsonData(currentTable.dbName, currentTable.collName);

    const useIndex = isSimpleIndex(
      rightField,
      jsonData.metadata.indexedColumns
    );
    const newResult = [];
    for (const outerRow of result) {
      if (useIndex) {
        const matchingInnerRows = await getIndexedData(
          outerRow[leftField],
          currentTable.dbName,
          currentTable.collName,
          rightField
        );
        console.log("-----ez azt jelenti index szerint megy a join-----");
        console.log(matchingInnerRows);

        for (const innerRow of matchingInnerRows) {
          newResult.push({ ...outerRow, ...innerRow });
        }
      }
      for (const innerRow of dataB) {
        if (outerRow[leftField] === innerRow[rightField]) {
          newResult.push({ ...outerRow, ...innerRow });
        }
      }
    }

    result = newResult;
  }

  return result;
}
