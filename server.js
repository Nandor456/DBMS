//JAvitani:   - touppercase az insertnel kivenni a partnamenel
//            - az insertnel a partname-ek beolvasnanl ossze vissza irodhatnak es nem veszi eszre (tehat ha egy oszlop nev asd akkor mas oszlopnak is azt adjuk meg hogy asd, akkor azt fogja hinni a kod hogy jo es hibak lesznek ott, ezt meg atnezni)

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { inspect } = require("util");
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const app = express();
app.use(express.json());
app.use(cors());

const dbFile = "databases.json";
const folder = "test";
const tableFile = "table.json";

async function startServer() {
  await client.connect();
  app.listen(4000, () => console.log("Szerver fut a 4000-es porton!"));
}

startServer();

if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([], null));
if (!fs.existsSync(tableFile))
  fs.writeFileSync(tableFile, JSON.stringify({}, null));
if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder);
  console.log("Folder made");
} else {
  console.log("Folder done");
}

//create database
app.post("/database", (req, res) => {
  //console.log("vettem")
  const { name } = req.body;
  if (!name) return res.status(404).send("Not Found");

  let data = JSON.parse(fs.readFileSync(dbFile));
  console.log(data);
  let tableData = JSON.parse(fs.readFileSync(tableFile));
  // console.log(data);
  // console.log(name)
  // data.forEach(element => {
  //     console.log(element);
  // });
  if (data.some((database) => database === name)) {
    console.log("Mar letezik az Adatbazis nev");
    return res.status(400).send("Az adatbazis mar letezik");
  }
  data.push(name);
  console.log(data);
  tableData[name] = [];
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  const folderPath = path.join(__dirname, folder, name);
  fs.mkdirSync(folderPath, { recursive: true });
  res.json({ message: `Adatbazis '${name}' letrehozva` });
});

//create table
app.post("/database/table", (req, res) => {
  console.log("vettem table");
  const { database, table, columns } = req.body;
  console.log(req.body);
  console.log(database);
  console.log(table);
  console.log(columns);
  //nevek megvannak
  if (!database || !table || !columns) {
    console.log("Hiba a body-ban");
    return res.status(400).send("Hiba a tabla beszurassal");
  }
  console.log("elson tuljutott");

  //"databases.json" kiolvasas
  let data = JSON.parse(fs.readFileSync(dbFile));
  console.log("dsa");
  //"table.json" kiolvasas
  let tableData = JSON.parse(fs.readFileSync(tableFile));
  console.log("sas");
  if (!data.some((database2) => database2 === database)) {
    //database letezik
    console.log("Nem letezik ilyen adatbazis");
    return res.status(400).send("Nem letezik ilyen adatbazis");
  }
  //console.log("masodikon tuljutott")
  console.log(table);
  console.log(database);
  if (tableData[database].some((value) => value === table)) {
    // table mar letezik
    console.log("Mar letezik az tabla nev");
    return res.status(400).send("Mar letezik az tabla nev");
  }
  //console.log("harmadikon tuljutott")

  tableData[database].push(table);
  console.log(tableData);
  fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2)); //table berakva json-be
  const folderPath = path.join(__dirname, folder, database, table);
  fs.mkdirSync(folderPath, { recursive: true }); //table folder letrejott
  res.json({ message: `Adatbazis '${database}'-ban '${table}' letrehozva` });
  console.log(folderPath);

  filePath = path.join(folderPath, "column.json");
  const jsonData = { columns };

  fs.writeFileSync(filePath, JSON.stringify(columns, null, 2));
});

//database delete
app.delete("/database/delete", (req, res) => {
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
  const folderPath = path.join(__dirname, folder, name);
  console.log(folderPath);
  try {
    fs.rmSync(folderPath, { recursive: true, force: true }); // "force" ensures it doesn't fail if the folder is missing
  } catch (error) {
    console.error("Error deleting folder:", error);
  }
  res.json({ message: `Adatbazis '${name}'-torolve` });
});

app.delete("/database/table/delete", (req, res) => {
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
});

app.get("/database/old", (_, res) => {
  console.log("Old keres");
  let jsonData = JSON.parse(fs.readFileSync(dbFile));
  console.log(jsonData);
  //console.log(json(jsonData.map(db => db.name)));
  res.json(jsonData);
});

