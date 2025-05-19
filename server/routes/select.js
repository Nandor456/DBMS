import express from "express";
import { getConditions } from "../select/getConditions.js";
import { whereSelection } from "../select/whereSelection.js";

const router = express.Router();
console.log("SelectRouter loaded");

router.post("/database/row/select", async (req, res) => {
  const whereData = getConditions(req.body);
  if (!whereData.success) {
    res.send(whereData.message);
  }
  console.log("conditions:", whereData);

  const selection = await whereSelection(whereData);
  if (!selection.success) {
    res.send(selection.message);
  }
  console.log(selection.result);

  res.send("siker");
});

export default router;
