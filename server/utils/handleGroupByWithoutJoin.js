import { getDBClient } from "../../server.js";
import { getProjection } from "../select/getProjection.js";

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

export async function handleGroupByWithIndexes(
  dbName,
  tableName,
  indexFileName,
  select,
  jsonData,
  groupBy
) {
  const client = getDBClient();
  const data = await client
    .db(dbName)
    .collection(indexFileName)
    .find()
    .toArray();
  console.log("data:", data);

  // indexek kikerese
  const primaryKeys = jsonData.metadata.PK;
  const nonPkColumns = jsonData.column
    .filter((column) => !primaryKeys.includes(column.name)) // csak ami nem PK
    .map((column) => column.name);
  const indexPos = {}; // a nem pk oszlopok indexei
  for (const columnName of nonPkColumns) {
    indexPos[columnName] = nonPkColumns.findIndex((c) => c === columnName);
  }
  const parts = indexFileName.split("ᛥ");
  const indexNameIndexesArray = parts.slice(3).map(Number); // az indextablaban megjeleno indexek
  const indexNameIndexes = Object.fromEntries(
    indexNameIndexesArray.map((value, index) => [value, index]) // indexek indexelve
  );
  // indexek kikerese
  console.log("indexPos", indexPos, indexNameIndexes);

  const resp = [];
  for (const row of data) {
    const build = {};
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

        const primaryKeysInGroup = row.value.split("#"); // ezek a pk-k
        // Adatok lekérése csak ha nem COUNT(*)
        let rows = [];

        if (!(func === "COUNT" && field === "*")) {
          const pkDocs = await client
            .db(dbName)
            .collection(tableName)
            .find({ _id: { $in: primaryKeysInGroup } })
            .toArray();
          console.log("pkDocs:", pkDocs);
          rows = pkDocs.map((doc) => {
            const splitVals = doc.value.split("#")[indexPos[field]];
            const obj = {};
            obj[field] = splitVals;
            obj.pk = doc._id;
            return obj;
          });
        }

        // Aggregáció végrehajtása
        if (func === "COUNT") {
          build[aliasName] = primaryKeysInGroup.length;
        } else {
          const rawValues = rows.map((r) => r[field]);
          console.log("rawValues:", rawValues);
          const numericValues = rawValues.map(Number).filter((n) => !isNaN(n));
          console.log("numericValues:", numericValues);
          if (numericValues.length !== rawValues.length) {
            console.error(`Non-numeric value in ${func}(${field})`);
            return -1;
          }

          switch (func) {
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
        }
      } else {
        if (groupBy.includes(selectEl)) {
          build[selectEl] =
            row._id.split("#")[indexNameIndexes[indexPos[selectEl]]];
          console.log("build[selectEl]", build[selectEl]);
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