app.get("/database/old/table", (_, res) => {
  console.log("Old tabla keres");
  let jsonData = JSON.parse(fs.readFileSync(tableFile));
  console.log(jsonData);
  //console.log(json(jsonData.map(db => db.name)));
  res.json(jsonData);
});

function keyF(partNames, parts, tableName, dbName) {
  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const pks = jsonData.metadata.PK;
  const indexes = [];
  for (const [index, partName] of partNames.entries()) {
    if (pks.map(pk => pk.toUpperCase()).includes(partName.toUpperCase())) {
      indexes.push(index);
    }
  }
  //console.log(indexes);
  let key = "";
  for (const index of indexes) {
    if (key === "") {
      key = key + parts[index];
    } else {
      key = key + "#" + parts[index];
    }
  }
  //console.log("dasdasdsadsadsadsadasdasdsa : ", indexes);
  return { key, indexes };
}

//key(["PK2", "PK1"], ["Alice", "25"], "Tester", "Test");

function valueF(partNames, parts, indexes, dbName, tableName) {
  let finalValues = "";
  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const columnNames = jsonData.column.map((col) => col.name.toUpperCase());
  console.log("He: ", columnNames, columnNames.length);
  console.log("He2: ", partNames)
  if (columnNames.length === partNames.length) {
    for (const [index, part] of parts.entries()) {
      console.log("part: ", part);
      if (columnNames.includes(partNames[index].toUpperCase())) {
        console.log("indexes:", indexes);
        if (!indexes.includes(index)) {
          if (finalValues === "") {
            finalValues = part;
            console.log(part);
          } else {
            finalValues = finalValues + "#" + part;
          }
        }
      } else {
        console.log("hiba: 1")
        return -1;
      }
    }
    //console.log(finalValues);
    return finalValues;
  }
  console.log("hiba: 2")
  return -1;
}
// if (
//   valueF(
//     ["PK1", "Pk2", "AxsD", "DASD"],
//     ["elso", "masodik", "harmadik", "negyedik"],
//     [1, 2],
//     "Test",
//     "Tester"
//   ) === -1
// ) {
//   console.log("dsada");
// }
async function testFK(partNames, parts, tableName, dbName) {
  const columnPath = `test/${dbName}/${tableName}/column.json`;
  const jsonData = JSON.parse(fs.readFileSync(columnPath));
  const fks = jsonData.metadata.FK || [];
  for (const fk of fks) {
    const { FKName, FKTableName } = fk;
    // Megkeressük az FK oszlop indexét
    const index = partNames.findIndex((name) => name === FKName);
    if (index === -1) continue;
    const fkValue = parts[index];
    // Kapcsolódunk a hivatkozott táblához
    const refDb = client.db(dbName);
    const refTable = refDb.collection(FKTableName);

    // Megnézzük, hogy létezik-e a hivatkozott rekord
    const existing = await refTable.findOne({ _id: fkValue });
    if (!existing) {
      console.log(`Nem létező idegen kulcs érték: '${fkValue}' (${FKName})`);
      return false; // FK hibás
    }
  }
  return true; // minden FK OK
}

function isNumber(elem) {
  return !isNaN(elem) && typeof Number(elem) === "number";
}

function isBoolean(elem) {
  return elem === "true" || elem === "false" || typeof elem === "boolean";
}

function isString(elem) {
  typeof elem === "string";
}

function isDate(elem) {
  return !isNaN(Date.parse(elem));
}

function typeTest(dbName, tableName, partNames, parts) {
  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const columnNames = jsonData.column.map((col) => col.name.toUpperCase());
  const types = jsonData.column.map((col) => col.type);
  for (const [index, columnName] of columnNames.entries()) {
    const partIndex = partNames.findIndex(
      (name) => name.toUpperCase() === columnName
    );
    switch (types[index]) {
      case "string":
        if (!isString(parts[partIndex])) return -1;
        break;
      case "number":
        if (!isNumber(parts[partIndex])) return -1;
        break;
      case "boolean":
        if (!isBoolean(parts[partIndex])) return -1;
        break;
      case "date":
        if (!isDate(parts[partIndex])) return -1;
        break;
      default:
        return -1;
    }
    return 1;
  }
}

