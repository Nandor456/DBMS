import { 
    List, ListItem, ListItemButton, ListItemText, 
    ListSubheader, Collapse 
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import React, { useState, useEffect } from "react";

function NestedList() {
    const [dbNames, setDbNames] = useState([]);
    const [openStates, setOpenStates] = useState({});
    const [tables, setTables] = useState({}); // Store tables as an object

    useEffect(() => {
        fetch("http://localhost:4000/database/old")
            .then(res => res.ok ? res.json() : Promise.reject("Hiba old_db"))
            .then(data => {
                setDbNames(data);
                setOpenStates(data.reduce((acc, dbName) => ({ ...acc, [dbName]: false }), {}));
            })
            .catch(error => console.error("Hiba: ", error));
    }, []);

    useEffect(() => {
        fetch("http://localhost:4000/database/old/table")
            .then(res => res.ok ? res.json() : Promise.reject("Hiba old_table"))
            .then(data => {
                console.log("Sikeres old_table:", data);
                setTables(data); // Data is already an object { "123": [], "234": [] }
            })
            .catch(error => console.error("Hiba: ", error));
    }, []);

    const handleClick = (dbName) => {
        setOpenStates(prev => ({ ...prev, [dbName]: !prev[dbName] }));
    };

    return (
        <List
            subheader={
                <ListSubheader sx={{ color: "white", backgroundColor: "black", fontSize: 40, borderRadius: 10 }}>
                    Databases:
                </ListSubheader>
            }
        >
            {dbNames.map((dbName, index) => (
                <ListItem key={index} disablePadding>
                    <ListItemButton onClick={() => handleClick(dbName)}>
                        <ListItemText primary={dbName} />
                        {openStates[dbName] ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={openStates[dbName]} timeout="auto" unmountOnExit>
                    
                        <List component="div" disablePadding sx={{ pl: 4}}>
                            {tables[dbName]?.length > 0 ? (
                                tables[dbName].map((table, tIndex) => (
                                    <ListItem key={tIndex} disablePadding>
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
