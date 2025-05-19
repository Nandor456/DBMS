export function getIndexedFileName(metadata, columnName, collectionName) {
  const primaryKeys = metadata.metadata.PK;
  const nonPkColumns = metadata.column
    .filter((column) => !primaryKeys.includes(column.name)) // csak ami nem PK
    .map((column) => column.name);

  const indexPos = nonPkColumns.findIndex((c) => c === columnName);

  const indexName = metadata.metadata.indexedColumns.find(
    (c) => (c.column = columnName)
  );
  return `${indexName.name}ᛥ${collectionName}ᛥindexesᛥ${indexPos}`;
}
