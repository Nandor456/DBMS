import fs from "fs";
import path from "path";
import { projectRoot } from "../../utils/paths.js";
const dbFile = path.join(projectRoot, "databases.json");
const tableFile = path.join(projectRoot, "table.json");
const folder = path.join(projectRoot, "test");

//create database
export function createDB(req, res) {
  console.log("createDB");
  const { name } = req.body;
  if (!name) return res.status(404).send({ message: "Not Found" });

  let data = JSON.parse(fs.readFileSync(dbFile));
  console.log(data);
  let tableData = JSON.parse(fs.readFileSync(tableFile));
  if (data.some((database) => database === name)) {
    console.log("Mar letezik az Adatbazis nev");
    return res.status(400).send({ message: "Az adatbazis mar letezik" });
  }
  data.push(name);
  console.log(data);
  tableData[name] = [];
  console.log("naez:", dbFile);
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  const folderPath = path.join(folder, name);
  fs.mkdirSync(folderPath, { recursive: true });
  res.json({ message: `Adatbazis '${name}' letrehozva` });
}


//create table
export function createTable(req, res) {
  const { database, table, columns } = req.body;
  //nevek megvannak
  if (!database || !table || !columns) {
    console.log("Hiba a body-ban");
    return res.status(400).send("Hiba a tabla beszurassal");
  }
  //"databases.json" kiolvasas
  let data = JSON.parse(fs.readFileSync(dbFile));
  //"table.json" kiolvasas
  let tableData = JSON.parse(fs.readFileSync(tableFile));
  if (!data.some((database2) => database2 === database)) {
    //database letezik
    console.log("Nem letezik ilyen adatbazis");
    return res.status(400).send("Nem letezik ilyen adatbazis");
  }
  if (tableData[database].some((value) => value === table)) {
    // table mar letezik
    console.log("Mar letezik az tabla nev");
    return res.status(400).send("Mar letezik az tabla nev");
  }
  //console.log("harmadikon tuljutott")

  tableData[database].push(table);
  console.log(tableData);
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2)); //table berakva json-be
  const folderPath = path.join(folder, database, table);
  fs.mkdirSync(folderPath, { recursive: true }); //table folder letrejott
  res.json({ message: `Adatbazis '${database}'-ban '${table}' letrehozva` });

  const filePath = path.join(folderPath, "column.json");
  fs.writeFileSync(filePath, JSON.stringify(columns, null, 2));
}