import { useState, useEffect } from "react";

function CollectionName() {
    const [inputValue, setInputValue] = useState("");
    const [activeDatabase, setActiveDatabase] = useState(null);
    
    useEffect(() => {
        const updateActiveDatabase = () => {
            const newDb = localStorage.getItem("activeDatabase");
            setActiveDatabase(newDb);
        };
    
        // Load on mount
        updateActiveDatabase();
    
        // Listen for localStorage changes
        window.addEventListener("storage", updateActiveDatabase);
    
        return () => {
            window.removeEventListener("storage", updateActiveDatabase);
        };
    }, []);

    const handleChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleSubmit = async () => {
        if (!inputValue.trim()) {
            alert("Please enter a table name.");
            return;
        }

        if (!activeDatabase) {
            alert("No active database selected.");
            return;
        }

        // Create JSON object
        const jsonData = { name: activeDatabase, table: inputValue };
        try {
            // Send JSON using fetch()
            const response = await fetch("http://localhost:5000/database/table", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(jsonData),
            });

            alert("Table added successfully!");
            setInputValue(""); // Clear input field
        } catch (error) {
            console.error("Error sending data:", error);
            alert("Failed to send JSON data.");
        }
    };

    return (
        <div className="database-div">
            <label>Add a table:</label>
            <br/>
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
            <p>Current Active Database: <strong>{activeDatabase}</strong></p>
        </div>
    );
}

export default CollectionName;
