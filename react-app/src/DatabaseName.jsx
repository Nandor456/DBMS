import { useState, useEffect } from "react";
//import { fetchDatabases } from "./utils/OldDatabaseFunction";

function DatabaseName({ onDBCreated }) {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState([]);
  const [activeDatabase, setActiveDatabase] = useState(null);
  const [searchDatabase, setSearchDatabase] = useState("");
  const handleChange = (event) => {
    setInputValue(event.target.value);
  };
  const HandleSearchDatabase = (event) => {
    setSearchDatabase(event.target.value);
  };
  useEffect(() => {
    const storedDb = localStorage.getItem("activeDatabase");
    if (storedDb) {
      setActiveDatabase(storedDb);
    }
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
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message);
      } else {
        setInputValue("");
      }
    } catch (error) {
      console.error("Error sending data:", error);
      alert(error);
    }

    if (typeof onDBCreated === "function") {
      console.log("jelez DB");
      onDBCreated();
    } else {
      console.log("typeof hiba onDBCreate");
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

  const validateDatabase = async (dbName) => {
    try {
      const response = await fetch("http://localhost:4000/database/isvalid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dbName }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message);
      } else {
        setItems([dbName]); // Add to list
        setSearchDatabase("");
      }
    } catch (error) {
      alert(error);
    }
  };
  return (
    <div className="database-container">
      <div className="database-input">
        <label htmlFor="fname">Name your database:</label>
        <br />
        <input
          type="text"
          placeholder="Type here..."
          value={inputValue}
          onChange={handleChange}
        />
        <br />
        <button type="button" onClick={handleSubmit}>
          Submit
        </button>
      </div>

      <div className="database-list">
        <h3>Databases:</h3>
        <input
          type="text"
          placeholder="Search database..."
          value={searchDatabase}
          onChange={HandleSearchDatabase}
        />
        <button type="button" onClick={() => validateDatabase(searchDatabase)}>
          Search
        </button>
        <ul>
          {items.map((db) => (
            <li key={db}>
              <label>{db}</label>
              <button
                onClick={() => handleSetActive(db)}
                style={{
                  backgroundColor:
                    activeDatabase === db ? "green" : "lightgray",
                }}
              >
                {activeDatabase === db ? "Active" : "Set Active"}
              </button>
              <button
                onClick={() => handleDelete(db)}
                style={{ backgroundColor: "red", color: "white" }}
              >
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
