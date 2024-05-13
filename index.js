const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
};
app.use(cors(corsOptions));

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.m73tovo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbConnect = async () => {
  try {
    client.connect();
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log(error.name, error.message);
  }
};
dbConnect();

const Database = client.db("rebbitDb");
const QueriesCollection = Database.collection("queries");
const recommendationCollection = Database.collection("recommendations");

app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.jwt_web_token, { expiresIn: "1h" });

  res
    .cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({
      success: "true",
    });
});

app.get("/logout", (req, res) => {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 0,
    })
    .send({
      success: "true",
    });
});

app.get("/queries", async (req, res) => {
  const result = await QueriesCollection.find().toArray();
  res.json(result);
});

app.get("/queries/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await QueriesCollection.findOne(query);
  res.json(result);
});

app.delete("/queries/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await QueriesCollection.deleteOne(query);
  res.json(result);
});

app.put("/queries/:id", async (req, res) => {
  const id = req.params.id;
  const {
    productName,
    brandName,
    productImage,
    queryTitle,
    alternationReason,
  } = req.body;
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      productName,
      brandName,
      productImage,
      queryTitle,
      alternationReason,
    },
  };
  const result = await QueriesCollection.updateOne(query, updateDoc);
  res.send(result);
});

app.patch("/myrecqueries/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $inc: { "userInfo.recommendationCount": 1 },
  };
  const result = await QueriesCollection.updateOne(query, updateDoc);
  res.send(result);
});

app.get("/myqueries/:email", async (req, res) => {
  const email = req.params.email;
  const query = { "userInfo.email": email };
  const result = await QueriesCollection.find(query).toArray();
  res.json(result);
});
app.post("/addqueries", async (req, res) => {
  const product = req.body;
  const result = await QueriesCollection.insertOne(product);
  res.json(result);
});

app.post("/recommendations", async (req, res) => {
  const recommendation = req.body;
  const result = await recommendationCollection.insertOne(recommendation);
  res.json(result);
});
app.get("/recommendations", async (req, res) => {
  const result = await recommendationCollection.find().toArray();
  res.json(result);
});

app.get("/myrecommendations/:email", async (req, res) => {
  const email = req.params.email;
  const query = { recommenderEmail: email };
  const result = await recommendationCollection.find(query).toArray();
  res.send(result);
});

app.get("/recommendationme/:email", async (req, res) => {
  const email = req.params.email;
  const query = { UserEmail: email };
  const result = await recommendationCollection.find(query).toArray();
  res.send(result);
});

app.get("/recommendations/:id", async (req, res) => {
  const id = req.params.id;
  const query = { queryId: id };
  const result = await recommendationCollection.find(query).toArray();
  res.json(result);
});

app.delete("/recommendations/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await recommendationCollection.deleteOne(query);
  res.json(result);
});

app.patch("/queiresdec/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateDoc = {
    $inc: { "userInfo.recommendationCount": -1 },
  };
  const result = await QueriesCollection.updateOne(query, updateDoc);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
