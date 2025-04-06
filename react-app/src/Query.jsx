import { Button } from "@mui/material";
import { Fragment, useState, useRef } from "react";

function Query() {
  const [code, setCode] = useState("");
  const textareaRef = useRef();
  const lineNumberRef = useRef();

  const lineHeight = 40; // px — match with textarea fontSize & lineHeight

  // Handles input changes and updates line numbers
  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  // Calculates line numbers based on line count
  const getLineCount = () => {
    return code.split("\n").length || 1;
  };

  // Keeps line numbers in sync with textarea scroll
  const syncScroll = () => {
    lineNumberRef.current.scrollTop = textareaRef.current.scrollTop;
  };

  const handleClick = async () => {
    const jsonData = { query: code };
    let method;
    let method_type;
    try {
      method = code.split(";")[1]?.trim().split(" ")[0].toLowerCase();
      if (method === "insert") {
        method_type = "POST";
      } else if (method === "delete") {
        method_type = "DELETE";
      } else {
        throw new Error("Invalid method");
      }
    } catch (error) {
      alert(error.message);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/database/row/${method.toLowerCase()}`,
        {
          method: method_type,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      alert(`Success: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    }
  };

  return (
    <Fragment>
      <div
        id="query-div"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "80%",
          margin: "0 auto",
        }}
      >
        <Button
          onClick={handleClick}
          sx={{
            backgroundImage: "url(/play-button.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: 70,
            height: 70,
            alignSelf: "flex-end",
            marginTop: 2,
          }}
        />

        <div
          style={{
            display: "flex",
            flex: 1,
            overflow: "hidden",
            fontFamily: "monospace",
            fontSize: `${lineHeight - 10}px`,
            marginTop: "20px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            backgroundColor: "transparent",
          }}
        >
          {/* Line Numbers */}
          <div
            ref={lineNumberRef}
            style={{
              width: "50px",
              textAlign: "right",
              paddingRight: "10px",
              color: "#888",
              overflow: "hidden",
              userSelect: "none",
              lineHeight: `${lineHeight}px`,
            }}
          >
            {Array.from({ length: getLineCount() }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            onScroll={syncScroll}
            style={{
              fontSize: `${lineHeight - 10}px`,
              lineHeight: `${lineHeight}px`,
              border: "none",
              outline: "none",
              resize: "none",
              backgroundColor: "transparent",
              fontFamily: "inherit",
              height: "1200px",
              width: "1500px",
              overflow: "auto",
            }}
          />
        </div>
      </div>
    </Fragment>
  );
}

export default Query;
