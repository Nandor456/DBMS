import { getIndexedFileNameForCompositeIndex } from "./getIndexedFileNameForCompositeIndex.js";

export async function getMatchedIdsFromCompositeIndex(
  composite,
  condition,
  jsonData,
  client
) {
  const fields = composite.column;
  const filename = getIndexedFileNameForCompositeIndex(
    condition,
    composite,
    jsonData
  );
  const data = await client
    .db(condition.dbName)
    .collection(filename)
    .find()
    .toArray();

  const condMap = Object.fromEntries(
    condition.conditions
      .filter(
        (cond) => typeof cond === "object" && fields.includes(cond.column)
      )
      .map((cond) => [cond.column, cond.value])
  );

  const final_data = data.filter((elem) => {
    const parts = elem._id.split("#");
    return fields.every((field, i) => parts[i] === condMap[field]);
  });
  console.log("final", final_data);
  return final_data.map((doc) => doc.value);
}
