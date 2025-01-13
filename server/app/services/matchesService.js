const { collections } = require("../../database/mongoCollections");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");
const { createLog } = require("./logsService");
const { ObjectId } = require("mongodb");
const { getSocketIo } = require("../middlewares/socketIO");
const { getAllWagers } = require("./wagersService");

const createMatch = async (matchData) => {
  if (!matchData.series) {
    throw new Error("Series ID is required to create a Match.");
  }

  // Insert the match document
  const matchResult = await createMongoDocument(
    collections.matchesCollection,
    matchData
  );

  // Update the Series document to include this match
  await updateMongoDocument(collections.seriesCollection, matchData.series, {
    $push: { matches: matchResult.insertedId },
  });

  return matchResult.insertedId;
};

const getAllMatches = async () => {
  return await collections.matchesCollection.find().toArray();
};

const getMatchById = async (id) => {
  return await collections.matchesCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const updateMatch = async (id, updateData) => {
  if (updateData.winner)
    updateData.winner = ObjectId.createFromHexString(updateData.winner);
  if (updateData.loser)
    updateData.loser = ObjectId.createFromHexString(updateData.loser);
  if (updateData.firstBlood)
    updateData.firstBlood = ObjectId.createFromHexString(updateData.firstBlood);
  if (updateData.series)
    updateData.series = ObjectId.createFromHexString(updateData.series);

  await updateMongoDocument(collections.matchesCollection, id, {
    $set: updateData,
  });

  // Update the status of all wagers associated with this match
  if (updateData.status) {
    const wagers = await collections.wagersCollection
      .find({ rlEventReference: id })
      .toArray();
    await Promise.all(
      wagers.map((wager) =>
        updateMongoDocument(
          collections.wagersCollection,
          wager._id.toString(),
          {
            $set: { status: updateData.status },
          }
        )
      )
    );
    const io = getSocketIo();
    io.emit("wagersUpdate", await getAllWagers());
  }
};

const deleteMatch = async (id) => {
  const match = await getMatchById(id);
  if (!match) throw new Error("Match not found");

  // Remove match from the series
  await updateMongoDocument(collections.seriesCollection, match.series, {
    $pull: { matches: ObjectId.createFromHexString(id) },
  });

  await collections.matchesCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
};

// Functions for matches that end

const WagerOutcomeFormula = (
  betAmount,
  totalWinnersBetsAmount,
  totalLosersBetsAmount
) => {
  return (
    (betAmount / totalWinnersBetsAmount) * totalLosersBetsAmount + betAmount
  );
};

// Function to pay out bets
const payOutBetWinners = async (wagerId, agreeIsWinner) => {
  // Find all wagers where rlEventReference matches the converted ObjectId
  const wager = await collections.wagersCollection.findOne({
    _id: ObjectId.createFromHexString(wagerId),
  });

  // console.log(wager)

  // Get all the bets in the wager
  const wagerBets = await collections.betsCollection
    .find({
      _id: { $in: wager.bets },
    })
    .toArray();

  // Calculate the total credits for the winner and loser bets
  let loserCredits = 0;
  let winnerCredits = 0;
  for (let index = 0; index < wagerBets.length; index++) {
    const bet = wagerBets[index];
    if (bet.agreeBet !== agreeIsWinner) {
      loserCredits += bet.credits;
    } else {
      winnerCredits += bet.credits;
    }
  }

  // Update users credits field to add the credits they won
  for (let index = 0; index < wagerBets.length; index++) {
    const bet = wagerBets[index];
    if (bet.agreeBet == agreeIsWinner) {
      const user = await collections.usersCollection.findOne({
        _id: ObjectId.createFromHexString(bet.user),
      });
      awardedCredits = WagerOutcomeFormula(
        bet.credits,
        winnerCredits,
        loserCredits
      );
      console.log(
        "User Paid Out:",
        String(user._id),
        " Earned Credits: ",
        awardedCredits
      );
      const updatedUser = await updateMongoDocument(
        collections.usersCollection,
        bet.user,
        {
          $set: {
            earnedCredits: user.earnedCredits + awardedCredits,
            credits: user.credits + awardedCredits,
          },
        },
        true
      );

      createLog({
        wagerId: wagerId,
        earnedCredits: awardedCredits,
        type: "User Paid Out",
        user: user._id,
      });

      // Emit 'updateUser' event with updated user data to all connected clients
      const io = getSocketIo();
      io.emit("updateUser", updatedUser);
    }
  }
};

const getMatchOutcomes = async (
  matchResults,
  teams,
  agreeEvaluationObject = null
) => {
  try {
    // Step 1: Retrieve the teams from the teamsCollection
    const teamsArray = await collections.teamsCollection
      .find({ _id: { $in: teams } })
      .toArray();

    // Step 2: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap((team) => team.players);

    // Step 3: Retrieve the player metadata from the playersCollection
    const playersArray = await playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Initialize team goals
    let teamGoals = {
      [teams[0].toString()]: 0,
      [teams[1].toString()]: 0,
    };

    // Step 1: Retrieve players and their team associations
    const playerNames = Object.keys(matchResults);
    const players = await collections.playersCollection
      .find({ name: { $in: playerNames } })
      .toArray();

    // Step 2: Map player goals to their respective teams
    players.forEach((player) => {
      const playerResult = matchResults[player.name];
      if (playerResult) {
        const teamId = player.team.toString();
        if (teamGoals[teamId] !== undefined) {
          teamGoals[teamId] += playerResult.goals; // Sum goals per team
        }
      }
    });

    // Step 3: Determine the winning team
    const [team1, team2] = teams.map((team) => team.toString());
    let winningTeam = null;
    let losingTeam = null;
    if (teamGoals[team1] > teamGoals[team2]) {
      winningTeam = team1;
      losingTeam = team2;
    } else if (teamGoals[team2] > teamGoals[team1]) {
      winningTeam = team2;
      losingTeam = team1;
    }

    // Step 4: Find the MVP (highest score on the winning team)
    let mvp = null;
    let highestScore = 0;

    players.forEach((player) => {
      const playerResult = matchResults[player.name];
      // console.log(player)
      if (
        player.team.toString() === winningTeam &&
        playerResult.score > highestScore
      ) {
        highestScore = playerResult.score;
        // console.log(player)
        mvp = player._id; // Assign player as MVP
      }
    });

    // Step 5: Get a team goals string to use as the agree evaluation
    const teamGoalsString = Object.entries(teamGoals)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" - ");

    const response = {
      winningTeam,
      losingTeam,
      teamGoals: teamGoalsString,
      mvp,
    };

    // Step 6: Optionally determine the agree evaluation of a player/team attributes wager
    if (agreeEvaluationObject) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (
        teamsArray.some(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Find the team for the bet
        teamOrPlayerForBet = teamsArray.find(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        );

        // Calculate the total for the selected attribute from players on this team
        actualValue = 0;
        const teamPlayers = playersArray.filter((player) =>
          teamOrPlayerForBet.players
            .map((id) => id.toString())
            .includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = matchResults[player.name];
          if (
            playerResult &&
            selectedAttributeBetType.toLowerCase() in playerResult
          ) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
      }
      // Check if the selected ID corresponds to a player
      else if (
        playersArray.some(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Find the player for the bet
        teamOrPlayerForBet = playersArray.find(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        );

        // Get the value of the selected attribute for the player
        const playerResult = matchResults[teamOrPlayerForBet.name];
        if (
          playerResult &&
          selectedAttributeBetType.toLowerCase() in playerResult
        ) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        // Throw an error if neither a team nor a player was found for the bet
        throw new Error("Team or player not found");
      }

      // Evaluate the condition if actualValue is valid
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case "exactly":
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case "more than":
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case "less than":
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error("Invalid bet operator");
        }
      }

      // Add the evaluation result to the response
      response.agreeEvaluation = agreeEvaluation;
    }

    return response;
  } catch (error) {
    console.error("Error determining match winner:", error);
    throw new Error("Failed to determine match winner");
  }
};

