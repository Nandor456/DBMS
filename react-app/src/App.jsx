import { Drawer, CssBaseline, Toolbar, Box } from "@mui/material";
import { useState } from "react";
import DatabaseName from "./databaseName";
import CollectionName from "./collectionName";
import TableList from "./collectionTables";
import NestedList from "./NestedList";

const drawerWidth = 250;

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box", backgroundColor:'#818181', borderRight: "5px solid black" }
        }}
      >
        <Toolbar />
        <NestedList />
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <h1><DatabaseName></DatabaseName></h1>
        <h1>
          <CollectionName  
            onTableCreated={() => setUpdateTrigger(prev => prev + 1)} 
          />
        </h1>
        <h1>
          <TableList 
            updateTrigger={updateTrigger} 
          />
        </h1>
      </Box>
    </Box>
  );
}

export default App;
