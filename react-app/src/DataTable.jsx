import React, { useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";

export default function DataTable({ rows }) {
  const columns = useMemo(() => {
    if (rows.length === 0) return [];

    return Object.keys(rows[0]).map((key) => ({
      field: key,
      headerName: key,
      width: 150,
    }));
  }, [rows]);

  return (
    <Paper sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows.map((r, i) => ({
          id: r.pk ?? i, // ha van pk, az legyen az id
          ...r,
        }))}
        columns={columns}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