const handleWagerEnded = async (wagerId, agreeIsWinner) => {
  const wager = await collections.wagersCollection.findOne({
    _id: ObjectId.createFromHexString(wagerId),
  });

  //  console.log("wager: ", wager)

  const updatedWager = {
    status: "Ended",
    agreeIsWinner: agreeIsWinner,
  };

  await updateMongoDocument(collections.wagersCollection, wager._id, {
    $set: updatedWager,
  });

  createLog({ type: "Wager Ended", WagerId: wagerId });

  // Fetch updated wager and statistics
  const updatedWagers = await getAllWagers();
  const io = getSocketIo();
  io.emit("wagersUpdate", updatedWagers); // Emit updated data to all clients

  await payOutBetWinners(wagerId, agreeIsWinner);
};

const calculatePlayerTotals = (matches) => {
  // Object to keep track of each player's aggregated stats across all matches
  const playerTotals = {};

  // Iterate through each match in the series
  matches.forEach((match) => {
    const { results } = match;

    // Iterate through each player in the match results
    Object.entries(results).forEach(([playerName, playerStats]) => {
      // Initialize the player's total if not already present
      if (!playerTotals[playerName]) {
        playerTotals[playerName] = {
          score: 0,
          goals: 0,
          assists: 0,
          shots: 0,
          saves: 0,
          demos: 0,
        };
      }

      // Add the stats of the current match to the player's total
      Object.keys(playerStats).forEach((stat) => {
        playerTotals[playerName][stat] += playerStats[stat];
      });
    });
  });

  // Return the total aggregated results for each player
  return playerTotals;
};

