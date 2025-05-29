import fs from "fs";

export function getJsonData(dbName, collectionName) {
  return JSON.parse(
    fs.readFileSync(`test/${dbName}/${collectionName}/column.json`)
  );
}
