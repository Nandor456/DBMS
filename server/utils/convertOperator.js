export function convertOperator(operator) {
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
