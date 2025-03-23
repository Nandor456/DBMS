import { useState, useEffect } from "react";

function CollectionName() {
    const [tableName, setTableName] = useState("");
    const [activeDatabase, setActiveDatabase] = useState(null);
    const [fields, setFields] = useState([
        { name: "", type: "string" }
    ]);
    
    const [tableObject, setTableObject] = useState({
        metadata: { PK: "", FK: "" },
        constraints: {},
        inserted: {}
    });
    
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

    const handleColumnChange = (index, section, field, value) => {
        const updatedColumns = [...columns];
        updatedColumns[index] = {
            ...updatedColumns[index],
            [section]: {
                ...updatedColumns[index][section],
                [field]: value
            }
        };
        setColumns(updatedColumns);
    };
    
    const handleFieldChange = (index, key, value) => {
        const updated = [...fields];
        updated[index][key] = value;
        setFields(updated);
    };
    
    const handleAddField = () => {
        setFields([...fields, { name: "", type: "string" }]);
    };
    
    const handleRemoveField = (index) => {
        const updated = fields.filter((_, i) => i !== index);
        setFields(updated);
    };
    
    const handleAddColumn = () => {
        setColumns([...columns, { 
                                    metadata: {PK: "", FK: ""},
                                    constraints: {},
                                    column: {name: "", type: "string" },
                                    inserted: {}
                                }
                    ]);
    };

    const handleRemoveColumn = (index) => {
        const updatedColumns = columns.filter((_, i) => i !== index);
        setColumns(updatedColumns);
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
    
        const filteredFields = fields.filter(f => f.name.trim());
    
        const jsonData = {
            database: activeDatabase,
            table: tableName,
            columns: [
                {
                    metadata: tableObject.metadata,
                    constraints: tableObject.constraints,
                    column: filteredFields,
                    inserted: tableObject.inserted
                }
            ]
        };
    
        try {
            await fetch("http://localhost:4000/database/table", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jsonData),
            });
    
            alert("Table added successfully!");
            setTableName("");
            setFields([{ name: "", type: "string" }]);
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
            {fields.map((field, index) => (
                                            <div key={index} style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Column name"
                                                    value={field.name}
                                                    onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                                                />
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                                                >
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                    <option value="date">Date</option>
                                                </select>
                                                <button onClick={() => handleRemoveField(index)}>-</button>
                                            </div>
                                        ))}


            
            <button onClick={handleAddColumn}>+ Add Column</button>
            <br /><br />
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default CollectionName;
