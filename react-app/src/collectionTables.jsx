import { useEffect, useState } from "react";

function TableList() {
  const [tablesByDb, setTablesByDb] = useState({});

  useEffect(() => {
    fetch("http://localhost:4000/database/old/table")
      .then((res) => res.json())
      .then((data) => {
        setTablesByDb(data);
      })
      .catch((err) => {
        console.error("Failed to load tables:", err);
      });
  }, []);

  return (
    <div>
      <h2>Tables per Database</h2>
      {Object.entries(tablesByDb).map(([dbName, tables]) => (
        <div key={dbName} style={{ marginBottom: "1rem" }}>
          <h3>{dbName}</h3>
          {tables.length > 0 ? (
            <ul>
              {tables.map((table, index) => (
                <li key={index}>{table}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontStyle: "italic" }}>No tables</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default TableList;
