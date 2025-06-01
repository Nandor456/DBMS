import express from "express";
import { getConditions } from "../select/getConditions.js";
import { whereSelection } from "../select/whereSelection.js";
import { getProjection } from "../select/getProjection.js";
import { getColumnsToProject } from "../select/getColumnsToProject.js";
import { handleJoinInput } from "../utils/handleJoinInput.js";
import { joinController } from "../controllers/join/joinController.js";

const router = express.Router();
console.log("SelectRouter loaded");

router.post("/database/row/select", async (req, res) => {
  const handledJoinInput = handleJoinInput(req.body);
  //console.log("handledJoinInput:", handledJoinInput);
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
  const whereData = getConditions(req.body);
  console.log("whereData:", whereData);
  if (!whereData.success) {
    res.send(whereData.message);
  }
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
