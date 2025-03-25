import { useState } from "react";
import DatabaseName from "./databaseName";
import CollectionName from "./collectionName";
import TableList from "./collectionTables";

function App() {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  return (
    <div>
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
    </div>
  );
}

export default App;
