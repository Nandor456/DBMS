export function getColumnsToProject(elem) {
  const { query } = elem;
  const lines = query.split("\n");
  const line = lines.find((line) =>
    line.trim().toLowerCase().startsWith("select")
  );
  const columnsPart = line
    .trim()
    .slice(6) // remove "select"
    .replace(";", "")
    .trim();
  const columns = columnsPart
    .split(",")
    .map((col) => col.trim())
    .filter((col) => col.length > 0);

  return columns;
}
