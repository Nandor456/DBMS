export function splitConditionsByTable(conditions) {
  const tableConds = {};
  let current = [];

  for (let token of conditions) {
    if (typeof token === "string") continue;

    const [alias] = token.column.split(".");
    if (!tableConds[alias]) tableConds[alias] = [];
    token.column = token.column.split(".")[1];
    tableConds[alias].push(token);
  }

  return tableConds;
}
