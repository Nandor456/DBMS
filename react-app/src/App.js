import DatabaseName from "./databaseName";
import CollectionName from "./collectionName";
import TableList from "./collectionTables";

function App() {
  return (
    <div>
      <h1><DatabaseName></DatabaseName></h1>
      <h1><CollectionName></CollectionName></h1>
      <h1><TableList></TableList></h1>
    </div>
  );
}

export default App;
