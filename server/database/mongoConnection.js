const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `${process.env.MONGO_DB_BASE_URI.replace(
  "MONGO_DB_SECRET_KEY",
  process.env.MONGO_DB_SECRET
)}/?retryWrites=true&w=majority&appName=${process.env.MONGO_DB_URI_PARAM_APP_NAME}`;

const client = new MongoClient(uri, {
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
