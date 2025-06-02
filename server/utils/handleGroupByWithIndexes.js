export function handleGroupByWithIndexes(condition) {
  const jsonData = JSON.parse(
    fs.readFileSync(
      `test/${condition.dbName}/${condition.collName}/column.json`
    )
  );
  const indexedColumns = jsonData.metadata.indexedColumns;
  const composite = findMatchingCompositeIndex(
    cond,
    condition.conditions,
    indexedColumns
  );
  console.log("composite", composite);
}
