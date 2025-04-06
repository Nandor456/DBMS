import {
  Drawer,
  CssBaseline,
  Toolbar,
  Box,
  AppBar,
  Typography,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { useState } from "react";
import DatabaseName from "./databaseName";
import CollectionName from "./CollectionName";
import NestedList from "./NestedList";
import { Link, Routes, Route } from "react-router-dom";
import Query from "./Query";
const drawerWidth = 250;

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [updateTriggerDB, setUpdateTriggerDB] = useState(0);
  return (
    <>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            VegMez
          </Typography>
          <MenuItem component={Link} to="/">
            Databases
          </MenuItem>
          <MenuItem component={Link} to="/query">
            Query
          </MenuItem>
        </Toolbar>
      </AppBar>

      {/* Main Layout with Drawer */}
      <Box sx={{ display: "flex" }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#818181",
              borderRight: "5px solid black",
            },
          }}
        >
          <Toolbar />
          <NestedList
            updateTrigger={updateTrigger}
            updateTriggerDB={updateTriggerDB}
          />
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h1>
                    <DatabaseName
                      onDBCreated={() => setUpdateTriggerDB((prev) => prev + 1)}
                    />
                  </h1>
                  <h1>
                    <CollectionName
                      onTableCreated={() =>
                        setUpdateTrigger((prev) => prev + 1)
                      }
                    />
                  </h1>
                </>
              }
            />
            <Route path="/query" element={<Query />} />
          </Routes>
        </Box>
      </Box>
    </>
  );
}

export default App;
