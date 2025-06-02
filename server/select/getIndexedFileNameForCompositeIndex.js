import { json } from "express";

export function getIndexedFileNameForCompositeIndex(
  condition,
  composite,
  jsonData
) {
  const collectionName = condition.collName;
  const index_name = composite.name;
  const columns = jsonData.column;
  const pk = jsonData.metadata.PK;
  console.log(pk);

  const nonpks = columns
    .filter((elem) => !pk.includes(elem.name))
    .map((column) => column.name);
  let buildIndex = "";
  console.log(composite);

  for (const columnName of composite.column) {
    const index = nonpks.findIndex((col) => col === columnName);
    buildIndex += "ᛥ" + index;
  }
  return index_name + "ᛥ" + collectionName + "ᛥ" + "indexes" + buildIndex;
}

export function getIndexedFileNameForCompositeIndex2(
  tableName,
  jsonData,
  groupByNames
) {
  const collectionName = tableName;
  const columns = jsonData.column;
  const pk = jsonData.metadata.PK;
  console.log(pk);
  console.log("groupByNames", groupByNames);
  console.log(
    "jsonData.metadata.indexedColumns",
    jsonData.metadata.indexedColumns
  );
  const indexData = jsonData.metadata.indexedColumns;
  const composite = indexData.findIndex(
    (index) => JSON.stringify(index.column) === JSON.stringify(groupByNames)
  );
  if (composite === -1) {
    console.log("No matching composite index found");
    return null;
  }
  console.log("composite", composite);
  const index_name = indexData[composite].name;

  const nonpks = columns
    .filter((elem) => !pk.includes(elem.name))
    .map((column) => column.name);
  let buildIndex = "";
  console.log(composite);

  for (const columnName of groupByNames) {
    const index = nonpks.findIndex((col) => col === columnName);
    buildIndex += "ᛥ" + index;
  }
  console.log(index_name + "ᛥ" + collectionName + "ᛥ" + "indexes" + buildIndex);
  return index_name + "ᛥ" + collectionName + "ᛥ" + "indexes" + buildIndex;
}
