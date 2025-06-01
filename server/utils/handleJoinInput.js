export function handleJoinInput(elem) {
  console.log("got input");

  const cleaned = elem.query
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/;+/g, ";");

  const groupByMatch = /group\s+by\s+(.+?)(?:\s+order\s+by|\s+limit|;|$)/i.exec(
    cleaned
  );

  const groupByIndex = cleaned.toLowerCase().indexOf("group by");
  const whereIndex = cleaned.toLowerCase().indexOf("where");

  if (groupByIndex !== -1 && whereIndex !== -1 && groupByIndex < whereIndex) {
    return {
      isJoin: false,
      success: false,
      groupBy: false,
      message: "GROUP BY must appear after WHERE clause",
      errorAt: "group by",
    };
  }

  const joinMatch = [
    ...cleaned.matchAll(
      /join\s+([a-zA-Z_][\w]*)\s+([a-zA-Z_][\w]*)\s+on\s+([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)\s*=\s*([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)/gi
    ),
  ];
  console.log("joinMatch", joinMatch);
  if (!joinMatch || joinMatch.length === 0) {
    return {
      isJoin: false,
      groupBy: groupByMatch
        ? groupByMatch[1].split(",").map((s) => s.trim())
        : [],
      success: false,
      message: "Missing or invalid JOIN clause",
      errorAt: "join",
    };
  }

  const useMatch = /use\s+([a-zA-Z_][\w]*)/i.exec(cleaned);
  if (!useMatch) {
    return {
      isJoin: true,
      success: false,
      message: "Missing or invalid USE statement",
      errorAt: "use",
    };
  }

  const selectMatch = /select\s+(.+?)\s*;/i.exec(cleaned);
  if (!selectMatch) {
    return {
      isJoin: true,
      success: false,
      message: "Missing or invalid SELECT clause",
      errorAt: "select",
    };
  }

  const fromMatch = /from\s+([a-zA-Z_][\w]*)\s+([a-zA-Z_][\w]*)/i.exec(cleaned);
  if (!fromMatch) {
    return {
      isJoin: true,
      success: false,
      message: "Missing or invalid FROM clause",
      errorAt: "from",
    };
  }

  const joins = joinMatch.map((match) => ({
    table: match[1],
    alias: match[2],
    on: {
      left: match[3],
      right: match[4],
    },
  }));

  const whereMatch = /where\s+(.+)/i.exec(cleaned);
  let where = [];

  if (whereMatch) {
    const expr = whereMatch[1].trim();
    const tokens = expr.split(/\s+(AND|OR)\s+/i);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.toUpperCase() === "AND" || token.toUpperCase() === "OR") {
        where.push(token.toUpperCase());
        continue;
      }

      const conditionMatch =
        /([a-zA-Z_][\w]*(?:\.[a-zA-Z_][\w]*)?)\s*(=|>|<|>=|<=|!=)\s*('[^']*'|"[^"]*"|[^\s;]+)/.exec(
          token.trim()
        );
      if (!conditionMatch) {
        return {
          isJoin: true,
          success: false,
          message: `Invalid WHERE condition: "${token.trim()}"`,
          errorAt: "where",
        };
      }

      where.push({
        column: conditionMatch[1],
        operator: conditionMatch[2],
        value: conditionMatch[3].replace(/^['"]|['"]$/g, ""),
      });
    }
  }

  const parts = {
    isJoin: true,
    success: true,
    use: useMatch[1],
    select: selectMatch[1].split(",").map((s) => s.trim()),
    from: {
      table: fromMatch[1],
      alias: fromMatch[2],
    },
    joins,
    where,
    groupBy: groupByMatch
      ? groupByMatch[1].split(",").map((s) => s.trim())
      : [],
  };

  return parts;
}
