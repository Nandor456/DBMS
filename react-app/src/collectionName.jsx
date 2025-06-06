import { useState, useEffect } from "react";
//import { fetchTables } from "./utils/OldTableFunction";

function CollectionName({ onTableCreated }) {
  const [tableName, setTableName] = useState("");
  const [activeDatabase, setActiveDatabase] = useState(null);
  const [referencedTables, setReferencedTables] = useState({});
  const [availableTables, setAvailableTables] = useState([]);
  //const [tablesByDb, setTablesByDb] = useState([]);
  const [columns, setColumns] = useState({
    metadata: { PK: [], FK: [], indexedColumns: [] },
    constraints: {},
    column: [{ name: "", type: "" }],
  });

  useEffect(() => {
    fetch("http://localhost:4000/database/old/table")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Hiba oldtable_db");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Sikeres oldtable_db:", data);
        setAvailableTables(data);
      })
      .catch((error) => {
        console.error("Hiba old_db_table: ", error);
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
    console.log("Frissült availableTables:", availableTables);

    Object.entries(availableTables).forEach(([db, tables]) => {
      console.log(`DB: ${db}`);
      tables.forEach((table) => {
        console.log(" - Table:", table);
      });
    });
  }, [availableTables]);

  const handleTableNameChange = (event) => {
    setTableName(event.target.value);
  };

  const handleColumnChange = (index, field, value) => {
    setColumns((prev) => {
      const updatedColumnArray = [...prev.column];
      updatedColumnArray[index] = {
        ...updatedColumnArray[index],
        [field]: value,
      };

      return {
        ...prev,
        column: updatedColumnArray,
      };
    });
  };

  const handleColumnChangeMetadataPK = (columnName, value) => {
    setColumns((prev) => {
      let updatedPKs = [...prev.metadata.PK];

      if (value === "PK") {
        if (!updatedPKs.includes(columnName)) {
          updatedPKs.push(columnName);
        }
      } else {
        updatedPKs = updatedPKs.filter((name) => name !== columnName);
      }

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          PK: updatedPKs,
        },
      };
    });
  };

  const handleColumnChangeMetadataFK = (
    columnName,
    tableName,
    value,
    columnRefName = ""
  ) => {
    setColumns((prev) => {
      let updatedFKs = [...prev.metadata.FK];

      if (value === "FK") {
        const exists = updatedFKs.some((fk) => fk.FKName === columnName);

        if (!exists) {
          updatedFKs.push({
            FKName: columnName,
            FKTableName: tableName,
            FKColumnName: columnRefName,
          });
        } else {
          updatedFKs = updatedFKs.map((fk) =>
            fk.FKName === columnName
              ? { ...fk, FKTableName: tableName, FKColumnName: columnRefName }
              : fk
          );
        }
      } else {
        updatedFKs = updatedFKs.filter((fk) => fk.FKName !== columnName);
      }

      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          FK: updatedFKs,
        },
      };
    });
  };

  const handleColumnChangeConstraints = (columnName, value) => {
    setColumns((prev) => {
      let updatedConstraints = { ...prev.constraints };

      if (value === "Unique") {
        if (!updatedConstraints.uniques) {
          updatedConstraints.uniques = [];
        }
        if (!updatedConstraints.uniques.includes(columnName)) {
          updatedConstraints.uniques.push(columnName);
        }
      } else {
        if (updatedConstraints.uniques) {
          updatedConstraints.uniques = updatedConstraints.uniques.filter(
            (col) => col !== columnName
          );
        }
      }

      return {
        ...prev,
        constraints: updatedConstraints,
      };
    });
  };

  const handleAddColumn = () => {
    setColumns((prev) => {
      return {
        ...prev,
        column: [...prev.column, { name: "", type: "choose" }],
      };
    });
  };

  const handleRemoveColumn = (index) => {
    setColumns((prev) => {
      const newColumnArray = prev.column.filter((_, i) => i !== index);
      return {
        ...prev,
        column: newColumnArray,
      };
    });
  };

  const handleSubmit = async () => {
    if (!tableName.trim()) {
      alert("Please enter a table name.");
      return;
    }

    if (!activeDatabase) {
      alert("No active database selected.");
      return;
    }

    const jsonData = {
      database: activeDatabase,
      table: tableName,
      columns: {
        ...columns,
        column: columns.column.filter((col) => col.name.trim()), // csak érvényes oszlopokat küldünk
      },
    };

    try {
      const response = await fetch("http://localhost:4000/database/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      alert("Table added successfully!");
      console.log(tableName);

      if (typeof onTableCreated === "function") {
        console.log("jelez");
        onTableCreated(); // ← jelezzük, hogy új tábla lett
      }

      //setAvailableTables(tableName);
      setAvailableTables((prev) => {
        const updated = { ...prev };

        if (!updated[activeDatabase]) {
          updated[activeDatabase] = []; // ha még nincs, létrehozzuk
        }

        if (!updated[activeDatabase].includes(tableName)) {
          updated[activeDatabase].push(tableName); // csak akkor toljuk be, ha nincs benne
        }

        return updated;
      });

      //localStorage.setItem("newTable", tableName);
      setTableName("");
      window.dispatchEvent(new Event("newTable"));
      setColumns({
        metadata: { PK: [], FK: [], indexedColumns: [] },
        constraints: {},
        column: [{ name: "", type: "" }],
        inserted: {},
      });
    } catch (error) {
      console.error("Error sending data:", error);
      alert(`Failed to send JSON data: ${error.message}`);
    }
  };

  return (
    <div className="database-div">
      <h3>Add a Table:</h3>
      <label>Table Name:</label>
      <br></br>
      <input
        type="text"
        placeholder="Enter table name..."
        value={tableName}
        onChange={handleTableNameChange}
      />

      <h4>Columns:</h4>
      {columns.column.map((col, index) => (
        <div
          key={index}
          style={{ display: "flex", gap: "10px", marginBottom: "5px" }}
        >
          <input
            type="text"
            placeholder="Enter column name..."
            value={col.name}
            onChange={(e) => handleColumnChange(index, "name", e.target.value)}
          />
          <select
            value={col.type}
            onChange={(e) => handleColumnChange(index, "type", e.target.value)}
          >
            <option value="choose">choose</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="date">Date</option>
          </select>
          <select
            value={columns.metadata.PK.includes(col.name) ? "PK" : "Not"}
            onChange={(e) =>
              handleColumnChangeMetadataPK(col.name, e.target.value)
            }
          >
            <option value="Not">Not</option>
            <option value="PK">PK</option>
          </select>
          <select
            value={
              columns.metadata.FK.some((fk) => fk.FKName === col.name)
                ? "FK"
                : "Not"
            }
            onChange={(e) => {
              const newValue = e.target.value;

              if (newValue === "Not") {
                handleColumnChangeMetadataFK(col.name, "", "Not");

                setReferencedTables((prev) => {
                  const updated = { ...prev };
                  delete updated[col.name];
                  return updated;
                });
              } else if (newValue === "FK") {
                setReferencedTables((prev) => ({
                  ...prev,
                  [col.name]: "",
                }));

                handleColumnChangeMetadataFK(col.name, "", "FK");
              }
            }}
          >
            <option value="Not">Not</option>
            <option value="FK">FK</option>
          </select>

          {columns.metadata.FK.some((fk) => fk.FKName === col.name) && (
            <div>
              <input
                type="text"
                placeholder="Referenced table name"
                value={referencedTables[col.name]?.table || ""}
                onChange={(e) => {
                  const newTable = e.target.value;

                  // Frissítjük az input állapotát
                  setReferencedTables((prev) => ({
                    ...prev,
                    [col.name]: {
                      table: newTable,
                      column: prev[col.name]?.column || "",
                    },
                  }));

                  // Ellenőrizzük, hogy az adott oszlop valóban FK-ra van állítva
                  const isFK = columns.metadata.FK.some(
                    (fk) => fk.FKName === col.name
                  );

                  // Ha még nincs bent az FK listában, hozzáadjuk
                  if (!isFK) {
                    handleColumnChangeMetadataFK(col.name, newTable, "FK");
                  } else {
                    // Ha már bent van, csak frissítjük a táblát
                    handleColumnChangeMetadataFK(col.name, newTable, "FK");
                  }
                }}
              />
              <input
                type="text"
                placeholder="Referenced column name"
                value={referencedTables[col.name]?.column || ""}
                onChange={(e) => {
                  const newColumn = e.target.value;

                  setReferencedTables((prev) => ({
                    ...prev,
                    [col.name]: {
                      table: prev[col.name]?.table || "",
                      column: newColumn,
                    },
                  }));

                  handleColumnChangeMetadataFK(
                    col.name,
                    referencedTables[col.name]?.table || "",
                    "FK",
                    newColumn
                  );
                }}
              />
            </div>
          )}
          <select
            value={
              columns.constraints.uniques?.includes(col.name) ? "Unique" : "Not"
            }
            onChange={(e) =>
              handleColumnChangeConstraints(col.name, e.target.value)
            }
          >
            <option value="Not">Not</option>
            <option value="Unique">Unique</option>
          </select>
          <button onClick={() => handleRemoveColumn(index)}>-</button>
        </div>
      ))}

      <button onClick={handleAddColumn}>+ Add Column</button>
      <br />
      <br />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default CollectionName;
