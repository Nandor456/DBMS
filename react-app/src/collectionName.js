import { useState, useEffect } from "react";

function CollectionName() {
    const [tableName, setTableName] = useState("");
    const [activeDatabase, setActiveDatabase] = useState(null);
    const [columns, setColumns] = useState(
                                            { 
                                                metadata: {PK: "", FK: ""},
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
                                metadata: {PK: "", FK: ""},
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
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                    </select>
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
