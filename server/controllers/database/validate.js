
import fs from "fs";
import { getDatabasePath } from "../../utils/paths.js";

export function getDbName(req, res){
  const dbName = req.body.name;
  console.log(dbName);
  let data = JSON.parse(fs.readFileSync(getDatabasePath()));
  if (!data.some((database) => database === dbName)) {
    return res.status(400).send({ message: "The database doesnt exist"});
  }
  res.json({ message: "sikeres kereses" });
}