import express from "express";
import cors from "cors";
import fs from "fs";
import { dirname } from "path";
import { MongoClient } from "mongodb";
import SelectRouter from "./server/routes/select.js";
import CreateRouter from "./server/routes/create.js";
import DatabaseRouter from "./server/routes/database.js";
import DeleteRouter from "./server/routes/delete.js";
import InsertRouter from "./server/routes/insert.js";
import joinRouter from "./server/routes/join.js";
import { getColumns } from "./server/utils/getDbData.js";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cors());
const dbFile = "databases.json";
const folder = "test";
const tableFile = "table.json";

async function startServer() {
  await client.connect();
  app.listen(4000, () => console.log("Szerver fut a 4000-es porton!"));
}

export function getDBClient() {
  return client;
}

startServer();

if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify([], null));
if (!fs.existsSync(tableFile))
  fs.writeFileSync(tableFile, JSON.stringify({}, null));
if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder);
  console.log("Folder made");
}

app.use("/database", CreateRouter);

app.use("/database/isvalid", DatabaseRouter);

app.use("/database/table", CreateRouter);

app.use("/database/delete", DeleteRouter);

app.use("/database/table/delete", DeleteRouter);

app.use("/database/old", DatabaseRouter);
//*
// insert
app.use("/database/row/insert", InsertRouter);

app.use("/database/row", DeleteRouter);

app.use("/database/row", InsertRouter);
app.use("/database/row", joinRouter);
app.use((req, res, next) => {
  console.log(`Request to: ${req.url}`);
  next();
});

app.post("/database/columns", (req, res) => {
  const { database, table } = req.body;
  if (!database || !table) {
    return res.status(400).json({ error: "Missing database or table" });
  }

  const columns = getColumns(database, table);
  res.json({ columns });
});

app.use(SelectRouter);
