import express from "express";
import { getConditions } from "../select/getConditions.js";
import { whereSelection } from "../select/whereSelection.js";
import { getProjection } from "../select/getProjection.js";
import { getColumnsToProject } from "../select/getColumnsToProject.js";
import { handleJoinInput } from "../utils/handleJoinInput.js";
import { joinController } from "../controllers/join/joinController.js";
import {handleGroupByWithoutJoin} from "../utils/handleGroupByWithoutJoin.js";

const router = express.Router();
console.log("SelectRouter loaded");

router.post("/database/row/select", async (req, res) => {
  const { query } = req.body;
  const handledJoinInput = handleJoinInput(req.body);
  console.log("handledJoinInput:", handledJoinInput);
  if (handledJoinInput?.groupBy === false) {
    //console.log("handledJoinInput.groupBy:", handledJoinInput.groupBy);
    return res.status(400).json({
      success: false,
      message: "Invalid GROUP BY clause",
      errorAt: "groupBy",
    });
  }
  if (handledJoinInput?.isJoin) {
    if (!handledJoinInput.success) {
      return res.status(400).json({
        success: false,
        message: handledJoinInput.message,
        errorAt: handledJoinInput.errorAt,
      });
    }
    return await joinController(handledJoinInput, req, res);
  }
  let groupBy = true;
  if (handledJoinInput.groupBy.length === 0){
    groupBy = false;
  }
  const whereData = getConditions(req.body, groupBy);
  console.log("whereData:", whereData);
  if (!whereData.success) {
    res.send(whereData.message);
  }
  console.log("whereData", whereData);
  const selection = await whereSelection(whereData);
  if (!selection.success) {
    res.send(selection.message);
  }
  console.log("selection:", selection);

  const projection = getProjection(
    selection.result,
    whereData.dbName,
    whereData.collName
  );
  console.log("projection:", projection);

  console.log(query);
  const lines = query.split("\n");
  const line = lines.find((line) =>
    line.trim().toLowerCase().startsWith("select")
  );
  const columnsPart = line
    .trim()
    .slice(6) // remove "select"
    .replace(";", "")
    .trim();
  const select = columnsPart.split(",").map((s) => s.trim());

  console.log("haaaaa: ", select);
  if (selection.success && handledJoinInput.groupBy.length !== 0) {
    const groupedData = handleGroupByWithoutJoin(
      projection,
      handledJoinInput.groupBy,
      select
    );
    if (groupedData === -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid GROUP BY clause",
        errorAt: "groupBy",
      });
    }
    res.json(groupedData);
  } else {
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
  }
});

export default router;
