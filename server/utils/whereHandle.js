export function buildFilterFunction(flatConditions, schema) {
  return (valueString) => {
    const values = valueString.split("#");
    const row = {};
    schema.forEach((key, i) => {
      row[key] = values[i];
    });

    let resultStack = [];

    for (const item of flatConditions) {
      if (item === "AND") {
        const b = resultStack.pop();
        const a = resultStack.pop();
        resultStack.push(a && b);
      } else if (item === "OR") {
        const b = resultStack.pop();
        const a = resultStack.pop();
        resultStack.push(a || b);
      } else {
        const { column, operator, value } = item;
        const fieldValue = row[column];
        let condResult = false;

        // Alap műveletek – szükség esetén bővíthető típusként
        switch (operator) {
          case "=":
            condResult = fieldValue === value;
            break;
          case "<":
            condResult = fieldValue < value;
            break;
          case ">":
            condResult = fieldValue > value;
            break;
          case "<=":
            condResult = fieldValue <= value;
            break;
          case ">=":
            condResult = fieldValue >= value;
            break;
        }

        resultStack.push(condResult);
      }
    }

    return resultStack[0];
  };
}

