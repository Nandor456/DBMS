import { whereSelection } from "../../select/whereSelection.js";
import { handleJoinInput } from "../../utils/handleJoinInput.js";
import {
  splitConditionsByTable,
  splitGroupByTable,
} from "../../utils/splitConditionsByTable.js";
import { simpleNestedLoopJoin } from "./indexedNestedLoop.js";
import { handleGroupBy } from "../../utils/handleGroupBy.js";
import { projectSelectedColumns } from "./projectSelectedColumns.js";

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
    if (handledJoinInput.orderBy && handledJoinInput.orderBy.length !== 0) {
      const orderKeys = handledJoinInput.orderBy;
      console.log("orderKeys:", orderKeys);
      groupedData.sort((a, b) => {
        for (const { column, direction } of orderKeys) {
          const aValue = column.split(".");
          const valA = a[aValue[0] + "." + aValue[1]];
          const valB = b[aValue[0] + "." + aValue[1]];
          const valANum = isNaN(valA) ? valA : Number(valA);
          const valBNum = isNaN(valB) ? valB : Number(valB);

          if (valANum < valBNum) return direction === "ASC" ? -1 : 1;
          if (valANum > valBNum) return direction === "ASC" ? 1 : -1;
        }
        return 0;
      });
    }
    res.json(groupedData);
  } else {
    const toProject = projectSelectedColumns(
      indexedNestedLoop,
      handledJoinInput
    );
    console.log("handledJoinInput:", handledJoinInput);
    if (handledJoinInput.orderBy && handledJoinInput.orderBy.length !== 0) {
      const orderKeys = handledJoinInput.orderBy;

      toProject.sort((a, b) => {
        for (const { column, direction } of orderKeys) {
          const aValue = column.split(".");
          const valA = a[aliasToTable[aValue[0]] + "." + aValue[1]];
          const valB = b[aliasToTable[aValue[0]] + "." + aValue[1]];
          const valANum = isNaN(valA) ? valA : Number(valA);
          const valBNum = isNaN(valB) ? valB : Number(valB);

          if (valANum < valBNum) return direction === "ASC" ? -1 : 1;
          if (valANum > valBNum) return direction === "ASC" ? 1 : -1;
        }
        return 0;
      });
    }
    res.json(toProject);
  }
}
