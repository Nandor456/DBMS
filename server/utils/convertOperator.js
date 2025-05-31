export function convertOperatorToMongoOperator(operator) {
  switch (operator) {
    case ">":
      return "$gt";
    case "<":
      return "$lt";
    case ">=":
      return "$gte";
    case "<=":
      return "$lte";
    case "==":
    case "=":
      return "$eq";
    case "!=":
      return "$ne";
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

export function convertOperator(a, operator, b) {
  switch (operator) {
    case "=":
      return a == b;
    case "!=":
      return a != b;
    case ">":
      return a > b;
    case "<":
      return a < b;
    case ">=":
      return a >= b;
    case "<=":
      return a <= b;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}
