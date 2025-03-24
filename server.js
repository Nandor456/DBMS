const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");


const app = express();
app.use(express.json());
app.use(cors());
//{ "name": "arka2" }

// {   
//     "database": "adasd2", 
//     "table": "ezaz0",
//     "column": {
//         "constraints":
//         {
//             "PK": [
//                 "Person", "Phone number"
//             ],
//             "FK": [
//                     {
//                     "FK_tablename": "Test2",
//                     "FK_column": "id",
//                     "local_FK_column": "FK_id_Test2"
//                     },
//                     {
//                     "FK_tablename": "Test2",
//                     "FK_column": "id",
//                     "local_FK_column": "FK_id_Test2"
//                     }
//                 ]
//         },
//         "column":
//         [
//             {
//                 "name": "asd",
//                 "type": "int"
//             },
//             {
//                 "name": "masd",
//                 "type": "VARCHAR"
//             }
//         ]
//     }
// }

// mongoose.connect("mongodb://localhost:27017/admin", {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log("✅ MongoDB csatlakozva!"))
//   .catch(err => console.error("MongoDB hiba:", err));

const dbFile = "databases.json"
const folder = "test";
const tableFile = "table.json"

if (!fs.existsSync(dbFile))
    fs.writeFileSync(dbFile, JSON.stringify([], null))
if (!fs.existsSync(tableFile))
    fs.writeFileSync(tableFile, JSON.stringify({}, null))
if (!fs.existsSync(folder)){
    fs.mkdirSync(folder);
    console.log("Folder made");
}else{
    console.log("Folder done");
}

//create database
app.post("/database", (req,res) =>{
    //console.log("vettem")
    const {name} = req.body
    if (!name) 
        return res.status(404).send("Not Found");

    let data = JSON.parse(fs.readFileSync(dbFile));
    console.log(data)
    let tableData = JSON.parse(fs.readFileSync(tableFile));
    // console.log(data);
    // console.log(name)
    // data.forEach(element => {
    //     console.log(element); 
    // });
    if (data.some(database => database === name)){
        console.log("Mar letezik az Adatbazis nev");
        return res.status(400).send("Az adatbazis mar letezik");
    }
    data.push(name);
    console.log(data)
    tableData[name] = []
    fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
    const folderPath = path.join(__dirname, folder, name)
    fs.mkdirSync(folderPath, {recursive: true });
    res.json({"message": `Adatbazis '${name}' letrehozva`});
    
});

//create table
app.post("/database/table", (req,res) => {
    console.log("vettem table")
    const {database, table, columns} = req.body
    console.log(req.body)
    console.log(database)
    console.log(table)
    console.log(columns)
    //nevek megvannak
    if (!database || !table || !columns){
        console.log("Hiba a body-ban")
        return res.status(400).send("Hiba a tabla beszurassal");
    }
    console.log("elson tuljutott")
    
    //"databases.json" kiolvasas
    let data = JSON.parse(fs.readFileSync(dbFile));
    console.log("dsa")
     //"table.json" kiolvasas
    let tableData = JSON.parse(fs.readFileSync(tableFile));
    console.log("sas")
    if (!data.some(database2 => database2 === database)){              //database letezik
        console.log("Nem letezik ilyen adatbazis");
        return res.status(400).send("Nem letezik ilyen adatbazis");
    }
    //console.log("masodikon tuljutott")
    console.log(table)
    console.log(database)
    if (tableData[database].some(value => value === table)){        // table mar letezik
        console.log("Mar letezik az tabla nev");
        return res.status(400).send("Mar letezik az tabla nev");
    }
    //console.log("harmadikon tuljutott")

    tableData[database].push(table)
    console.log(tableData)
    fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));        //table berakva json-be
    const folderPath = path.join(__dirname, folder, database, table)
    fs.mkdirSync(folderPath, {recursive: true });                           //table folder letrejott
    res.json({"message": `Adatbazis '${database}'-ban '${table}' letrehozva`});
    console.log(folderPath);
    
    filePath = path.join(folderPath, "column.json")
    const jsonData = {columns};

    fs.writeFileSync(filePath, JSON.stringify(columns, null, 2));

});

//database delete
app.delete("/database/delete", (req,res) => {
    const {name} = req.body
    console.log(name)
    if (!name) 
        return res.status(404).send("Not Found");
    console.log("itt")
    let data = JSON.parse(fs.readFileSync(dbFile));
    let tableData = JSON.parse(fs.readFileSync(tableFile));

    if (!data.some(database => database === name)){
        console.log("Nem letezik az Adatbazis");
        return res.status(400).send("Az adatbazis nem letezik");
    }

    //console.log(data);
    const jsonData = data.filter(element => element !== name);    //kivesszuk az elemet a database.json-bol
    //console.log(jsonData);
    fs.writeFileSync(dbFile, JSON.stringify(jsonData, null, 2)); //felulirjuk a torolt elem nelkul database.json
    //console.log(tableData)
    delete tableData[name];
    fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2)); //felulirjuk a torolt elem nelkul table.json
    //console.log(tableData);
    const folderPath = path.join(__dirname, folder, name);
    console.log(folderPath)
    try {
        fs.rmSync(folderPath, { recursive: true, force: true }); // "force" ensures it doesn't fail if the folder is missing
    } catch (error) {
        console.error("Error deleting folder:", error);
    }
    res.json({"message": `Adatbazis '${name}'-torolve`});

});

app.delete("/database/table/delete", (req,res) =>{
    const {database, table} = req.body
    if (!database || !table) 
        return res.status(404).send("Not Found");

    let tableData = JSON.parse(fs.readFileSync(tableFile));

    if (!tableData[database].some(value => value === table)){        // table meg nem letezik
        console.log("Meg nem letezik a tabla");
        return res.status(400).send("Meg nem letezik a tabla");
    }

    tableData[database] = tableData[database].filter(element => element !== table);  
    console.log(tableData)
    fs.writeFileSync(tableFile, JSON.stringify(tableData, null, 2));
    
    const folderPath = path.join(__dirname, folder, database, table);
    console.log(folderPath)
    fs.rmSync(folderPath, {recursive: true});
    res.json({"message": `Adatbazis '${database}'-ban '${table}' torolve`});

});

app.get("/database/old", (_,res) =>{
    console.log("Old keres");
    let jsonData = JSON.parse(fs.readFileSync(dbFile));
    console.log(jsonData)
    //console.log(json(jsonData.map(db => db.name)));
    res.json(jsonData)
});

app.get("/database/old/table", (_,res) =>{
    console.log("Old tabla keres");
    let jsonData = JSON.parse(fs.readFileSync(tableFile));
    console.log( jsonData)
    //console.log(json(jsonData.map(db => db.name)));
    res.json(jsonData)
});


app.listen(4000, () => console.log("Szerver fut a 4000-es porton!"));