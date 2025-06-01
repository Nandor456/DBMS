import fs from "fs";
import path from "path";
import { getDatabasePath, getTablePath } from "../../utils/paths.js";
import { MongoClient } from "mongodb";

const dbFile = getDatabasePath();
const tableFile = getTablePath();
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

const whichID = (condition, dbName, tableName) => {
  const valuesAnd = condition.split("AND");
  const idMap = {};

  const jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const pks = jsonData.metadata.PK.map((pk) => pk.toUpperCase());
  console.log("valuesAnd:", valuesAnd);
  for (const element of valuesAnd) {
    //const parts = element.trim().split(" ");
    console.log(element);
    let field = "";
    let value = "";
    try {
      field = element.split("=")[0].toUpperCase();
      value = element.split("=")[1];
    } catch (err) {
      return -1;
    }
    console.log(field, value);
    if (!field || !value) {
      console.log("hiba 3");
      return -1;
    }
    idMap[field] = value.replace(/['"]/g, "");
  }

  console.log("IdMap: ", idMap, "Pks:", pks);
  let keyParts = [];
  for (const pk of pks) {
    if (!(pk in idMap)) {
      console.log("hiba 1");
      return -1; // ha egy PK hianyzik
    }
    keyParts.push(idMap[pk]);
  }

  return keyParts.join("#");
};

async function fkissue(pk, dbName, tableName) {
  const tableData = JSON.parse(fs.readFileSync(tableFile));
  const tables = tableData[dbName] || [];

  const db = client.db(dbName);

  for (const otherTable of tables) {
    if (otherTable === tableName) continue;

    const otherTableJson = JSON.parse(
      fs.readFileSync(`test/${dbName}/${otherTable}/column.json`)
    );

    const fkList = otherTableJson.metadata.FK || [];

    for (const fk of fkList) {
      const fkTableName = fk.FKTableName;
      const fkColumnName = fk.FKName;

      if (fkTableName === tableName) {
        const foreignTable = db.collection(otherTable);
        const notPkValues = otherTableJson.column.filter(
          (column) => !otherTableJson.metadata.PK.includes(column.name)
        );

        let foreignIndex = -1;
        for (const [index, notPkValue] of notPkValues.entries()) {
          if (notPkValue.name === fkColumnName) {
            foreignIndex = index;
            break;
          }
        }

        if (foreignIndex === -1) {
          return 1;
        }

        const cursor = await foreignTable.find({}).toArray();
        for (const foreignTableValue of cursor) {
          if (foreignTableValue.value.split("#")[foreignIndex] === pk) {
            // Itt NEM dobunk hibát, hanem visszaadunk egy jelet
            return {
              blocked: true,
              table: otherTable,
            };
          }
        }
      }
    }
  }

  return { blocked: false };
}

async function cleanupIndexesOnDelete(pk, dbName, tableName) {
  const db = client.db(dbName);
  const collections = await db.listCollections().toArray();
  const regex = new RegExp(`ᛥ${tableName}ᛥindexes`);
  const filteredCollections = collections.filter((collection) =>
    regex.test(collection.name)
  );
  console.log("Filtered Collections:", filteredCollections);

  for (const filter of filteredCollections) {
    let index = 3;
    let indexes = [];
    let element = " ";
    while (element !== undefined) {
      element = filter.name.split("ᛥ")[index];
      if (element !== undefined) {
        indexes.push(element);
      }
      index += 1;
    }
    console.log("Indexes:", indexes);
    const jsonData = JSON.parse(
      fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
    );
    const allColumns = jsonData.column.map((col) => col.name);
    const valueIndexMap = [];
    console.log("All Columns:", allColumns);
    for (const colName of indexes) {
      const idx = parseInt(colName); // colName az '0', '1' stb.
      if (!isNaN(idx) && idx >= 0 && idx < allColumns.length) {
        valueIndexMap.push(idx);
      }
    }
    console.log("Value Index Map:", valueIndexMap);
    const collection = db.collection(filter.name);
    const cursor = await db.collection(tableName).findOne({ _id: pk });
    if (!cursor) continue;

    const parts = cursor.value.split("#");
    let final = valueIndexMap.map((i) => parts[i]).join("#");

    const indexDoc = await collection.findOne({ _id: final });
    if (indexDoc) {
      let values = indexDoc.value.split("#").filter((v) => v !== pk);
      if (values.length > 0) {
        await collection.updateOne(
          { _id: final },
          { $set: { value: values.join("#") } }
        );
      } else {
        await collection.deleteOne({ _id: final });
      }
    }
  }
}

//USE Namost;
//Delete from Tablam where elso='2'
export async function deleteRow(req, res) {
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

  // Itt vizsgáljuk FK-t!
  const fkResult = await fkissue(value, dbName, tableName);
  if (fkResult.blocked) {
    return res
      .status(400)
      .send(
        `Nem lehet törölni, mert az '${fkResult.table}' táblában létezik hivatkozás az adott rekordra`
      );
  }

  const db = client.db(dbName);
  const collection = db.collection(tableName);
  // indexelt oszlopokbol torles
  await cleanupIndexesOnDelete(value, dbName, tableName);
  const deleteResult = await collection.deleteOne({ _id: value });
  if (deleteResult.deletedCount === 0) {
    return res.status(404).send("A megadott id-hoz nem tartozik rekord");
  }

  res.status(200).send("Delete sikeres");
}
