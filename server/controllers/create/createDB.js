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
  console.log("adatbazis letezik", tableData);
  if (tableData[database].some((value) => value === table)) {
    // table mar letezik
    console.log("Mar letezik az tabla nev");
    return res.status(400).send("Mar letezik az tabla nev");
  }
  let folderPath2 = path.join(folder, database);
  console.log("na--------", columns.metadata.FK);
  let fkValueCollection = {};
  for (const value of columns.metadata.FK) {
    console.log("FK:", tableData[database], value.FKTableName);
    if (!tableData[database].includes(value.FKTableName)) {
      // table mar letezik
      console.log("Nem letezik az FK altal irt masik tabla nev");
      return res
        .status(400)
        .send("Nem letezik az FK alatal irt masik tabla nev");
    }
    if (!fkValueCollection[value.FKTableName]) {
      fkValueCollection[value.FKTableName] = [];
    }
    fkValueCollection[value.FKTableName].push({
      value: value.FKName,
      FKColumnName: value.FKColumnName,
    });
  }

  // Mindennek legyen type-ja legyen meg
  for (const column of columns.column) {
    if (!column.type) {
      console.log(`A '${column.name}' oszlopnak nincs típusa megadva.`);
      return res
        .status(400)
        .send(`A '${column.name}' oszlopnak nincs típusa megadva.`);
    }
  }

  // Min 1 pk a table-ban
  if (columns.metadata.PK.length === 0) {
    console.log("A táblának legalább egy PK erteke kell legyen.");
    return res
      .status(400)
      .send("A táblának legalább egy PK erteke kell legyen.");
  }

  //fk ellenorzes
  for (const [fkTableName, fkFields] of Object.entries(fkValueCollection)) {
    const fkColumnPath = path.join(folderPath2, fkTableName, "column.json");

    if (!fs.existsSync(fkColumnPath)) {
      console.log(`Nem található a column.json fájl: ${fkColumnPath}`);
      return res
        .status(400)
        .send(`Nem található a column.json fájl: ${fkColumnPath}`);
    }

    const fkData = JSON.parse(fs.readFileSync(fkColumnPath));

    const fkPks = fkData.metadata.PK.length || 0;
    if (fkPks !== fkFields.length) {
      console.log(
        `A '${fkTableName}' táblában a megadott FK mezők száma megegyezik a PK mezők számával.`
      );
      return res
        .status(400)
        .send(
          `A '${fkTableName}' táblában a megadott FK mezők száma nem egyezik a PK mezők számával.`
        );
    }
    for (const fkName of fkFields) {
      // 1. Megnézzük, hogy az FK mező létezik-e a másik táblában
      const referencedColumn = fkData.column.find(
        (col) => col.name === fkName.FKColumnName
      );
      if (!referencedColumn) {
        console.log(
          `A '${fkName.FKColumnName}' mező nem található a '${fkTableName}' táblában`
        );
        return res
          .status(400)
          .send(
            `A '${fkName.FKColumnName}' mező nem található a '${fkTableName}' táblában`
          );
      }

      // 2. Megnézzük, hogy a helyi oszlop létezik-e
      const localColumn = columns.column.find(
        (col) => col.name === fkName.value
      );
      if (!localColumn) {
        console.log(
          `A '${fkName.value}' FK mező nincs definiálva a létrehozandó táblában`
        );
        return res
          .status(400)
          .send(
            `A '${fkName.value}' FK mező nincs definiálva a létrehozandó táblában`
          );
      }

      // 3. Típus egyezés ellenőrzése
      if (localColumn.type !== referencedColumn.type) {
        console.log(
          `A '${fkName.value}' mező típusa nem egyezik: (${localColumn.type} vs ${referencedColumn.type})`
        );
        return res
          .status(400)
          .send(
            `A '${fkName.value}' mező típusa nem egyezik: (${localColumn.type} vs ${referencedColumn.type})`
          );
      }
    }
  }

  tableData[database].push(table);
  console.log(tableData);
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2)); //table berakva json-be
  const folderPath = path.join(folder, database, table);
  fs.mkdirSync(folderPath, { recursive: true }); //table folder letrejott
  res.json({ message: `Adatbazis '${database}'-ban '${table}' letrehozva` });

  const filePath = path.join(folderPath, "column.json");
  fs.writeFileSync(filePath, JSON.stringify(columns, null, 2));
}
