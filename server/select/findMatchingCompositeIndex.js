export function findMatchingCompositeIndex(
  currentCond,
  allConds,
  indexedColumns
) {
  return indexedColumns.find((indexArr) => {
    // Must be a composite key (more than one column)
    if (indexArr.column.length <= 1) return false;
    //currCond must include the composite key
    if (!indexArr.column.includes(currentCond.column)) return false;

    // All index columns must be present in the condition set
    return indexArr.column.every((col) =>
      allConds.some(
        (cond) =>
          typeof cond === "object" &&
          cond.column === col &&
          cond.operator === "="
      )
    );
  });
}