const getSeriesOutcomes = async (
  seriesId,
  agreeEvaluationWagerType = null,
  agreeEvaluationObject = null
) => {
  try {
    const response = {
      winningTeam: null,
      losingTeam: null,
      seriesScore: null,
      firstBlood: null,
      overtimeCount: null,
      agreeEvaluation: null,
    };

    const seriesDoc = await collections.seriesCollection.findOne({
      _id: ObjectId.createFromHexString(seriesId),
    });

    const seriesMatches = await collections.matchesCollection
      .find({ _id: { $in: seriesDoc.matches } })
      .toArray();

    let teamWins = {};
    let overtimeCount = 0; // Counter for matches that went to overtime

    // Iterate through each match in the series
    seriesMatches.forEach((match) => {
      const { winner, teams, wentToOvertime } = match;

      // Check if the match went to overtime and increment the counter if true
      if (wentToOvertime) {
        overtimeCount++;
      }

      // Initialize teams in the teamWins object if not already present
      teams.forEach((team) => {
        if (!teamWins[team]) {
          teamWins[team] = 0;
        }
      });

      // Increment the win count for the winning team
      if (winner) {
        teamWins[winner]++;
      }
    });

    // Create the seriesScore string
    const seriesScore = Object.entries(teamWins)
      .map(([team, wins]) => `${team}: ${wins}`)
      .join(" - ");

    response.winningTeam = seriesDoc.winner;
    response.losingTeam = seriesDoc.loser;
    response.firstBlood = seriesDoc.firstBlood;
    response.seriesScore = seriesScore;
    response.overtimeCount = overtimeCount;

    const seriesMatchesResults = calculatePlayerTotals(seriesMatches);

    // console.log("seriesMatchesResults: ", seriesMatchesResults)

    // Step 1: Retrieve the teams from the teamsCollection
    const teamsArray = await collections.teamsCollection
      .find({ _id: { $in: seriesDoc.teams } })
      .toArray();

    // Step 2: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap((team) => team.players);

    // Step 3: Retrieve the player metadata from the playersCollection
    const playersArray = await collections.playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Initialize team goals
    let teamGoals = {
      [seriesDoc.teams[0].toString()]: 0,
      [seriesDoc.teams[1].toString()]: 0,
    };

    // Step 1: Retrieve players and their team associations
    const playerNames = Object.keys(seriesMatchesResults);
    const players = await collections.playersCollection
      .find({ name: { $in: playerNames } })
      .toArray();

    // Step 2: Map player goals to their respective teams
    players.forEach((player) => {
      const playerResult = seriesMatchesResults[player.name];
      if (playerResult) {
        const teamId = player.team.toString();
        if (teamGoals[teamId] !== undefined) {
          teamGoals[teamId] += playerResult.goals; // Sum goals per team
        }
      }
    });

    // Step 6: Optionally determine the agree evaluation of a player/team attributes wager
    if (
      agreeEvaluationWagerType === "Player/Team Attributes" &&
      agreeEvaluationObject
    ) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (
        teamsArray.some(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Find the team for the bet
        teamOrPlayerForBet = teamsArray.find(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        );

        // Calculate the total for the selected attribute from players on this team
        actualValue = 0;
        const teamPlayers = playersArray.filter((player) =>
          teamOrPlayerForBet.players
            .map((id) => id.toString())
            .includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = seriesMatchesResults[player.name];
          if (
            playerResult &&
            selectedAttributeBetType.toLowerCase() in playerResult
          ) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
      }
      // Check if the selected ID corresponds to a player
      else if (
        playersArray.some(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Find the player for the bet
        teamOrPlayerForBet = playersArray.find(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        );

        // Get the value of the selected attribute for the player
        const playerResult = seriesMatchesResults[teamOrPlayerForBet.name];
        if (
          playerResult &&
          selectedAttributeBetType.toLowerCase() in playerResult
        ) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        // Throw an error if neither a team nor a player was found for the bet
        throw new Error("Team or player not found");
      }

      // Evaluate the condition if actualValue is valid
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case "exactly":
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case "more than":
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case "less than":
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error("Invalid bet operator");
        }
      }

      // Add the evaluation result to the response
      response.agreeEvaluation = agreeEvaluation;
    } else if (
      agreeEvaluationWagerType === "Overtime Count" &&
      agreeEvaluationObject
    ) {
      const { selectedBetOperator, seriesOvertimeBetInput } =
        agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(seriesOvertimeBetInput, 10);

      // Evaluate the condition if actualValue is valid
      if (attributeBetValue !== null) {
        switch (selectedBetOperator) {
          case "exactly":
            agreeEvaluation = overtimeCount === attributeBetValue;
            break;
          case "more than":
            agreeEvaluation = overtimeCount > attributeBetValue;
            break;
          case "less than":
            agreeEvaluation = overtimeCount < attributeBetValue;
            break;
          default:
            throw new Error("Invalid bet operator");
        }
      }

      // Add the evaluation result to the response
      response.agreeEvaluation = agreeEvaluation;
    }

    return response;
  } catch (error) {
    console.error("Error determining match winner:", error);
    throw new Error("Failed to determine match winner");
  }
};

