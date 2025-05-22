import { getDBClient } from "../../server.js";
import fs from "fs";
export function getProjection(whereRes, dbName, collectionName) {
  const client = getDBClient();
  let projectionRes = [];
  const jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${collectionName}/column.json`)
  );
  const columnDefs = jsonData.column;

  for (let i = 0; i < whereRes.length; i++) {
    let splitValues = whereRes[i].value.split("#");
    let projectedRow = {};
    const pk = jsonData.metadata.PK[0]; // assuming 1-column PK
    const pkIndex = columnDefs.findIndex((col) => col.name === pk);
    splitValues.splice(pkIndex, 0, whereRes[i]._id);
    for (let j = 0; j < splitValues.length; j++) {
      const col = columnDefs[j].name;
      const value = splitValues[j];
      projectedRow[col] = value;
    }
    projectionRes.push(projectedRow);
  }
  return projectionRes;
}
