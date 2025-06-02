import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  getDatabasePath,
  getTablePath,
  getFolderPath,
} from "../../utils/paths.js";
import { getDBClient } from "../../../server.js";

const dbFile = getDatabasePath();
const tableFile = getTablePath();
const folder = getFolderPath();
//database delete
export async function deleteDB(req, res) {
  const { name } = req.body;
  console.log(name);
  if (!name) return res.status(404).send("Not Found");
  console.log("itt");
  let data = JSON.parse(fs.readFileSync(dbFile));
  let tableData = JSON.parse(fs.readFileSync(tableFile));

  if (!data.some((database) => database === name)) {
    console.log("Nem letezik az Adatbazis");
    return res.status(400).send("Az adatbazis nem letezik");
  }

  //console.log(data);
  const jsonData = data.filter((element) => element !== name); //kivesszuk az elemet a database.json-bol
  //console.log(jsonData);
  fs.writeFileSync(dbFile, JSON.stringify(jsonData, null, 2)); //felulirjuk a torolt elem nelkul database.json
  //console.log(tableData)
  delete tableData[name];
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2)); //felulirjuk a torolt elem nelkul table.json
  //console.log(tableData);
  const folderPath = path.join(folder, name);
  console.log(folderPath);
  try {
    fs.rmSync(folderPath, { recursive: true, force: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
  }
  try {
    const client = getDBClient();
    await client.db(name).dropDatabase();
    console.log(`MongoDB adatbázis '${name}' törölve.`);
  } catch (error) {
    console.error("Hiba a MongoDB adatbázis törlésénél:", error);
    return res.status(500).send("Hiba a MongoDB adatbázis törlésekor");
  }
  res.json({ message: `Adatbazis '${name}'-torolve` });
}

//table delete
export async function deleteTable(req, res) {
  console.log("teroles");

  const { database, table } = req.body;
  if (!database || !table) return res.status(404).send("Not Found");

  let tableData = JSON.parse(fs.readFileSync(tableFile));

  if (!tableData[database]?.includes(table)) {
    console.log("Meg nem letezik a tabla");
    return res.status(400).send("Meg nem letezik a tabla");
  }

  // 1. Tábla törlése JSON-ból
  tableData[database] = tableData[database].filter(
    (element) => element !== table
  );
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));

  // 2. Fájlrendszer törlése
  const folderPath = path.join(folder, database, table);
  console.log("folderpath", folderPath);
  try {
    fs.rmSync(folderPath, { recursive: true, force: true });
  } catch (err) {
    console.error("Fájlrendszer törlés hiba:", err);
  }

  // 3. MongoDB collection törlése
  try {
    const client = getDBClient();
    await client.db(database).collection(table).drop();
    console.log(`Collection '${table}' törölve a MongoDB-ből (${database})`);

    // 4. Index collectionök törlése
    const collections = await client.db(database).listCollections().toArray();
    const indexCollectionsToDrop = collections
      .map((col) => col.name)
      .filter((name) => {
        const parts = name.split("ᛥ");
        return parts.length >= 2 && parts[1] === table;
      });

    for (const indexName of indexCollectionsToDrop) {
      await client.db(database).collection(indexName).drop();
      console.log(`Index collection '${indexName}' törölve.`);
    }
  } catch (err) {
    console.error("MongoDB törlés hiba:", err);
    return res
      .status(500)
      .send("MongoDB törlés közben hiba történt (collection vagy index)");
  }

  return res.json({
    message: `Adatbazis '${database}'-ban '${table}' torolve`,
  });
}