async function unique(partNames, parts, tableName, dbName, collection, key) {
  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  //console.log("haaaaalo: ", jsonData.constraints.uniques, partNames)
  let indexes = []
  for (const [index, partName] of (partNames.filter(partName => !jsonData.metadata.PK.includes(partName))).entries()) {
    //console.log(partName)
    if (jsonData.constraints.uniques.includes(partName)) {
      indexes.push(index);
    }
  }
  //console.log("mivan: ", indexes)
  const cursor = await collection.find({}, { projection: { value: 1, _id: 0 } }).toArray();
  for (const index of indexes) {
    for (const value of cursor) {
      //console.log("value", value.value.split('#')[index], typeof (parts));
      if (parts.split('#')[index] === value.value.split('#')[index]) {
        console.log(parts.split('#')[index], value.value.split('#')[index])
        console.log("ide meny")
        return false;
      }
    }
  }
  console.log("true volt")
  return true;
}

//typeTest("Test", "Tester", [2]);

// {
//   "query": "\n\nUSE Test;\n\nINSERT IntO HasznalomFK (PK, Semmi, Elso) VALUES ('1', 2004/01/01, 'true')"
// }
app.post("/database/row/insert", async (req, res) => {
  const { query } = req.body;
  let data = JSON.parse(fs.readFileSync(dbFile));
  let tableData = JSON.parse(fs.readFileSync(tableFile));
  if (!query) return res.status(404).send("Not Found");
  const lines = query.split("\n");
  let elements = [];
  for (const line of lines) {
    if (line.trim() !== "") {
      elements.push(line);
    }
  }
  const inserts = elements.pop();
  const firstElement = elements.pop();
  let use = firstElement.split(" ")[0];
  console.log("USe: ", use);
  const dbName = firstElement.split(" ")[1].replace(/;$/, "");
  console.log(dbName);
  //console.log(inserts);
  let insert = inserts.split(" ")[0] + " " + inserts.split(" ")[1];
  //console.log("insert: ", insert);
  const tableName = inserts.split("(")[0].split(" ")[2].trim();
  console.log("tableName: ", tableName);
  const columns = inserts.split("(")[1].split(")")[0];
  console.log("column", columns);
  let value = inserts.split(")")[1].split("(")[0];
  const values = inserts.split("(")[2].split(")")[0];
  console.log("Values: ", values);
  //console.log("Csak columns-ek: ", columns);
  //console.log(insert);
  insert = insert.toUpperCase();
  use = use.toUpperCase();
  value = value.toUpperCase().trim();

  const partNames = columns
    .split(",")
    .map((v) => v.trim().replace(/^'|'$/g, "").replace(/;$/, ""));

  const parts = values
    .split(",")
    .map((v) => v.trim().replace(/^'|'$/g, "").replace(/;$/, ""));
  //console.log("parts:", parts[0]);
  //console.log("parts:", partNames, parts);

  //ellenorzesek
  if (
    insert !== "INSERT INTO" ||
    use !== "USE" ||
    value !== "VALUES" ||
    !tableName ||
    !dbName
  ) {
    res.status(400).send("Hibas INSERT hivas");
    console.log("Hibas INSERT hivas");
    return;
  }
  if (!data.some((database) => database === dbName)) {
    console.log("Nem letezik az Adatbazis");
    return res.status(400).send("Az adatbazis nem letezik");
  }
  if (!tableData[dbName].some((value) => value === tableName)) {
    // table meg nem letezik
    //console.log("Meg nem letezik a tabla");
    return res.status(400).send("Meg nem letezik a tabla");
  }
  if (partNames.length !== parts.length) {
    console.log("itt a baj: ", partNames.length, parts.length)
    return res.status(400).send("Hibas column megadas");
  }
  const fkValid = await testFK(partNames, parts, tableName, dbName);
  if (!fkValid) {
    return res
      .status(400)
      .send("FK hibás: nem létező idegen kulcsra hivatkoztál");
  }

  //console.log("dsadasdasdsadadasd:     ", tableName, dbName);
  const { key, indexes } = keyF(partNames, parts, tableName, dbName);
  //console.log(indexes);
  //console.log("Kulcsok: ", key);
  const finalValues = valueF(partNames, parts, indexes, dbName, tableName);
  if (finalValues === -1) {
    console.log("itt a baj: ", partNames, parts, indexes, dbName, tableName)
    return res.status(400).send("Hibas column megadas");
  }
  if (typeTest(dbName, tableName, partNames, parts) === -1) {
    return res.status(400).send("Hibas tipusu elem megadasa");
  }
  //console.log(insert)
  const db = client.db(dbName);
  const collection = db.collection(tableName);
  //Ha meg nem letezett az adabazis - key - indexnek allitjuk
  //await collection.createIndex({ key: 1 }, { unique: true });
  //QQQQQQ
  try {
    // 🔍 Ellenőrzés, hogy már van-e ilyen kulcs
    const existing = await collection.findOne({ _id: key });
    if (existing) {
      console.log("Ez a kulcs már létezik!");
      return res.status(400).send("Ez a kulcs már létezik!");
    }
    if (!(await unique(partNames, finalValues, tableName, dbName, collection, key))) {
      return res.status(400).send("Az egyik ertek unique, es mar letezik");
    }
    //Ha nem létezik, beszúrjuk
    await collection.insertOne({ _id: key, value: finalValues });
    console.log("beszurodott");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Hiba történt az adatbázisban");
  }
});

