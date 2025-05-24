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
