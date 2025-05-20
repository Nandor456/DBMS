import fs from "fs";
import path from "path";
import { getDatabasePath, getTablePath, getFolderPath } from "../../utils/paths.js";

const dbFile = getDatabasePath();
const tableFile = getTablePath();
const folder = getFolderPath();

//database delete
export function deleteDB(req, res) {
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
    fs.rmSync(folderPath, { recursive: true, force: true }); // "force" ensures it doesn't fail if the folder is missing
  } catch (error) {
    console.error("Error deleting folder:", error);
  }
  res.json({ message: `Adatbazis '${name}'-torolve` });
}

//table delete
export function deleteTable(req, res) {
  const { database, table } = req.body;
  if (!database || !table) return res.status(404).send("Not Found");

  let tableData = JSON.parse(fs.readFileSync(tableFile));

  if (!tableData[database].some((value) => value === table)) {
    // table meg nem letezik
    console.log("Meg nem letezik a tabla");
    return res.status(400).send("Meg nem letezik a tabla");
  }

  tableData[database] = tableData[database].filter(
    (element) => element !== table
  );
  console.log(tableData);
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));

  const folderPath = path.join(__dirname, folder, database, table);
  console.log(folderPath);
  fs.rmSync(folderPath, { recursive: true });
  res.json({ message: `Adatbazis '${database}'-ban '${table}' torolve` });
}
