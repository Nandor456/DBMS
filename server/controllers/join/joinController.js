import { whereSelection } from "../../select/whereSelection.js";
import { handleJoinInput } from "../../utils/handleJoinInput.js";
import { splitConditionsByTable } from "../../utils/splitConditionsByTable.js";
import { simpleNestedLoopJoin } from "./indexedNestedLoop.js";
export async function joinController(req, res) {
  const handledJoinInput = handleJoinInput(req.body);
  const splitTables = splitConditionsByTable(handledJoinInput.where);
  const aliasToTable = {
    [handledJoinInput.from.alias]: handledJoinInput.from.table,
  };
  for (const joinObj of handledJoinInput.joins) {
    aliasToTable[joinObj.alias] = joinObj.table;
  }
  console.log("handleJoinInput", handledJoinInput);
  console.log("splitTables", splitTables);
  const aliasOrder = [
    handledJoinInput.from.alias,
    ...handledJoinInput.joins.map((j) => j.alias),
  ];
  console.log("alias", aliasOrder);

  const joinRes = [];
  for (const alias of aliasOrder) {
    const conditions = splitTables[alias] || [];
    const whereInput = {
      dbName: handledJoinInput.use,
      collName: aliasToTable[alias],
      conditions,
    };

    const whereData = await whereSelection(whereInput);
    if (!whereData.success) {
      res.status(401).send("Error when using where");
    }
    joinRes.push({
      data: whereData.result,
      dbName: handledJoinInput.use,
      collName: aliasToTable[alias],
    });
  }
  const joinChain = handledJoinInput.joins.map((join) => join.on);
  const indexedNestedLoop = await simpleNestedLoopJoin(joinRes, joinChain);
  console.log("nested:", indexedNestedLoop);
  res.json(indexedNestedLoop);
}
