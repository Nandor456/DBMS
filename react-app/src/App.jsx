import { Drawer, CssBaseline, Toolbar, Box } from "@mui/material";
import DatabaseName from "./databaseName";
import CollectionName from "./collectionName";
import TableList from "./collectionTables";
import NestedList from "./NestedList";

const drawerWidth = 250;

function App() {
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
        <h1><DatabaseName /></h1>
        <h1><CollectionName /></h1>
        <h1><TableList /></h1>
      </Box>
    </Box>
  );
}

export default App;
