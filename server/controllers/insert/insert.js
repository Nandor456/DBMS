import fs from "fs";
import path from "path";
import { getDatabasePath, getTablePath } from "../../utils/paths.js";
import { MongoClient } from "mongodb";

const dbFile = getDatabasePath();
const tableFile = getTablePath();
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

function keyF(partNames, parts, tableName, dbName) {
  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const pks = jsonData.metadata.PK;
  const indexes = [];
  for (const [index, partName] of partNames.entries()) {
    if (pks.map((pk) => pk.toUpperCase()).includes(partName.toUpperCase())) {
      if (pks.map((pk) => pk.toUpperCase()).includes(partName.toUpperCase())) {
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
}
//key(["PK2", "PK1"], ["Alice", "25"], "Tester", "Test");

function valueF(partNames, parts, indexes, dbName, tableName) {
  let finalValues = "";
  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const columnNames = jsonData.column.map((col) => col.name.toUpperCase());
  //console.log("He: ", columnNames, columnNames.length);
  //console.log("He2: ", partNames);
  //console.log("He2: ", partNames);
  if (columnNames.length === partNames.length) {
    for (const [index, part] of parts.entries()) {
      //console.log("part: ", part);
      if (columnNames.includes(partNames[index].toUpperCase())) {
        //console.log("indexes:", indexes);
        if (!indexes.includes(index)) {
          if (finalValues === "") {
            finalValues = part;
            //console.log(part);
          } else {
            finalValues = finalValues + "#" + part;
          }
        }
      } else {
        //console.log("hiba: 1");
        //console.log("hiba: 1");
        return -1;
      }
    }
    //console.log(finalValues);
    return finalValues;
  }
  //console.log("hiba: 2");
  //console.log("hiba: 2");
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
  return typeof elem === "string";
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
  let indexes = [];
  //console.log("hiba3: ", jsonData.metadata.PK, partNames);
  for (const [index, partName] of partNames
    .filter((partName) => !jsonData.metadata?.PK?.includes(partName))
    .entries()) {
    //console.log(partName)

    if (jsonData.constraints?.uniques?.includes(partName)) {
      indexes.push(index);
    }
  }
  //console.log("mivan: ", indexes)
  const cursor = await collection
    .find({}, { projection: { value: 1, _id: 0 } })
    .toArray();
  for (const index of indexes) {
    for (const value of cursor) {
      //console.log("value", value.value.split('#')[index], typeof (parts));
      if (parts.split("#")[index] === value.value.split("#")[index]) {
        console.log(parts.split("#")[index], value.value.split("#")[index]);
        console.log("ide meny");
        return false;
      }
    }
  }
  //console.log("true volt");
  return true;
}

//UJ Lab3-hoz Insert esetben indexek updateje
async function handleindexes(pk, parts, dbName, tableName) {
  console.log("baj: ", parts);
  console.log("pk", pk);
  console.log(dbName);
  console.log(tableName);

  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();
  const regex = new RegExp(`ᛥ${tableName}ᛥindexes`);
  const filteredCollections = collections.filter(
    (collection) => regex.test(collection.name) // '$' jelzi, hogy csak a végén legyen
  );

  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const primaryKeys = jsonData.metadata.PK;
  const nonPkColumns = jsonData.column
    .filter((column) => !primaryKeys.includes(column.name)) // csak ami nem PK
    .map((column) => column.name);
  let cols = [];
  for (const filter of filteredCollections) {
    let index = 3;
    let indexes = [];
    let element = " ";
    while (element !== undefined) {
      element = filter.name.split("ᛥ")[index];
      console.log(element);
      //console.log(element);
      if (element !== undefined) {
        indexes.push(element);
        //indexes.push(element);
      }
      index = index + 1;
    }
    if (indexes.length > 0) {
      //cols.push(indexes)
      let final = "";
      for (const ind of indexes) {
        if (final === "") {
          final = final + parts.split("#")[ind];
        } else {
          final = final + "#" + parts.split("#")[ind];
        }
      }
      const collection = db.collection(filter.name);
      const existingDoc = await collection.findOne({ _id: final });
      if (existingDoc) {
        // Ha létezik, frissítjük: hozzáadjuk az új partNames és parts értékeket
        await collection.updateOne(
          { _id: final },
          {
            $set: { value: existingDoc.value + "#" + pk },
          }
        );
      } else {
        // Ha nem létezik, létrehozunk egy új dokumentumot
        await collection.insertOne({
          _id: final,
          value: pk,
        });
      }
    }
  }
}

//handleindexes('ssssss22', 'd', ['elem2er', 'alma'], 'aaa', 'hes')
//typeTest("Test", "Tester", [2]);

// {
//   "query": "\n\nUSE Test;\n\nINSERT IntO HasznalomFK (PK, Semmi, Elso) VALUES ('1', 2004/01/01, 'true')"
// }
//USE Test;
//INSERT IntO HasznalomFK (PK, Semmi, Elso) VALUES ('1', 2004/01/01, 'true')
export async function insert(req, res) {
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
  const firstElement = elements.shift();
  let inserts = elements.shift();
  const valuesLines = elements;
  inserts = inserts + " " + valuesLines;
  let use = firstElement.split(" ")[0];
  //console.log("USe: ", use);
  const dbName = firstElement.split(" ")[1].replace(/;$/, "");
  //console.log(dbName);
  //console.log(inserts);
  let insert = inserts.split(" ")[0] + " " + inserts.split(" ")[1];
  //console.log("insert: ", insert);
  const tableName = inserts.split("(")[0].split(" ")[2].trim();
  //console.log("tableName: ", tableName);
  const columns = inserts.split("(")[1].split(")")[0];
  //console.log("column", columns);
  let value = inserts.split(")")[1].split("(")[0];

  const valuesMatches = [...inserts.matchAll(/\(([^()]+)\)/g)];

  if (valuesMatches.length === 0) {
    return res.status(400).send("Nem található érték az INSERT-ben.");
  }

  const valuesList = valuesMatches
    .slice(1)
    .map((match) =>
      match[1].split(",").map((v) => v.trim().replace(/^'|'$/g, ""))
    );

  //console.log("Csak columns-ek: ", columns);
  //console.log(insert);
  insert = insert.toUpperCase();
  use = use.toUpperCase();
  value = value.toUpperCase().trim();

  const partNames = columns
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
  let documents = [];
  for (const values of valuesList) {
    const parts = values;
    //      .split(",")
    //    .map((v) => v.trim().replace(/^'|'$/g, "").replace(/;$/, ""));

    if (partNames.length !== parts.length) {
      //console.log("itt a baj: ", partNames.length, parts.length);
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
    //console.log("itt a pk: ", key);
    //console.log(indexes);
    //console.log("Kulcsok: ", key);
    const finalValues = valueF(partNames, parts, indexes, dbName, tableName);
    if (finalValues === -1) {
      //console.log("itt a baj: ", partNames, parts, indexes, dbName, tableName);
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
    try {
      let jsonData = JSON.parse(
        fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
      );
      // 🔍 Ellenőrzés, hogy már van-e ilyen kulcs
      const existing = await collection.findOne({ _id: key });
      if (existing) {
        console.log("Ez a kulcs már létezik!");
        return res.json({ error: "Ez a kulcs már létezik!" });
      }
      //console.log("hiba2: ", partNames, finalValues, tableName, dbName, key);
      if (
        !(await unique(
          partNames,
          finalValues,
          tableName,
          dbName,
          collection,
          key
        ))
      ) {
        return res.status(400).send("Az egyik ertek unique, es mar letezik");
      }
      //Ha nem létezik, beszúrjuk
      //console.log("index elott");
      handleindexes(key, finalValues, dbName, tableName);
      documents.push({ _id: key, value: finalValues });
    } catch (err) {
      console.error(err);
      res.status(500).send("Hiba történt az adatbázisban");
    }
  }
  //console.log("index megoldva");
  try {
    console.log("insert many res: ", documents);
    const db = client.db(dbName);
    const collection = db.collection(tableName);
    await collection.insertMany(documents);
    //console.log("beszurodott");
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Hiba történt az adatbázisban");
  }
}
