import express from "express";
import { getConditions } from "../select/getConditions.js";
import { whereSelection } from "../select/whereSelection.js";
import { getProjection } from "../select/getProjection.js";
import { getColumnsToProject } from "../select/getColumnsToProject.js";

const router = express.Router();
console.log("SelectRouter loaded");

router.post("/database/row/select", async (req, res) => {
  const whereData = getConditions(req.body);
  if (!whereData.success) {
    res.send(whereData.message);
  }
  console.log("whereData", whereData);
  const selection = await whereSelection(whereData);
  if (!selection.success) {
    res.send(selection.message);
  }
  console.log("selection", selection);
  const projection = getProjection(
    selection.result,
    whereData.dbName,
    whereData.collName
  );
  let filteredProjection;
  const columsToProject = getColumnsToProject(req.body);
  if (columsToProject[0] !== "*") {
    filteredProjection = projection.map((row) => {
      const filteredRow = {};
      for (const col of columsToProject) {
        if (row.hasOwnProperty(col)) {
          filteredRow[col] = row[col];
        }
      }
      return filteredRow;
    });
  } else {
    filteredProjection = projection;
  }

  res.json(filteredProjection);
});

export default router;
