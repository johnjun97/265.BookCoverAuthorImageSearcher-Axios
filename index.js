import express from "express";
import bodyParser from "body-parser";
import pg from "pg"; //PostgreSQL client for Node.js
import axios from "axios";

const app = express();
const port = 3000;

//const axios = require("axios");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "database",
  password: "P@ssW0rd88",
  port: 5432,
});
db.connect();

app.get("/", async (req, res) => {
  try {

    const result = await db.query("SELECT * FROM authorbook ORDER BY id ASC");
    const saved2 = result.rows;
    const url2 = "don't have any search result because this is homepage";

    res.render("index", { url: url2, saved: saved2 });
  } catch (error) {
    console.error(error);
    res.render("index", {
      errorMessage: "Error: " + error.message,
    });
  }
});

app.post("/search", async (req, res) => {
  try { //read database
    const result = await db.query("SELECT * FROM authorbook ORDER BY id ASC");
    const saved2 = result.rows;

    // Check if image exists using axios
    let url2 = ""; //need to declare fisrt in javascript
    let error2 = "";
    const bookAuthor = req.body["book\\author"];
    const identifier = req.body.identifier;
    const key = req.body.key;
    const size = req.body.size;

    const baseUrl = `https://covers.openlibrary.org/${bookAuthor}/${identifier}/${key}-${size}.jpg?default=false`;

    console.log(" ~ Last Search ~");
    console.log(bookAuthor, identifier, key, size);

    try {
      const response = await axios.get(baseUrl, { responseType: "stream" }); // stream avoids downloading full image
      if (response.status === 200) { // HTTP response status code 200 means "OK"
        console.log('1');
        url2 = baseUrl; // image exists
      }
    } catch (err) {
      // Check if the error is from the response
      if (err.response) {
        console.log('2');
        // Server responded with a status code outside the 2xx range
        console.warn("API Error: ", err.response.data);  // The error message from the API
        error2 =  `Error: ${err.response.status} - ${err.response.statusText}`;
        url2 = baseUrl; // image exists
      } else if (err.request) {
        console.log('3');
        // No response was received from the server
        console.warn("No response from API:", err.request);
        error2 =  `Error: ${err.response.status} - ${err.response.statusText}`;
        url2 = baseUrl; // image exists
      } else {
        console.log('4');
        // Something else went wrong (e.g., configuration issue)
        console.warn("Error:", err.message);
        error2 =  `Error: ${err.response.status} - ${err.response.statusText}`;
        url2 = baseUrl; // image exists
      }
    }

    res.render("index", { url: url2, saved: saved2, error: error2});
  } catch (error) {
    console.error(error);
    res.render("index", {
      errorMessage: "1API request failed: " + error.message,
    });
  }
});


app.post("/save", async (req, res) => {
  let url2 = ""; // <== define url2 in outer scope so it's accessible in catch
  let error2 = "";
  try {
    url2 = req.body.url;
    console.log("url2 :", url2)

    if (url2 === "") {
      console.log("url2 is not defined!");
    } else {
      const parts = url2
        .replace("https://covers.openlibrary.org/", "")
        .split("/");
      const P1 = parts[0];
      const P2 = parts[1];
      const keySize = parts[2].split("-");
      const P3 = keySize[0];
      const P4 = keySize[1].replace(".jpg", "");
      
      const cleanP4 = P4.split('?')[0];

      await db.query(
        "INSERT INTO authorbook (book_author, identifier, key_field, size) VALUES ($1, $2, $3, $4);",
        [P1, P2, P3, cleanP4]
      );
    }

    const result = await db.query("SELECT * FROM authorbook ORDER BY id ASC");
    const saved2 = result.rows;
    ;


    res.render("index", { url: url2, saved: saved2, error: error2, successMessage: "Saved successfully!",
    });
  } catch (error) {
    console.error(error);
    res.render("index", {
      url: url2, // now safe because it's defined above
      errorMessage: "2API request failed: " + error.message,
      error: error2,
    });
  }
});


app.post("/delete", async (req, res) => {
  let url2 = ""; //need to declare fisrt in javascript
  let error2 = "";
  try {
    const selectDelete = req.body.id;
    console.log("selectDelete: ", selectDelete);
    const result1 = await db.query("DELETE FROM authorbook WHERE id = ($1);", [
      selectDelete,
    ]);

    const result = await db.query("SELECT * FROM authorbook ORDER BY id ASC");
    const saved2 = result.rows;

    const url2 = " "; // this is necessary somehow, if remove this after delete will "No data available. (Something is wrong)"

    res.render("index", { url: url2, error: error2, saved: saved2 });
  } catch (error) {
    console.error(error);
    res.render("index", {
      errorMessage: "3API request failed: " + error.message,
    });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
