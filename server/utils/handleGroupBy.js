export function handleGroupBy(data, groupBy, aliasToTable, join, select) {
  console.log("handleGroupBy", data, groupBy);
  console.log("aliasToTable", aliasToTable);
  console.log("join", join);
  console.log("select", select);

  const groupedData = {};

  if (join) {
    for (const row of data) {
      let groupKey = "";
      for (const alias in groupBy) {
        const columns = groupBy[alias];
        for (const column of columns) {
          const columnName = `${aliasToTable[alias]}.${column}`;
          groupKey += row[columnName];
        }
      }
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = [];
      }
      groupedData[groupKey].push(row);
    }
  }

  let resp = [];

  for (const key of Object.keys(groupedData)) {
    const build = {};
    const rows = groupedData[key];

    for (const selectEl of select) {
      const upper = selectEl.toUpperCase();

      // --- Aggregált oszlopok (COUNT, SUM, AVG, MIN, MAX)
      if (selectEl.includes("(")) {
        // handle alias: e.g. SUM(m.price) AS total
        let [funcExpr, aliasName] = selectEl.split(/ +as +/i);
        aliasName = aliasName?.trim() ?? funcExpr;

        const match = funcExpr.match(/(COUNT|SUM|AVG|MIN|MAX)\(([^)]+)\)/i);
        if (!match) {
          console.error(`Invalid aggregation expression: ${funcExpr}`);
          return -1;
        }

        const func = match[1].toUpperCase();
        const field = match[2].trim();

        // COUNT(*) eset
        if (func === "COUNT" && field === "*") {
          build[aliasName] = rows.length;
          continue;
        }

        // Ellenőrizni, hogy az alias létezik-e
        const [alias, col] = field.split(".");
        if (!aliasToTable[alias]) {
          console.error(`Unknown alias: ${alias}`);
          return -1;
        }

        const keyName = `${aliasToTable[alias]}.${col}`;

        // Ellenőrizni, hogy a kulcs létezik-e az első sorban
        if (!rows[0].hasOwnProperty(keyName)) {
          console.error(`Column not found: ${keyName}`);
          return -1;
        }

        const rawValues = rows.map((row) => row[keyName]);
        const numericValues = rawValues
          .map((v) => Number(v))
          .filter((v) => !isNaN(v));

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
          default:
            console.error(`Unsupported aggregation: ${func}`);
            return -1;
        }
      } else {
        // --- Sima oszlop (pl. e.name)
        const [alias, column] = selectEl.split(".");
        const keyName = `${aliasToTable[alias]}.${column}`;

        if (groupBy[alias] && groupBy[alias].includes(column)) {
          build[selectEl] = rows[0][keyName]; // group by mezőt az első sorból vesszük
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
