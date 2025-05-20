import { useEffect, useState, useRef } from "react";
import { Button } from "@mui/material";
import { fetchDatabases } from "./utils/OldDatabaseFunction";
import { fetchTables } from "./utils/OldTableFunction";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { useMemo } from "react";

function Query() {
  const [code, setCode] = useState("");
  const [databases, setDatabases] = useState([]);
  const [tableName, setTables] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const keywords = ["SELECT", "FROM", "INSERT", "DELETE", "UPDATE", "TABLE"];
  const [dynamics, setDynamics] = useState([]);
  const [dynamicColumns, setDynamicColumns] = useState([]);
  const editorRef = useRef();

  useEffect(() => {
    const load = async () => {
      try {
        const dbs = await fetchDatabases();
        const tablesByDb = await fetchTables();
        const dynamic = [...dbs];
        setDynamics(dynamic);
        for (const [_, tables] of Object.entries(tablesByDb)) {
          for (const table of tables) {
            dynamic.push(table);
          }
        }
        console.log("Dynamic:", dynamic);
        setSuggestions([...keywords, ...dynamic]);
      } catch (e) {
        console.error("Failed to load autocomplete items", e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load2 = async () => {
      try {
        if (databases && tableName) {
          const res = await fetch("http://localhost:4000/database/columns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ database: databases, table: tableName }),
          });

          const data = await res.json();
          console.log("Columns data:", data);

          if (Array.isArray(data.columns)) {
            setDynamicColumns(data.columns); // felülírjuk, nem bővítjük
          } else {
            console.log("No columns found");
            setDynamicColumns([]);
          }
        } else {
          setDynamicColumns([]);
        }
      } catch (e) {
        console.error("Failed to load columns:", e);
        setDynamicColumns([]);
      }
    };
    load2();
  }, [databases, tableName]);

  useEffect(() => {
    setSuggestions([...keywords, ...dynamics, ...dynamicColumns]);
  }, [dynamicColumns]);

  const handleClick = async () => {
    const jsonData = { query: code };
    let method;
    try {
      method = code.split(";")[1]?.trim().split(" ")[0].toLowerCase();
      if (!["insert", "create", "delete"].includes(method))
        throw new Error("Invalid method");
      const method_type = method === "delete" ? "DELETE" : "POST";
      const response = await fetch(
        `http://localhost:4000/database/row/${method}`,
        {
          method: method_type,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonData),
        }
      );
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      alert("Success: " + text);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const extensions = useMemo(
    () => [
      sql(),
      autocompletion({
        override: [
          completeFromList(
            suggestions.map((s) => ({ label: s, type: "keyword" }))
          ),
        ],
      }),
    ],
    [suggestions]
  );

  return (
    <div
      style={{
        padding: 20,
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <Button onClick={handleClick} variant="contained">
        Run
      </Button>
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          marginTop: 20,
        }}
      >
        <CodeMirror
          value={code}
          width="1000%"
          height="1000%"
          extensions={extensions}
          onChange={(val) => {
            setCode(val);
            const useMatch = val.match(/use\s+(\w+)/i);
            const fromMatch = val.match(/from\s+(\w+)/i);

            const afterUse = useMatch?.[1] || null;
            const afterFrom = fromMatch?.[1] || null;

            console.log("SELECT után:", afterUse);
            console.log("FROM után:", afterFrom);
            setDatabases(afterUse);
            setTables(afterFrom);
          }}
          theme={oneDark}
          basicSetup={{ lineNumbers: true }}
        />
      </div>
    </div>
  );
}

export default Query;

// useEffect(() => {
//     const load = async () => {
//       try {
//         const dbs = await fetchDatabases();
//         const tablesByDb = await fetchTables();
//         const keywords = [
//           "SELECT",
//           "FROM",
//           "INSERT",
//           "DELETE",
//           "UPDATE",
//           "TABLE",
//         ];
//         const dynamic = [...dbs];

//         for (const [db, tables] of Object.entries(tablesByDb)) {
//           for (const table of tables) {
//             dynamic.push(table);
//             if (databases && tableName) {
//               const res = await fetch(
//                 "http://localhost:4000/database/columns",
//                 {
//                   method: "POST",
//                   headers: { "Content-Type": "application/json" },
//                   body: JSON.stringify({ database: db, table }),
//                 }
//               );
//               if (res.ok) {
//                 const data = await res.json();
//                 if (Array.isArray(data.columns)) {
//                   dynamic.push(...data.columns);
//                 }
//               }
//             }
//           }
//         }

//         setSuggestions([...keywords, ...dynamic]);
//       } catch (e) {
//         console.error("Failed to load autocomplete items", e);
//       }
//     };
//     load();
//   }, []);
