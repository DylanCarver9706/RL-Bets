const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.MONGO_DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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
