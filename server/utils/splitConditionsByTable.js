export function splitConditionsByTable(conditions) {
  const tableConds = {};
  let current = [];

  for (let token of conditions) {
    console.log("token", token, typeof token);
    if (typeof token === "string") continue;

    const [alias] = token.column.split(".");
    if (!tableConds[alias]) tableConds[alias] = [];
    token.column = token.column.split(".")[1];
    tableConds[alias].push(token);
  }
  console.log("tableConds", tableConds);

  return tableConds;
}

export function splitGroupByTable(order, join, tableName) {
  const tableGroupBy = {};
  for (const token of order) {
    console.log("token", token, typeof token);
    if (typeof token !== "string") continue;
    if (!token.includes(".") && join) {
      console.log("No alias in token, skipping:", token);
      return -1; // ha nincs alias, akkor kihagyjuk
    }
    if (!token.includes(".")) {
      if (!tableGroupBy[tableName]) tableGroupBy[tableName] = [];
      tableGroupBy[tableName] = [token];
    } else {
      const [alias] = token.split(".");
      if (!tableGroupBy[alias]) tableGroupBy[alias] = [];
      const token2 = token.split(".")[1];
      tableGroupBy[alias].push(token2);
    }
  }
  return tableGroupBy;
}
