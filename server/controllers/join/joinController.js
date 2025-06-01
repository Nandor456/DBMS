import { whereSelection } from "../../select/whereSelection.js";
import { handleJoinInput } from "../../utils/handleJoinInput.js";
import {
  splitConditionsByTable,
  splitGroupByTable,
} from "../../utils/splitConditionsByTable.js";
import { simpleNestedLoopJoin } from "./indexedNestedLoop.js";
import { handleGroupBy } from "../../utils/handleGroupBy.js";

export async function joinController(handledJoinInput, req, res) {


  const splitTables = splitConditionsByTable(handledJoinInput.where);
  const splitGroupBy = splitGroupByTable(
    handledJoinInput.groupBy,
    handledJoinInput.success,
    handledJoinInput.from.table
  );
  console.log("splitFgroupby:", splitGroupBy);
  if (splitGroupBy === -1) {
    return res.status(400).json({
      success: false,
      message: "Invalid GROUP BY clause",
      errorAt: "groupBy",
    });
  }

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
    console.log("whereData:", whereData);
    joinRes.push({
      data: whereData.result,
      dbName: handledJoinInput.use,
      collName: aliasToTable[alias],
    });
  }
  const joinChain = handledJoinInput.joins.map((join) => join.on);
  const indexedNestedLoop = await simpleNestedLoopJoin(joinRes, joinChain);
  console.log("nested:", indexedNestedLoop);
  console.log("splitGroupBy:", Object.keys(splitGroupBy).length);
  if (Object.keys(splitGroupBy).length !== 0) {
    const groupedData = handleGroupBy(
      indexedNestedLoop,
      splitGroupBy,
      aliasToTable,
      handledJoinInput.success,
      handledJoinInput.select
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
    res.json(indexedNestedLoop);
  }
}
