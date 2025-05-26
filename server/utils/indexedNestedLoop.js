import { extractValue } from "./extractValue.js";

export function simpleNestedLoopJoin(tables, joinConditions) {
  console.log(tables);
  console.log(joinConditions);

  if (tables.length < 2 || joinConditions.length !== tables.length - 1) {
    throw new Error("Invalid number of tables or join conditions");
  }

  // Start with the first table as base
  let result = tables[0].map((row) => ({ ...row }));

  for (let i = 1; i < tables.length; i++) {
    const currentTable = tables[i];
    const { left, right } = joinConditions[i - 1]; // join condition for current step

    const [leftAlias, leftField] = left.split(".");
    const [rightAlias, rightField] = right.split(".");

    const newResult = [];

    for (const outerRow of result) {
      const outerValue = extractValue(outerRow, leftField);

      for (const innerRow of currentTable) {
        const innerValue = extractValue(innerRow, rightField);

        if (outerValue === innerValue) {
          newResult.push({ ...outerRow, ...innerRow });
        }
      }
    }

    result = newResult;
  }

  return result;
}
