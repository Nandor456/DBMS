export function isSimpleIndex(columnName, indexedColumns) {
  return indexedColumns.some(
    (indexArr) =>
      indexArr.column.length === 1 && indexArr.column[0] === columnName
  );
}
