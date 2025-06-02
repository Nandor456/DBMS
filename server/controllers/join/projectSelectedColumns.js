export function projectSelectedColumns(resultRows, handledJoinInput) {
  if (handledJoinInput.select.includes("*")) {
    return resultRows;
  }
  const aliasToTable = {
    [handledJoinInput.from.alias]: handledJoinInput.from.table,
  };
  if (handledJoinInput.joins) {
    for (const join of handledJoinInput.joins) {
      aliasToTable[join.alias] = join.table;
    }
  }

  const selectKeys = handledJoinInput.select.map((sel) => {
    //[s.id] ---> [student.id]
    const [alias, col] = sel.split(".");
    const table = aliasToTable[alias];
    if (!table) {
      throw new Error(`Unknown alias '${alias}' in select: ${sel}`);
    }
    return `${table}.${col}`;
  });

  return resultRows.map((row) => {
    const projected = {};
    for (const key of selectKeys) {
      projected[key] = row[key];
    }
    return projected;
  });
}