const handleMatchWagers = async (
  matchId,
  matchOutcomes,
  firstBlood,
  matchResults,
  teams
) => {
  // Get all wagers associated to this match
  const matchWagers = await wagersCollection
    .find({ rlEventReference: matchId, status: "Ongoing" })
    .toArray();

  // console.log("matchWagers: ", matchWagers)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

  for (const wager of matchWagers) {
    if (wager.wagerType === "Match Winner") {
      // wager.agreeEvaluation is an Object id of the winning team
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === matchOutcomes.winningTeam.toString()
      );
    } else if (wager.wagerType === "Match Score") {
      // wager.agreeEvaluation is a string formatted as "Object id of Team1: Score - Object id of Team2 Score"
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === matchOutcomes.teamGoals
      );
    } else if (wager.wagerType === "First Blood") {
      // wager.agreeEvaluation is an Object id of the fist blood team
      await handleWagerEnded(wager._id, wager.agreeEvaluation === firstBlood);
    } else if (wager.wagerType === "Match MVP") {
      // NOTE: Assign object if of the players n the match results
      // wager.agreeEvaluation is an Object id of the mvp player
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === matchOutcomes.mvp.toString()
      );
    } else if (wager.wagerType === "Player/Team Attributes") {
      // NOTE: Make wager evaluation a trimmed version of wager.name
      // wager.agreeEvaluation is a string formatted as "Object id of the player/team will have exactly/more than/less than X of the following attributes: Points, Goals, Assists, Shots, Saves, Demos"
      const matchOutcomesEval = await getMatchOutcomes(
        matchResults,
        teams,
        wager.agreeEvaluation
      );
      console.log("matchOutcomesEval: ", matchOutcomesEval);
      await handleWagerEnded(wager._id, matchOutcomesEval.agreeEvaluation);
    }
  }
};

