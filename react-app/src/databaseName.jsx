import { useState, useEffect } from "react";

function DatabaseName() {
    const [inputValue, setInputValue] = useState("");
    const [items, setItems] = useState([]);
    const [activeDatabase, setActiveDatabase] = useState(null);

    const handleChange = (event) => {
        setInputValue(event.target.value);
    };

    useEffect(() => {
        const storedDb = localStorage.getItem("activeDatabase");
        if (storedDb) {
            setActiveDatabase(storedDb);
        }

        fetch("http://localhost:4000/database/old")
            .then(res => {
                if (!res.ok) {
                    throw new Error("Hiba old_db");
                }
                return res.json();
            })
            .then(data => {
                console.log("Sikeres old_db:", data);
                setItems(data);
            })
            .catch(error => {
                console.error("Hiba: ", error);
        });

    }, []);

    const handleSubmit = async () => {
        if (!inputValue.trim()) {
            alert("Please enter a database name.");
            return;
        }

        const newDatabase = inputValue.trim();
        const jsonData = { name: newDatabase };

        try {
            const response = await fetch("http://localhost:4000/database", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(jsonData),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            } else {
                setItems([...items, newDatabase]); // Add to list
                setInputValue(""); // Clear input
            }
        } catch (error) {
            console.error("Error sending data:", error);
            alert("Failed to send JSON data.");
        }
    };

    // Set the active database
    const handleSetActive = (dbName) => {
        setActiveDatabase(dbName);
        localStorage.setItem("activeDatabase", dbName);
        window.dispatchEvent(new Event("storage"));
    };

    // Delete a database from the list
    const handleDelete = async (dbName) => {
        const updatedItems = items.filter((item) => item !== dbName);
        setItems(updatedItems);

        if (activeDatabase === dbName) {
            setActiveDatabase(null); // Remove active status if deleted
            localStorage.removeItem("activeDatabase");
        }

        try {
            const response = await fetch("http://localhost:4000/database/delete", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: dbName }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error("Error deleting data:", error);
            alert("Failed to delete JSON data.");
        }
    };

    return (
        <div className="database-container">
            <div className="database-input">
                <label htmlFor="fname">Name your database:</label>
                <br />
                <input 
                    type="text" 
                    id="fname" 
                    name="fname" 
                    placeholder="Type here..." 
                    value={inputValue} 
                    onChange={handleChange} 
                />
                <br />
                <button type="button" onClick={handleSubmit}>Submit</button>
            </div>

            <div className="database-list">
                <h3>Databases:</h3>
                <ul>
                    {items.map((db) => (
                        <li key={db} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <label>{db}</label>
                            <button onClick={() => handleSetActive(db)} style={{ backgroundColor: activeDatabase === db ? "green" : "lightgray" }}>
                                {activeDatabase === db ? "Active" : "Set Active"}
                            </button>
                            <button onClick={() => handleDelete(db)} style={{ backgroundColor: "red", color: "white" }}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default DatabaseName;
