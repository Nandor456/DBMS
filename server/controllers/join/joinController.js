import { whereSelection } from "../../select/whereSelection.js";
import { handleJoinInput } from "../../utils/handleJoinInput.js";
import { splitConditionsByTable } from "../../utils/splitConditionsByTable.js";
import { simpleNestedLoopJoin } from "../../utils/indexedNestedLoop.js";
export async function joinController(req, res) {
  const handledJoinInput = handleJoinInput(req.body);
  console.log(handledJoinInput);
  const splitTables = splitConditionsByTable(handledJoinInput.where);
  console.log(splitTables);
  const aliasToTable = {
    [handledJoinInput.from.alias]: handledJoinInput.from.table,
  };
  for (const joinObj of handledJoinInput.joins) {
    aliasToTable[joinObj.alias] = joinObj.table;
  }

  const joinRes = []; // List of row arrays
  for (const cond in splitTables) {
    console.log(cond);
    const whereInput = {
      dbName: handledJoinInput.use,
      collName: aliasToTable[cond],
      conditions: splitTables[cond],
    };

    const whereData = await whereSelection(whereInput);
    if (!whereData.success) {
      res.status(401).send("Error when using where");
    }
    joinRes.push(whereData.result);
  }
  console.log(joinRes);
  const joinChain = handledJoinInput.joins.map((join) => join.on);
  const indexedNestedLoop = simpleNestedLoopJoin(joinRes, joinChain);
  console.log(indexedNestedLoop);
}
