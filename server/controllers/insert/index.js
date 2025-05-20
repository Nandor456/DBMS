
import fs from "fs";
import { getDatabasePath, getTablePath } from "../../utils/paths.js";
import { MongoClient } from "mongodb";

const dbFile = getDatabasePath();
const tableFile = getTablePath();
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

// {
//   "query": "\n\nUSE aaa;\n\nCreate index indexidename\n\nOn a (column3, column2)"
// }
// Use dbName
// Create index indexName
// On tablaNev (columnNev1 ....)

export async function indexController(req, res) {
  // column indexes
  const { query } = req.body;
  console.log("creating index");

  let data = JSON.parse(fs.readFileSync(dbFile));
  let tableData = JSON.parse(fs.readFileSync(tableFile));

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
  let create = inserts.split(" ")[0];
  let index = inserts.split(" ")[1];
  let indexName = inserts.split(" ")[2].replace(/'/, "");
  let on = inserts.split(" ")[3];
  const tableName = inserts.split(" ")[4];
  let columns;
  const match = inserts.match(/\(([^)]+)\)/);
  if (match) {
    columns = match[1].split(",").map((col) => col.trim().replace(/'/g, ""));
  } else {
    console.log("No columns found");
  }
  create = create.toUpperCase();
  index = index.toUpperCase();
  use = use.toUpperCase();
  on = on.toUpperCase();

  if (
    create !== "CREATE" ||
    index !== "INDEX" ||
    !indexName ||
    on !== "ON" ||
    use !== "USE" ||
    !tableName ||
    !dbName
  ) {
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
    return res.status(200).send("Sikeres index keszites");
  }
  return res.status(400).send("Mar letezik az index");
}

async function createIndex(indexName, columns, tableName, dbName) {
  const db = client.db(dbName);
  let jsonData = JSON.parse(
    fs.readFileSync(`test/${dbName}/${tableName}/column.json`)
  );
  const primaryKeys = jsonData.metadata.PK;
  const nonPkColumns = jsonData.column
    .filter((column) => !primaryKeys.includes(column.name)) // csak ami nem PK
    .map((column) => column.name);
  let indexes = [];
  for (const [index, columnName] of nonPkColumns.entries()) {
    if (columns.includes(columnName)) {
      indexes.push({
        columnIndex: columns.indexOf(columnName), // hol van a columns tömbben
        nonPkIndex: index, // hol van a nem-pk oszlopok kozott
      });
    }
  }
  const initIndexName = indexName;
  indexName = indexName + `ᛥ${tableName}ᛥindexes`;
  for (const index of indexes) {
    indexName = indexName + "ᛥ" + index.nonPkIndex;
  }
  const collections = await db.listCollections({ name: indexName }).toArray();

  if (collections.length > 0) {
    console.log("Collection already exists:", indexName);
    return 0;
  } else {
    const collection = db.collection(indexName);
    const tableCollection = db.collection(tableName);

    if (indexes.length !== columns.length) {
      //minden megadott column letezzen
      console.log("Nem letezik valamelyik column");
      return 0;
    }
    const cursor = await tableCollection
      .find({}, { projection: { value: 1, _id: 1 } })
      .toArray();
    let finalValues = [];

    //vegig megyunk az osszes tablan
    for (const value of cursor) {
      let key = "";
      //csak azokat az elemeket vesszuk ki a tablabol amelyik erdekel column-ek szerint
      for (const index of indexes) {
        //megcsinalja  az osszetett kulcsot ha kell
        if (key === "") {
          key = value.value.split("#")[index.nonPkIndex];
        } else {
          key = key + "#" + value.value.split("#")[index.nonPkIndex];
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
    for (const [key, value] of Object.entries(finalValues)) {
      await collection.insertOne({ _id: key, value: value });
    }
    jsonData.metadata.indexedColumns.push({
      column: columns,
      name: initIndexName,
    });
    fs.writeFileSync(
      `test/${dbName}/${tableName}/column.json`,
      JSON.stringify(jsonData, null, 2)
    );
    return 1;
  }
}