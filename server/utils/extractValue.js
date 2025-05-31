export function extractValue(row, field) {
  if (field === "_id") return row._id;
  const valueParts = row.value.split("#");

  if (!isNaN(Number(field))) {
    return valueParts[Number(field)];
  }

  return row[field] ?? row.value;
}
