import fs from "fs";
import { getDatabasePath, getTablePath } from "../../utils/paths.js";
import { MongoClient } from "mongodb";

const dbFile = getDatabasePath();
const tableFile = getTablePath();
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

function readColumnJson(dbName, tableName) {
  return JSON.parse(fs.readFileSync(`test/${dbName}/${tableName}/column.json`));
}

function keyF(partNames, parts, jsonData) {
  const pks = jsonData.metadata.PK;
  const indexes = [];
  for (const [index, partName] of partNames.entries()) {
    if (pks.map((pk) => pk.toUpperCase()).includes(partName.toUpperCase())) {
      indexes.push(index);
    }
  }
  let key = indexes.map((i) => parts[i]).join("#");
  return { key, indexes };
}

function valueF(partNames, parts, indexes, jsonData) {
  const columnNames = jsonData.column.map((col) => col.name.toUpperCase());
  let finalValues = [];
  for (const [index, part] of parts.entries()) {
    if (!columnNames.includes(partNames[index].toUpperCase())) return -1;
    if (!indexes.includes(index)) finalValues.push(part);
  }
  return finalValues.join("#");
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

function typeTest(jsonData, partNames, parts) {
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
  }
  return 1;
}

async function testFK(partNames, parts, jsonData, dbName) {
  const fks = jsonData.metadata.FK || [];
  const db = client.db(dbName);
  for (const fk of fks) {
    const { FKName, FKTableName } = fk;
    const index = partNames.findIndex((name) => name === FKName);
    if (index === -1) continue;
    const fkValue = parts[index];
    const existing = await db.collection(FKTableName).findOne({ _id: fkValue });
    if (!existing) return false;
  }
  return true;
}

async function uniqueCheck(partNames, finalValues, jsonData, collection) {
  const uniqueCols = jsonData.constraints?.uniques || [];
  const nonPKCols = partNames.filter(
    (name) => !jsonData.metadata.PK.includes(name)
  );
  const indexes = nonPKCols
    .map((name, idx) => ({ name, idx }))
    .filter(({ name }) => uniqueCols.includes(name))
    .map(({ idx }) => idx);

  if (indexes.length === 0) return true;

  const allValues = await collection
    .find({}, { projection: { value: 1, _id: 0 } })
    .toArray();
  for (const val of allValues) {
    const existingParts = val.value.split("#");
    for (const i of indexes) {
      if (existingParts[i] === finalValues.split("#")[i]) {
        return false;
      }
    }
  }
  return true;
}

async function handleIndexes(pk, parts, dbName, tableName, jsonData) {
  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();
  const regex = new RegExp(`ᛥ${tableName}ᛥindexes`);
  const filteredCollections = collections.filter((col) => regex.test(col.name));
  for (const col of filteredCollections) {
    const indexes = col.name.split("ᛥ").slice(3);
    if (indexes.length === 0) continue;
    const values = indexes.map((i) => parts.split("#")[i]);
    const final = values.join("#");
    const collection = db.collection(col.name);
    const existing = await collection.findOne({ _id: final });
    if (existing) {
      await collection.updateOne(
        { _id: final },
        { $set: { value: existing.value + "#" + pk } }
      );
    } else {
      await collection.insertOne({ _id: final, value: pk });
    }
  }
}

export async function insert(req, res) {
  const { query } = req.body;
  if (!query) return res.status(404).send("Not Found");

  const data = JSON.parse(fs.readFileSync(dbFile));
  const tableData = JSON.parse(fs.readFileSync(tableFile));

  const lines = query.split("\n").filter((l) => l.trim() !== "");
  const useCmd = lines.shift();
  let insertCmd = lines.shift();
  insertCmd = insertCmd + " " + lines.join(" ");

  const dbName = useCmd.split(" ")[1].replace(/;$/, "");
  const tableName = insertCmd.split("(")[0].split(" ")[2].trim();
  const partNames = insertCmd
    .split("(")[1]
    .split(")")[0]
    .split(",")
    .map((v) => v.trim().replace(/^'|'$/g, ""));

  const valuesMatches = [...insertCmd.matchAll(/\(([^()]+)\)/g)].slice(1);
  const valuesList = valuesMatches.map((m) =>
    m[1].split(",").map((v) => v.trim().replace(/^'|'$/g, ""))
  );

  if (!data.includes(dbName) || !tableData[dbName]?.includes(tableName)) {
    return res.status(400).send("Hibas adatbazis vagy tabla");
  }

  const db = client.db(dbName);
  const collection = db.collection(tableName);
  const jsonData = readColumnJson(dbName, tableName);
  const documents = [];

  for (const parts of valuesList) {
    if (partNames.length !== parts.length) {
      return res.status(400).send("Hibas column megadas");
    }
    if (!(await testFK(partNames, parts, jsonData, dbName))) {
      return res.status(400).send("FK hibás: nem létező idegen kulcs");
    }
    const { key, indexes } = keyF(partNames, parts, jsonData);
    if (await collection.findOne({ _id: key })) {
      return res.json({ error: "Ez a kulcs már létezik!" });
    }
    const finalValues = valueF(partNames, parts, indexes, jsonData);
    if (finalValues === -1) return res.status(400).send("Hibas column megadas");
    if (typeTest(jsonData, partNames, parts) === -1) {
      return res.status(400).send("Hibas tipusu elem megadasa");
    }
    if (!(await uniqueCheck(partNames, finalValues, jsonData, collection))) {
      return res.status(400).send("Az egyik ertek unique, es mar letezik");
    }
    await handleIndexes(key, finalValues, dbName, tableName, jsonData);
    documents.push({ _id: key, value: finalValues });
  }

  try {
    await collection.insertMany(documents);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Hiba történt az adatbázisban");
  }
}
