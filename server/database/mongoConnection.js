const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_DB_BASE_URI;

const options = {
  ssl: true,
  tls: true,
  tlsInsecure: false,
  minPoolSize: 1,
};

const client = new MongoClient(uri, options);

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("RLBets");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

module.exports = { client, connectToDatabase };
