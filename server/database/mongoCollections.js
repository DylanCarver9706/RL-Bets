const { connectToDatabase } = require("./mongoConnection");

let collections = {};

const initializeCollections = async () => {
  const db = await connectToDatabase();
  collections.usersCollection = db.collection("Users");
  collections.logsCollection = db.collection("Logs");
  collections.wagersCollection = db.collection("Wagers");
  collections.betsCollection = db.collection("Bets");
  collections.seasonsCollection = db.collection("Seasons");
  collections.tournamentsCollection = db.collection("Tournaments");
  collections.seriesCollection = db.collection("Series");
  collections.matchesCollection = db.collection("Matches");
  collections.teamsCollection = db.collection("Teams");
  collections.playersCollection = db.collection("Players");
  console.log("Collections initialized")
};

module.exports = { initializeCollections, collections };
