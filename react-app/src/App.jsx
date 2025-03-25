import DatabaseName from "./databaseName";
import CollectionName from "./collectionName";
import TableList from "./collectionTables";
import { Fragment } from "react";
import NestedList from "./NestedList";


function App() {
  return (
    <Fragment>
      <NestedList></NestedList>
      <h1><DatabaseName></DatabaseName></h1>
      <h1><CollectionName></CollectionName></h1>
      <h1><TableList></TableList></h1>
    </Fragment>
  );
}

export default App;
