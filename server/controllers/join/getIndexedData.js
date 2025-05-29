import { getDBClient } from "../../../server";
import { getIndexedFileName } from "../../select/getIndexedFileName";
import { getColumns } from "../../utils/getDbData";

export async function getIndexedData(value, dbName, collectionName) {
  const client = getDBClient();
  const jsonData = getColumns(dbName, collectionName);
  const indexedFileName = getIndexedFileName(jsonData, dbName, collectionName);
  return await client
    .db(dbName)
    .collection(indexedFileName)
    .findOne({ _id: value });
}
