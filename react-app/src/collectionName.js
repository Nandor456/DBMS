import { useState, useEffect } from "react";

function CollectionName() {
    const [tableName, setTableName] = useState("");
    const [activeDatabase, setActiveDatabase] = useState(null);
    const [referencedTables, setReferencedTables] = useState({});
    const [availableTables, setAvailableTables] = useState([]);
    const [columns, setColumns] = useState(
                                            { 
                                                metadata: {PK: [], FK: []},
                                                constraints: {},
                                                column: [{name: "", type: "" }],
                                                inserted: {}
                                            }
                                            );

    useEffect(() => {
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

    const handleTableNameChange = (event) => {
        setTableName(event.target.value);
    };

    const handleColumnChange = (index, field, value) => {
        setColumns(prev => {
            const updatedColumnArray = [...prev.column];
            updatedColumnArray[index] = { ...updatedColumnArray[index], [field]: value };
    
            return {
                ...prev,
                column: updatedColumnArray
            };
        });
    };

    const handleColumnChangeMetadataPK = (columnName, value) => {
        setColumns(prev => {
            let updatedPKs = [...prev.metadata.PK];
    
            if (value === "PK") {
                if (!updatedPKs.includes(columnName)) {
                    updatedPKs.push(columnName);
                }
            } else {
                updatedPKs = updatedPKs.filter(name => name !== columnName);
            }
    
            return {
                ...prev,
                metadata: {
                    ...prev.metadata,
                    PK: updatedPKs
                }
            };
        });
    };

    const handleColumnChangeMetadataFK = (columnName, tableName, value) => {
        setColumns(prev => {
            let updatedFKs = [...prev.metadata.FK];
    
            if (value === "FK") {
                const exists = updatedFKs.some(fk => fk.FKName === columnName);
    
                if (!exists) {
                    updatedFKs.push({
                        FKName: columnName,
                        FKTableName: tableName
                    });
                }
            } else {
                updatedFKs = updatedFKs.filter(fk => fk.FKName !== columnName);
            }
    
            return {
                ...prev,
                metadata: {
                    ...prev.metadata,
                    FK: updatedFKs
                }
            };
        });
    };
    
    

    const handleAddColumn = () => {
        setColumns(prev => {
          return {
            ...prev,
            column: [
              ...prev.column,
              { name: "", type: "string" }
            ]
          };
        });
      };

    const handleRemoveColumn = (index) => {
        setColumns(prev => {
            const newColumnArray = prev.column.filter((_, i) => i !== index);
            return {
                ...prev,
                column: newColumnArray
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
                column: columns.column.filter(col => col.name.trim()) // csak érvényes oszlopokat küldünk
            }
        };
        
        

        try {
            await fetch("http://localhost:4000/database/table", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jsonData),
            });

            alert("Table added successfully!");
            setTableName("");
            setColumns(
                            { 
                                metadata: {PK: [], FK: []},
                                constraints: {},
                                column: [{name: "", type: "" }],
                                inserted: {}
                            }
                        ); // Reset inputs
        } catch (error) {
            console.error("Error sending data:", error);
            alert("Failed to send JSON data.");
        }
    };

    return (
        <div className="database-div">
            <h3>Add a Table</h3>
            <label>Table Name:</label>
            <input 
                type="text" 
                placeholder="Enter table name..." 
                value={tableName} 
                onChange={handleTableNameChange} 
            />
            
            <h4>Columns:</h4>
            {columns.column.map((col, index) => (
                <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                    <input
                        type="text"
                        placeholder="Column name"
                        value={col.name}
                        onChange={(e) => handleColumnChange(index, "name", e.target.value)}
                    />
                    <select
                        value={col.type}
                        onChange={(e) => handleColumnChange(index, "type", e.target.value)}
                    >
                        <option value="blank"></option>
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                    </select>
                    <select
                        value={columns.metadata.PK.includes(col.name) ? "PK" : "Not"}
                        onChange={(e) => handleColumnChangeMetadataPK(col.name, e.target.value)}
                    >
                        <option value="Not">Not</option>
                        <option value="PK">PK</option>
                    </select>
                    <select
                        value={
                            columns.metadata.FK.some(fk => fk.FKName === col.name)
                            ? "FK"
                            : "Not"
                        }
                        onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue === "Not") {
                            // Töröljük az FK-t azonnal
                            handleColumnChangeMetadataFK(col.name, "", "Not");
                        
                            // és töröljük a referencetable-t is (ha használod a külön state-et)
                            setReferencedTables(prev => {
                                const updated = { ...prev };
                                delete updated[col.name];
                                return updated;
                            });
                            }
                            // Ha "FK", akkor még nem csinálunk semmit — megvárjuk, míg beírja a tábla nevét
                        }}
                        
                    >
                        <option value="Not">Not</option>
                        <option value="FK">FK</option>
                    </select>

    {/* FK target table input – csak ha FK kiválasztva */}
    {columns.metadata.FK.some(fk => fk.FKName === col.name) && (
      <input
      type="text"
      placeholder="Referenced table name"
      value={referencedTables[col.name] || ""}
      onChange={(e) => {
        const newTable = e.target.value;
    
        // Frissítjük az input állapotát
        setReferencedTables(prev => ({
          ...prev,
          [col.name]: newTable
        }));
    
        // Ellenőrizzük, hogy az adott oszlop valóban FK-ra van állítva
        const isFK = columns.metadata.FK.some(fk => fk.FKName === col.name);
    
        // Ha még nincs bent az FK listában, hozzáadjuk
        if (!isFK) {
          handleColumnChangeMetadataFK(col.name, newTable, "FK");
        } else {
          // Ha már bent van, csak frissítjük a táblát
          handleColumnChangeMetadataFK(col.name, newTable, "FK");
        }
      }}
    />
    
    )}
                    <button onClick={() => handleRemoveColumn(index)}>-</button>
                </div>
            ))}
            
            <button onClick={handleAddColumn}>+ Add Column</button>
            <br /><br />
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default CollectionName;