const handleSeriesWagers = async (seriesId) => {
  // console.log("seriesId: ", seriesId)

  // Get all wagers associated to this match
  const seriesWagers = await wagersCollection
    .find({ rlEventReference: seriesId.toString(), status: "Ongoing" })
    .toArray();

  // console.log("seriesWagers: ", seriesWagers)

  const seriesOutcomes = await getSeriesOutcomes(seriesId);

  // console.log("seriesOutcomes: ", seriesOutcomes)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

  for (const wager of seriesWagers) {
    if (wager.wagerType === "Series Winner") {
      // wager.agreeEvaluation is an Object id of the winning team
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === seriesOutcomes.winningTeam.toString()
      );
    } else if (wager.wagerType === "Series Score") {
      // wager.agreeEvaluation is a string formatted as "Object id of Team1: Score - Object id of Team2 Score"
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === seriesOutcomes.seriesScore
      );
    } else if (wager.wagerType === "First Blood") {
      // wager.agreeEvaluation is an Object id of the fist blood team
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === seriesOutcomes.firstBlood
      );
    } else if (wager.wagerType === "Overtime Count") {
      // NOTE: Assign object if of the players n the match results
      // wager.agreeEvaluation is an Object id of the mvp player
      const seriesOutcomesEval = await getSeriesOutcomes(
        seriesId,
        wager.wagerType,
        wager.agreeEvaluation
      );
      // console.log("seriesOutcomesEval: ", seriesOutcomesEval)
      await handleWagerEnded(wager._id, seriesOutcomesEval.agreeEvaluation);
    } else if (wager.wagerType === "Player/Team Attributes") {
      // NOTE: Make wager evaluation a trimmed version of wager.name
      // wager.agreeEvaluation is a string formatted as "Object id of the player/team will have exactly/more than/less than X of the following attributes: Points, Goals, Assists, Shots, Saves, Demos"
      const seriesOutcomesEval = await getSeriesOutcomes(
        seriesId,
        wager.wagerType,
        wager.agreeEvaluation
      );
      // console.log("seriesOutcomesEval: ", seriesOutcomesEval)
      await handleWagerEnded(wager._id, seriesOutcomesEval.agreeEvaluation);
    }
  }
};

const getTournamentOutcomes = async (
  tournamentId,
  agreeEvaluationObject = null
) => {
  try {
    const response = {
      winningTeam: null,
      losingTeam: null,
      agreeEvaluation: null,
    };

    // Step 1: Retrieve the tournament document
    const tournamentDoc = await tournamentsCollection.findOne({
      _id: ObjectId.createFromHexString(tournamentId),
    });
    if (!tournamentDoc) {
      throw new Error("Tournament not found");
    }

    response.winningTeam = tournamentDoc.winner;
    response.losingTeam = tournamentDoc.loser;

    // Step 2: Get all series within the tournament
    const seriesArray = await seriesCollection
      .find({ _id: { $in: tournamentDoc.series } })
      .toArray();
    const seriesIds = seriesArray.map((series) => series._id);

    // Step 3: Get all matches for these series
    const matchesArray = await matchesCollection
      .find({ series: { $in: seriesIds } })
      .toArray();

    // Step 4: Collect all unique team IDs from the series documents
    const teamIds = new Set();
    seriesArray.forEach((series) => {
      series.teams.forEach((teamId) => teamIds.add(teamId.toString()));
    });

    // Convert Set to an array of ObjectId
    const teamIdsArray = Array.from(teamIds).map((id) =>
      ObjectId.createFromHexString(id)
    );

    // Step 5: Get all teams using the collected team IDs
    const teamsArray = await teamsCollection
      .find({ _id: { $in: teamIdsArray } })
      .toArray();

    // Step 6: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap((team) => team.players);

    // Step 7: Retrieve the player metadata from the playersCollection
    const playersArray = await playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Step 8: Calculate player totals for the tournament
    const tournamentMatchesResults = calculatePlayerTotals(matchesArray);

    // Step 9: Optionally determine the agree evaluation
    if (agreeEvaluationObject) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (
        teamsArray.some(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Team attribute bet
        teamOrPlayerForBet = teamsArray.find(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        );
        actualValue = 0;
        const teamPlayers = playersArray.filter((player) =>
          teamOrPlayerForBet.players
            .map((id) => id.toString())
            .includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = tournamentMatchesResults[player.name];
          if (
            playerResult &&
            selectedAttributeBetType.toLowerCase() in playerResult
          ) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
      }
      // Check if the selected ID corresponds to a player
      else if (
        playersArray.some(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Player attribute bet
        teamOrPlayerForBet = playersArray.find(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        );
        const playerResult = tournamentMatchesResults[teamOrPlayerForBet.name];
        if (
          playerResult &&
          selectedAttributeBetType.toLowerCase() in playerResult
        ) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        throw new Error("Team or player not found");
      }

      // Evaluate the bet
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case "exactly":
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case "more than":
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case "less than":
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error("Invalid bet operator");
        }
      }

      response.agreeEvaluation = agreeEvaluation;
    }

    return response;
  } catch (error) {
    console.error("Error determining tournament outcomes:", error);
    throw new Error("Failed to determine tournament outcomes");
  }
};