const whichID = (condition, dbName, tableName) => {
  const valuesAnd = condition.split("AND");
  const idMap = {};

  const jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const pks = jsonData.metadata.PK.map((pk) => pk.toUpperCase());
  console.log("valuesAnd:", valuesAnd)
  for (const element of valuesAnd) {
    //const parts = element.trim().split(" ");
    console.log(element)
    let field = "";
    let value = "";
    try {
      field = element.split("=")[0].toUpperCase();
      value = element.split("=")[1];
    } catch (err) {
      return -1;
    }
    console.log(field, value)
    if (!field || !value) {
      console.log("hiba 3")
      return -1;
    }
    idMap[field] = value.replace(/['"]/g, "");
  }

  console.log("IdMap: ", idMap, "Pks:", pks)
  let keyParts = [];
  for (const pk of pks) {
    if (!(pk in idMap)) {
      console.log("hiba 1")
      return -1; // ha egy PK hianyzik
    }
    keyParts.push(idMap[pk]);
  }

  return keyParts.join("#");
};

//USE Namost;
//Delete from Tablam where elso='2'
app.delete("/database/row/delete", async (req, res) => {
  const { query } = req.body;
  let data = JSON.parse(fs.readFileSync(dbFile));
  let tableData = JSON.parse(fs.readFileSync(tableFile));
  console.log(query);
  if (!query) {
    return res.status(400).send("Ures query");
  }

  const lines = query.split("\n");
  // console.log(lines);
  let elements = [];
  for (const line of lines) {
    if (line.trim() !== "") {
      elements.push(line);
    }
  }
  const inserts = elements.pop();
  const firstElement = elements.pop();
  let use = firstElement.split(" ")[0];
  const dbName = firstElement.split(" ")[1].replace(/;$/, "");
  let delet = inserts.split(" ")[0] + " " + inserts.split(" ")[1];
  const tableName = inserts.split(" ")[2];
  const whereIndex = inserts.toUpperCase().indexOf("WHERE");
  if (whereIndex === -1) {
    return res.status(400).send("Hiányzik a WHERE kulcsszó");
  }
  const condition = inserts.slice(whereIndex + "WHERE".length).trim();

  console.log("condition:" + condition);
  delet = delet.toUpperCase();
  use = use.toUpperCase();

  if (delet !== "DELETE FROM" || use !== "USE" || !tableName || !dbName) {
    return res.status(400).send("Hibas INSERT hivas");
  }
  if (!data.some((database) => database === dbName)) {
    console.log("Nem letezik az Adatbazis");
    return res.status(400).send("Az adatbazis nem letezik");
  }
  if (!tableData[dbName].some((value) => value === tableName)) {
    // table meg nem letezik
    //console.log("Meg nem letezik a tabla");
    return res.status(400).send("Meg nem letezik a tabla");
  }
  const value = whichID(condition, dbName, tableName);
  if (!value || value === -1) {
    return res.status(400).send("Nem jol adta meg az id-t");
  }
  const db = client.db(dbName);
  const collection = db.collection(tableName);

  const deleteResult = await collection.deleteOne({ _id: value });
  if (deleteResult.deletedCount === 0) {
    return res.status(404).send("A megadott id-hoz nem tartozik rekord");
  }
  res.status(200).send("Delete sikeres");
});


// {
//   "query": "\n\nUSE aaa;\n\nCreate index indexidename\n\nOn a (column3, column2)"
// }
// Use dbName
// Create index indexName
// On tablaNev (columnNev1 ....)
app.post('/database/row/index', async (req, res) => { // column indexes 
  const { query } = req.body;
  let data = JSON.parse(fs.readFileSync(dbFile));
  let tableData = JSON.parse(fs.readFileSync(tableFile));
  //  console.log(query);
  if (!query) {
    return res.status(400).send("Ures query");
  }
  const lines = query.split("\n");
  // console.log(lines);
  let elements = [];
  for (const line of lines) {
    if (line.trim() !== "") {
      elements.push(line);
    }
  }
  let inserts = "";
  // /n/n/ handle after "use dbName"
  while (elements.length > 1) {
    inserts = elements.pop() + " " + inserts;
  }
  // parse
  const firstElement = elements.pop();
  let use = firstElement.split(" ")[0];
  const dbName = firstElement.split(" ")[1].replace(/;$/, "");
  console.log(use, dbName)
  let create = inserts.split(" ")[0];
  let index = inserts.split(" ")[1];
  const indexName = inserts.split(" ")[2];
  let on = inserts.split(" ")[3];
  const tableName = inserts.split(" ")[4];
  console.log("ez az: ", inserts)
  let columns;
  const match = inserts.match(/\(([^)]+)\)/);
  if (match) {
    columns = match[1].split(",").map(col => col.trim());
  } else {
    console.log("No columns found");
  }
  //console.log(create, index, indexName, on, tableName, columns);
  create = create.toUpperCase();
  index = index.toUpperCase();
  use = use.toUpperCase();
  on = on.toUpperCase();

  if (create !== "CREATE" || index !== "INDEX" || !indexName || on !== "ON" || use !== "USE" || !tableName || !dbName) {
    return res.status(400).send("Hibas INDEX hivas");
  }
  if (!data.some((database) => database === dbName)) {
    console.log("Nem letezik az Adatbazis");
    return res.status(400).send("Az adatbazis nem letezik");
  }
  if (!tableData[dbName].some((value) => value === tableName)) {
    // table meg nem letezik
    return res.status(400).send("Meg nem letezik a tabla");
  }
  if (await createIndex(indexName, columns, tableName, dbName)) {

  }
  return res.status(200).send("Sikeres index keszites")
})

async function createIndex(indexName, columns, tableName, dbName) {
  const db = client.db(dbName);
  const collections = await db.listCollections({ name: indexName }).toArray();

  if (collections.length > 0) {
    console.log("Collection already exists:", indexName);
    return 1;
  } else {
    const collection = db.collection(indexName);
    const tableCollection = db.collection(tableName);

    let jsonData = JSON.parse(
      fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
    );

    const primaryKeys = jsonData.metadata.PK; // ["aa"]

    const nonPkColumns = jsonData.column
      .filter(column => !primaryKeys.includes(column.name))  // csak ami nem PK
      .map(column => column.name);

    console.log(nonPkColumns, primaryKeys)
    let indexes = []
    for (const [index, columnName] of nonPkColumns.entries()) {
      //console.log(columnName)
      console.log("columnName: ", columnName)
      if (columns.includes(columnName)) {
        indexes.push({
          columnIndex: columns.indexOf(columnName), // hol van a columns tömbben
          nonPkIndex: index // hol van a nem-pk oszlopok kozott
        });
      }
    }
    if (indexes.length !== columns.length) {      //minden megadott column letezzen
      console.log("Nem letezik valamelyik column")
      return -1;
    }
    console.log("indexes: ", indexes)
    const cursor = await tableCollection.find({}, { projection: { value: 1, _id: 1 } }).toArray();
    let finalValues = [];

    //vegig megyunk az osszes tablan
    for (const value of cursor) {
      let key = "";
      //csak azokat az elemeket vesszuk ki a tablabol amelyik erdekel column-ek szerint
      for (const index of indexes) {
        //megcsinalja  az osszetett kulcsot ha kell
        if (key === "") {
          key = value.value.split("#")[index.nonPkIndex]
        } else {
          key = key + "#" + value.value.split("#")[index.nonPkIndex]
        }
      }
      //feltoltjuk az osszes value erteknek valo Pk-t 
      if (finalValues[key] === undefined) {
        finalValues[key] = value._id;
      } else {
        finalValues[key] = finalValues[key] + "#" + value._id;
      }
      // }
    }
    console.log(finalValues)
    for (const [key, value] of Object.entries(finalValues)) {
      await collection.insertOne({ _id: key, value: value })
      console.log("egy beszuras")
    }
  }

}

createIndex("dsad", ['ez', 'az'], "hes", "aaa")