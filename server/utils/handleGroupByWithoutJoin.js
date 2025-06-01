export function handleGroupByWithoutJoin(data, groupBy, select) {
  console.log("handleGroupBy", data, groupBy);
  console.log("select", select);

  const groupedData = {};

  for (const row of data) {
    let groupKey = "";

    for (const column of groupBy) {
      groupKey += row[column];
    }

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = [];
    }
    groupedData[groupKey].push(row);
  }

  const resp = [];

  for (const key of Object.keys(groupedData)) {
    const build = {};
    const rows = groupedData[key];

    for (const selectEl of select) {
      const upper = selectEl.toUpperCase();

      if (selectEl.includes("(")) {
        let [funcExpr, aliasName] = selectEl.split(/ +as +/i);
        aliasName = aliasName?.trim() ?? funcExpr;

        const match = funcExpr.match(/(COUNT|SUM|AVG|MIN|MAX)\(([^)]+)\)/i);
        if (!match) {
          console.error(`Invalid aggregation expression: ${funcExpr}`);
          return -1;
        }

        const func = match[1].toUpperCase();
        const field = match[2].trim();

        if (func === "COUNT" && field === "*") {
          build[aliasName] = rows.length;
          continue;
        }

        const rawValues = rows.map((row) => row[field]);
        const numericValues = rawValues
          .map((v) => Number(v))
          .filter((v) => !isNaN(v));
        console.log("numericValues:", numericValues);
        if (func !== "COUNT" && numericValues.length !== rows.length) {
          console.error(`Non-numeric value in ${func}(${field})`);
          return -1;
        }

        switch (func) {
          case "COUNT":
            build[aliasName] = rows.length;
            break;
          case "SUM":
            build[aliasName] = numericValues.reduce((a, b) => a + b, 0);
            break;
          case "AVG":
            build[aliasName] =
              numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            break;
          case "MIN":
            build[aliasName] = Math.min(...numericValues);
            break;
          case "MAX":
            build[aliasName] = Math.max(...numericValues);
            break;
        }
      } else {
        if (groupBy.includes(selectEl)) {
          build[selectEl] = rows[0][selectEl];
        } else {
          console.error(`Non-grouped column ${selectEl} without aggregation`);
          return -1;
        }
      }
    }

    resp.push(build);
  }

  console.log("groupedData:", resp);
  return resp;
}
