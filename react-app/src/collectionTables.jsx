import { useEffect, useState } from "react";
import { fetchTables } from "./utils/OldTableFunction";

function TableList({ updateTrigger }) {
  const [tablesByDb, setTablesByDb] = useState([]);
  const [activeDatabase, setActiveDatabase] = useState(null);

  useEffect(() => {
    fetchTables()
      .then((data) => setTablesByDb(data))
      .catch((err) => {
        // Itt opcionálisan hibát jelezhetsz
        console.error("Nem sikerült betölteni a táblákat:", err);
      });

    const updateActiveDatabase = () => {
      const newDb = localStorage.getItem("activeDatabase");
      setActiveDatabase(newDb);
    };

    updateActiveDatabase();
    window.addEventListener("storage", updateActiveDatabase);

    return () => {
      window.removeEventListener("storage", updateActiveDatabase);
    };
  }, []);

  useEffect(() => {
    console.log("jelzett");
    fetchTables()
      .then((data) => setTablesByDb(data))
      .catch((err) => {
        // Itt opcionálisan hibát jelezhetsz
        console.error("Nem sikerült betölteni a táblákat:", err);
      }); // újratöltés, ha frissült a trigger
  }, [updateTrigger]);

  const handleDelete = async (tableName) => {
    try {
      const response = await fetch(
        "http://localhost:4000/database/table/delete",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ database: activeDatabase, table: tableName }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      setTablesByDb((prevTables) => ({
        ...prevTables,
        [activeDatabase]: prevTables[activeDatabase].filter(
          (item) => item !== tableName
        ),
      }));
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Failed to delete JSON data.");
    }
  };

  // Get the tables for the active database
  const tables = activeDatabase ? tablesByDb[activeDatabase] || [] : [];

  return (
    <div>
      <h2>Tables for {activeDatabase || "No active database selected"}:</h2>
      {tables.length > 0 ? (
        <ul>
          {tables.map((table, index) => (
            <li key={index}>
              <label>{table}</label>
              <button
                onClick={() => handleDelete(table)}
                style={{ backgroundColor: "red", color: "white" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontStyle: "italic" }}>No tables available</p>
      )}
    </div>
  );
}

export default TableList;