const handleTournamentWagers = async (tournamentId) => {
  // console.log("tournamentId: ", tournamentId)

  // Get all wagers associated to this match
  const tournamentWagers = await wagersCollection
    .find({ rlEventReference: tournamentId.toString(), status: "Ongoing" })
    .toArray();

  // console.log("tournamentWagers: ", tournamentWagers)

  const tournamentOutcomes = await getTournamentOutcomes(tournamentId);

  // console.log("tournamentOutcomes: ", tournamentOutcomes)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

  for (const wager of tournamentWagers) {
    if (wager.wagerType === "Tournament Winner") {
      // wager.agreeEvaluation is an Object id of the winning team
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === tournamentOutcomes.winningTeam.toString()
      );
    } else if (wager.wagerType === "Player/Team Attributes") {
      // NOTE: Make wager evaluation a trimmed version of wager.name
      // wager.agreeEvaluation is a string formatted as "Object id of the player/team will have exactly/more than/less than X of the following attributes: Points, Goals, Assists, Shots, Saves, Demos"
      const tournamentOutcomesEval = await getTournamentOutcomes(
        tournamentId,
        wager.agreeEvaluation
      );
      // console.log("tournamentOutcomesEval: ", tournamentOutcomesEval)
      await handleWagerEnded(wager._id, tournamentOutcomesEval.agreeEvaluation);
    }
  }
};

