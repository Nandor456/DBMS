import { convertOperatorToMongoOperator } from "../utils/convertOperator.js";
import { getIndexedFileName } from "./getIndexedFileName.js";
export async function getMatchedIdsFromSimpleIndex(
  cond,
  condition,
  jsonData,
  client
) {
  const columnName = cond.column;
  const operator = cond.operator;
  const value = cond.value;

  const indexedFileName = getIndexedFileName(
    jsonData,
    columnName,
    condition.collName
  );

  let mongoOperator;
  try {
    mongoOperator = convertOperatorToMongoOperator(operator);
  } catch (error) {
    return { success: false, message: error.message };
  }

  const isInequality = [">", "<", ">=", "<="].includes(operator);
  const parsedValue = isInequality ? parseFloat(value) : value;
  console.log("parsed value", parsedValue);

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
  console.log("data", data);

  return data.map((doc) => doc.value.split("#")).flat();
}
