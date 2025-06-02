import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Collapse,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import { fetchTables } from "./utils/OldTableFunction";
import { fetchDatabases } from "./utils/OldDatabaseFunction";

function NestedList({ updateTriggerDB }) {
  const [dbNames, setDbNames] = useState([]);
  const [openStates, setOpenStates] = useState({});
  const [tables, setTables] = useState({}); // Store tables as an object
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // fetch("http://localhost:4000/database/old")
    //     .then(res => res.ok ? res.json() : Promise.reject("Hiba old_db"))
    //     .then(data => {
    //         setDbNames(data);
    //         setOpenStates(data.reduce((acc, dbName) => ({ ...acc, [dbName]: false }), {}));
    //     })
    //     .catch(error => console.error("Hiba: ", error));

    fetchDatabases()
      .then((data) => {
        setDbNames(data);
        setOpenStates(
          data.reduce((acc, dbName) => ({ ...acc, [dbName]: false }), {})
        );
      })
      .catch((err) => {
        console.error("Nem sikerült betölteni a DB-ket:", err);
      });

    fetchTables()
      .then((data) => setTables(data))
      .catch((err) => {
        console.error("Nem sikerült betölteni a táblákat:", err);
      });
  }, []);

  useEffect(() => {
    console.log("bejott tabla");
    fetchTables()
      .then((data) => setTables(data))
      .catch((err) => {
        console.error("Nem sikerült betölteni a táblákat:", err);
      });
  }, [updateTrigger]);

  useEffect(() => {
    console.log("bejott DB");
    fetchDatabases()
      .then((data) => {
        console.log("Sikeres old_db:", data);
        setDbNames(data);
        setOpenStates(
          data.reduce((acc, dbName) => ({ ...acc, [dbName]: false }), {})
        ); // ha új db jött, ehhez is jó frissítés
      })
      .catch((error) => {
        console.log("fetchDB hiba: ", error);
      });
  }, [updateTriggerDB]);

  const handleClick = (dbName) => {
    setOpenStates((prev) => ({ ...prev, [dbName]: !prev[dbName] }));
  };

  const handleDeleteTable = async (dbName, tableName) => {
    const jsonData = {
      database: dbName,
      table: tableName,
    };
    try {
      const res = await fetch(
        "http://localhost:4000/database/table/delete/table",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonData),
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      const data = await res.json();
      alert(data.message);
      console.log("Delete success:", data);
      setUpdateTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };
  return (
    <List
      subheader={
        <ListSubheader
          sx={{
            color: "white",
            backgroundColor: "black",
            fontSize: 40,
            borderRadius: 10,
          }}
        >
          Databases:
        </ListSubheader>
      }
    >
      {dbNames.map((dbName, index) => (
        <ListItem
          key={index}
          disablePadding
          sx={{ flexDirection: "column", alignItems: "stretch" }}
        >
          <ListItemButton onClick={() => handleClick(dbName)}>
            <ListItemText primary={dbName} />
            {openStates[dbName] ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openStates[dbName]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 4 }}>
              {tables[dbName]?.length > 0 ? (
                tables[dbName].map((table, tIndex) => (
                  <ListItem key={tIndex} disablePadding>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteTable(dbName, table)}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <ListItemButton>
                      <ListItemText primary={table} />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <ListItem disablePadding>
                  <ListItemButton>
                    <ListItemText primary="-" sx={{ color: "black" }} />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </Collapse>
        </ListItem>
      ))}
    </List>
  );
}

export default NestedList;