const getSeasonOutcomes = async (seasonId, agreeEvaluationObject = null) => {
  try {
    const response = {
      winningTeam: null,
      agreeEvaluation: null,
    };

    // Step 1: Retrieve the season document
    const seasonDoc = await seasonsCollection.findOne({
      _id: ObjectId.createFromHexString(seasonId),
    });
    if (!seasonDoc) {
      throw new Error("Season not found");
    }

    response.winningTeam = seasonDoc.winner;

    // Step 2: Get all tournaments within the season
    const tournamentsArray = await tournamentsCollection
      .find({ _id: { $in: seasonDoc.tournaments } })
      .toArray();
    const tournamentIds = tournamentsArray.map((tournament) => tournament._id);

    // Step 3: Get all series within the tournaments
    const seriesArray = await seriesCollection
      .find({ tournament: { $in: tournamentIds } })
      .toArray();
    const seriesIds = seriesArray.map((series) => series._id);

    // Step 4: Get all matches for these series
    const matchesArray = await matchesCollection
      .find({ series: { $in: seriesIds } })
      .toArray();

    // Step 5: Collect all unique team IDs from the series documents
    const teamIds = new Set();
    seriesArray.forEach((series) => {
      series.teams.forEach((teamId) => teamIds.add(teamId.toString()));
    });

    // Convert Set to an array of ObjectId
    const teamIdsArray = Array.from(teamIds).map((id) =>
      ObjectId.createFromHexString(id)
    );

    // Step 6: Get all teams using the collected team IDs
    const teamsArray = await teamsCollection
      .find({ _id: { $in: teamIdsArray } })
      .toArray();

    // Step 7: Extract player IDs from the teamsArray
    const playerIds = teamsArray.flatMap((team) => team.players);

    // Step 8: Retrieve the player metadata from the playersCollection
    const playersArray = await playersCollection
      .find({ _id: { $in: playerIds } })
      .toArray();

    // Step 9: Calculate player totals for the season
    const seasonMatchesResults = calculatePlayerTotals(matchesArray);

    // Step 10: Optionally determine the agree evaluation
    if (agreeEvaluationObject) {
      const {
        selectedTeamOrPlayerForBet,
        selectedBetOperator,
        attributeBetInput,
        selectedAttributeBetType,
      } = agreeEvaluationObject;

      let agreeEvaluation = false;

      // Convert attributeBetInput to a number for comparison
      const attributeBetValue = parseInt(attributeBetInput, 10);
      let actualValue = null;

      // Determine if the wager is for a team or a player
      let teamOrPlayerForBet = null;

      // Check if the selected ID corresponds to a team
      if (
        teamsArray.some(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Team attribute bet
        teamOrPlayerForBet = teamsArray.find(
          (team) => team._id.toString() === selectedTeamOrPlayerForBet
        );
        actualValue = 0;
        const teamPlayers = playersArray.filter((player) =>
          teamOrPlayerForBet.players
            .map((id) => id.toString())
            .includes(player._id.toString())
        );

        // Sum the values of the selected attribute for all players on the team
        for (const player of teamPlayers) {
          const playerResult = seasonMatchesResults[player.name];
          if (
            playerResult &&
            selectedAttributeBetType.toLowerCase() in playerResult
          ) {
            actualValue += playerResult[selectedAttributeBetType.toLowerCase()];
          }
        }
      }
      // Check if the selected ID corresponds to a player
      else if (
        playersArray.some(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        )
      ) {
        // Player attribute bet
        teamOrPlayerForBet = playersArray.find(
          (player) => player._id.toString() === selectedTeamOrPlayerForBet
        );
        const playerResult = seasonMatchesResults[teamOrPlayerForBet.name];
        if (
          playerResult &&
          selectedAttributeBetType.toLowerCase() in playerResult
        ) {
          actualValue = playerResult[selectedAttributeBetType.toLowerCase()];
        }
      } else {
        throw new Error("Team or player not found");
      }

      // Evaluate the bet
      if (actualValue !== null) {
        switch (selectedBetOperator) {
          case "exactly":
            agreeEvaluation = actualValue === attributeBetValue;
            break;
          case "more than":
            agreeEvaluation = actualValue > attributeBetValue;
            break;
          case "less than":
            agreeEvaluation = actualValue < attributeBetValue;
            break;
          default:
            throw new Error("Invalid bet operator");
        }
      }

      response.agreeEvaluation = agreeEvaluation;
    }

    return response;
  } catch (error) {
    console.error("Error determining season outcomes:", error);
    throw new Error("Failed to determine season outcomes");
  }
};

const handleSeasonWagers = async (seasonId) => {
  // Get all wagers associated with this season
  const seasonWagers = await wagersCollection
    .find({ rlEventReference: seasonId.toString(), status: "Ongoing" })
    .toArray();

  // console.log("seasonWagers: ", seasonWagers)

  const seasonOutcomes = await getSeasonOutcomes(seasonId);

  // console.log("seasonOutcomes: ", seasonOutcomes)

  // Wager types:
  // Match: "Match Winner", "Match Score", "First Blood", "Match MVP", "Player/Team Attributes"
  // Series: "Series Winner", "Series Score", "First Blood", "Overtime Count", "Player/Team Attributes"
  // Tournament: "Tournament Winner", "Player/Team Attributes", "Player Accolades"
  // Season: "Season Winner", "Player/Team Attributes", "Player Accolades"

  for (const wager of seasonWagers) {
    if (wager.wagerType === "Season Winner") {
      await handleWagerEnded(
        wager._id,
        wager.agreeEvaluation === seasonOutcomes.winningTeam.toString()
      );
    } else if (wager.wagerType === "Player/Team Attributes") {
      const seasonOutcomesEval = await getSeasonOutcomes(
        seasonId,
        wager.agreeEvaluation
      );
      await handleWagerEnded(wager._id, seasonOutcomesEval.agreeEvaluation);
    }
  }
};

const matchConcluded = async (matchId, data) => {
  const { results, firstBlood, wentToOvertime, endTournament, endSeason } =
    data;

  let message = " updated successfully";

  // Find the match by its ID
  const matchDoc = await matchesCollection.findOne({
    _id: ObjectId.createFromHexString(matchId),
  });

  // Find the series by its ID
  const seriesDoc = await seriesCollection.findOne({
    _id: ObjectId.createFromHexString(matchDoc.series),
  });

  const matchOutcomes = await getMatchOutcomes(results, matchDoc.teams);

  // console.log("matchOutcomes: ", matchOutcomes)

  // Build the update object for the match
  const updateData = {
    results: results,
    winner: ObjectId.createFromHexString(matchOutcomes.winningTeam),
    loser: ObjectId.createFromHexString(matchOutcomes.winningTeam),
    firstBlood: firstBlood,
    wentToOvertime: wentToOvertime,
    series: ObjectId.createFromHexString(seriesDoc._id),
    status: "Ended",
  };

  // Update the match in the database
  const updatedMatch = await updateMongoDocument(matchesCollection, matchId, {
    $set: updateData,
  });

  createLog({
    type: "Match Ended",
    matchId: updatedMatch.insertedId,
    matchOutcomes: matchOutcomes,
  });

  message = "Match" + message;

  await handleMatchWagers(
    matchId,
    matchOutcomes,
    firstBlood,
    results,
    matchDoc.teams
  );

  // Update the series document if series has ended with this match

  // Set first blood if it is not set because this would be the first match
  if (seriesDoc.firstBlood === null) {
    await updateMongoDocument(seriesCollection, seriesDoc._id, {
      $set: {
        firstBlood: firstBlood,
      },
    });
  }

  // Get all the matches in the series
  const seriesMatches = await matchesCollection
    .find({
      _id: { $in: seriesDoc.matches }, // Assuming `matches` is an array of match Object IDs in the series
    })
    .toArray();

  // Count the number of wins for each team in the series
  let winnerWinsCount = 0;
  let overtimeCount = 0;
  seriesMatches.forEach((match) => {
    if (
      match.status === "Ended" &&
      match.winner.equals(
        ObjectId.createFromHexString(matchOutcomes.winningTeam)
      )
    ) {
      winnerWinsCount++;
    }
    if (match.status === "Ended" && match.wentToOvertime === true) {
      overtimeCount++;
    }
  });

  // If the winner has won enough matches to win the series, update the series status and declare winner/loser
  if (winnerWinsCount >= seriesDoc.bestOf) {
    message = "Series," + message;
    let seriesUpdateData = {
      status: "Ended",
      winner: ObjectId.createFromHexString(matchOutcomes.winningTeam),
      loser: ObjectId.createFromHexString(matchOutcomes.losingTeam),
      overtimeCount: overtimeCount,
    };
    await updateMongoDocument(seriesCollection, seriesDoc._id, {
      $set: seriesUpdateData,
    });
    createLog({ type: "Series Ended", seriesId: seriesDoc._id });
    await handleSeriesWagers(seriesDoc._id);
  }

  // Update the tournament document if tournament has ended with this match

  // Set status for Tournament if included in request body
  if (endTournament === true) {
    await updateMongoDocument(tournamentsCollection, seriesDoc.tournament, {
      $set: {
        status: "Ended",
        winner: ObjectId.createFromHexString(matchOutcomes.winningTeam),
        loser: ObjectId.createFromHexString(matchOutcomes.losingTeam),
      },
    });
    createLog({ type: "Tournament Ended", tournamentId: seriesDoc.tournament });
    message = "Tournament," + message;
    await handleTournamentWagers(seriesDoc.tournament);
  }

  // Update the season document if season has ended with this match

  // Set status for Season if included in request body
  if (endSeason === true) {
    // Find the season that contains the tournament in its tournaments array
    const seasonDoc = await seasonsCollection.findOne({
      tournaments: {
        $in: [ObjectId.createFromHexString(seriesDoc.tournament)],
      },
    });

    if (seasonDoc) {
      // Update the status of the season to "Ended"
      await updateMongoDocument(seasonsCollection, seasonDoc._id, {
        $set: { status: "Ended", winner: matchOutcomes.winningTeam },
      });
    }
    createLog({ type: "Season Ended", SeasonId: seasonDoc._id });
    message = "Season," + message;
    await handleSeasonWagers(seasonDoc._id);
  }

  return { message: message };
};

module.exports = {
  createMatch,
  getAllMatches,
  getMatchById,
  updateMatch,
  matchConcluded,
  deleteMatch,
};
