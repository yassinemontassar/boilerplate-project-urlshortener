require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
const dns = require("dns");
const urlparser = require("url");

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("urlshortener");
const urls = db.collection("urls");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  console.log(req.body);
  const dnslookup = dns.lookup(
    urlparser.parse(req.body.url).hostname,
    async (err, address) => {
      if (!address) {
        res.json({ error: "Invalid URL" });
      } else {
        const urlcount = await urls.countDocuments({});
        const url = {
          original_url: req.body.url,
          short_url: urlcount,
        };
        const result = await urls.insertOne(url);
        res.json({
          original_url: req.body.url,
          short_url: urlcount,
        });
        console.log(result);
        
      }
    }
  );
  
});

app.get("/api/shorturl/:short_url", async function (req, res) {
  const short_url = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +short_url });

  if (!urlDoc) {
    return res.json({ error: "No short URL found for the given input" });
  }

  res.redirect(urlDoc.original_url); // Access original_url instead of url
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
