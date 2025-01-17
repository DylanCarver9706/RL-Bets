const { ObjectId } = require("mongodb");
const { collections } = require("../../database/mongoCollections");

const getAllTournamentsDataTree = async () => {
  // Fetch all tournaments
  const tournaments = await collections.tournamentsCollection.find().toArray();

  // Fetch all series for all tournaments
  const tournamentIds = tournaments.map((tournament) => tournament._id);
  const seriesList = await collections.seriesCollection
    .find({ tournament: { $in: tournamentIds } })
    .toArray();

  // Fetch all matches for the series
  const seriesIds = seriesList.map((series) => series._id);
  const matches = await collections.matchesCollection
    .find({ series: { $in: seriesIds } })
    .toArray();

  // Fetch all teams for the series and matches
  const matchTeamIds = matches.flatMap((match) => match.teams);
  const seriesTeamIds = seriesList.flatMap((series) => series.teams);
  const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])];
  const teams = await collections.teamsCollection
    .find({ _id: { $in: allTeamIds } })
    .toArray();

  // Fetch all players for the teams
  const playerIds = teams.flatMap((team) => team.players);
  const players = await collections.playersCollection
    .find({ _id: { $in: playerIds } })
    .toArray();

  // Map teams with their respective players
  const teamsWithPlayers = teams.map((team) => ({
    ...team,
    players: players.filter((player) => player.team.equals(team._id)),
  }));

  // Map matches with their respective teams and players
  const matchesWithTeams = matches.map((match) => ({
    ...match,
    teams: teamsWithPlayers.filter((team) =>
      match.teams.some((t) => t.equals(team._id))
    ),
  }));

  // Map series with their respective matches and teams
  const seriesWithMatches = seriesList.map((series) => ({
    ...series,
    teams: teamsWithPlayers.filter((team) =>
      series.teams.some((t) => t.equals(team._id))
    ),
    matches: matchesWithTeams.filter((match) =>
      match.series.equals(series._id)
    ),
  }));

  // Construct the complete tournaments data tree
  const tournamentsDataTree = tournaments.map((tournament) => ({
    ...tournament,
    series: seriesWithMatches.filter((series) =>
      series.tournament.equals(tournament._id)
    ),
  }));

  return tournamentsDataTree;
};

const getTournamentDataTree = async (tournamentId) => {
  // Fetch the tournament document
  const tournament = await collections.tournamentsCollection.findOne({
    _id: ObjectId.createFromHexString(tournamentId),
  });

  // Fetch all series for this tournament
  const seriesList = await collections.seriesCollection
    .find({ tournament: tournament._id })
    .toArray();

  // Fetch all matches for the series
  const seriesIds = seriesList.map((series) => series._id);
  const matches = await collections.matchesCollection
    .find({ series: { $in: seriesIds } })
    .toArray();

  // Fetch all teams for the series and matches
  const matchTeamIds = matches.flatMap((match) => match.teams);
  const seriesTeamIds = seriesList.flatMap((series) => series.teams);
  const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])];
  const teams = await collections.teamsCollection
    .find({ _id: { $in: allTeamIds } })
    .toArray();

  // Fetch all players for the teams
  const playerIds = teams.flatMap((team) => team.players);
  const players = await collections.playersCollection
    .find({ _id: { $in: playerIds } })
    .toArray();

  // Map teams with their respective players
  const teamsWithPlayers = teams.map((team) => ({
    ...team,
    players: players.filter((player) => player.team.equals(team._id)),
  }));

  // Map matches with their respective teams and players
  const matchesWithTeams = matches.map((match) => ({
    ...match,
    teams: teamsWithPlayers.filter((team) =>
      match.teams.some((t) => t.equals(team._id))
    ),
  }));

  // Map series with their respective matches and teams
  const seriesWithMatches = seriesList.map((series) => ({
    ...series,
    teams: teamsWithPlayers.filter((team) =>
      series.teams.some((t) => t.equals(team._id))
    ),
    matches: matchesWithTeams.filter((match) =>
      match.series.equals(series._id)
    ),
  }));

  // Construct the complete tournament object
  const tournamentWithSeries = {
    ...tournament,
    series: seriesWithMatches,
  };

  return tournamentWithSeries;
};

const getSeriesDataTree = async (seriesId) => {
  // Fetch the series document
  const series = await collections.seriesCollection.findOne({
    _id: ObjectId.createFromHexString(seriesId),
  });

  // Fetch all matches for this series
  const matches = await collections.matchesCollection
    .find({ series: series._id })
    .toArray();

  // Fetch all teams for the series and matches
  const matchTeamIds = matches.flatMap((match) => match.teams);
  const seriesTeamIds = series.teams || [];
  const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])];
  const teams = await collections.teamsCollection
    .find({ _id: { $in: allTeamIds } })
    .toArray();

  // Fetch all players for the teams
  const playerIds = teams.flatMap((team) => team.players);
  const players = await collections.playersCollection
    .find({ _id: { $in: playerIds } })
    .toArray();

  // Map teams with their respective players
  const teamsWithPlayers = teams.map((team) => ({
    ...team,
    players: players.filter((player) => player.team.equals(team._id)),
  }));

  // Map matches with their respective teams and players
  const matchesWithTeams = matches.map((match) => ({
    ...match,
    teams: teamsWithPlayers.filter((team) =>
      match.teams.some((t) => t.equals(team._id))
    ),
  }));

  // Construct the complete series object
  const seriesWithMatches = {
    ...series,
    teams: teamsWithPlayers,
    matches: matchesWithTeams,
  };

  return seriesWithMatches;
};

const getBettableDataTree = async () => {
  // Fetch all Bettable matches
  const bettableMatches = await collections.matchesCollection
    .find({ status: "Bettable" })
    .toArray();

  const seriesIds = bettableMatches.map((match) => match.series);

  // Fetch the series for the Bettable matches
  const bettableSeries = await collections.seriesCollection
    .find({
      $or: [{ status: "Bettable" }, { _id: { $in: seriesIds } }],
    })
    .toArray();

  const tournamentIds = bettableSeries.map((series) => series.tournament);

  // Fetch the tournaments for the Bettable series
  const bettableTournaments = await collections.tournamentsCollection
    .find({
      $or: [{ status: "Bettable" }, { _id: { $in: tournamentIds } }],
    })
    .toArray();

  // Fetch all teams related to the Bettable matches and series
  const allTeamIds = [
    ...new Set(
      bettableMatches.flatMap((match) => match.teams).concat(
        bettableSeries.flatMap((series) => series.teams)
      )
    ),
  ];

  const teams = await collections.teamsCollection
    .find({ _id: { $in: allTeamIds } })
    .toArray();

  // Fetch all players from the fetched teams
  const playerIds = teams.flatMap((team) => team.players);

  const players = await collections.playersCollection
    .find({ _id: { $in: playerIds } })
    .toArray();

  // Map teams with their players
  const teamsWithPlayers = teams.map((team) => ({
    ...team,
    players: players.filter((player) => player.team.equals(team._id)),
  }));

  // Map matches with their teams
  const matchesWithTeams = bettableMatches.map((match) => ({
    ...match,
    teams: teamsWithPlayers.filter((team) =>
      match.teams.some((t) => t.equals(team._id))
    ),
  }));

  // Map series with their matches and teams
  const seriesWithMatches = bettableSeries.map((series) => ({
    ...series,
    matches: matchesWithTeams.filter((match) =>
      match.series.equals(series._id)
    ),
    teams: teamsWithPlayers.filter((team) =>
      series.teams.some((t) => t.equals(team._id))
    ),
  }));

  // Map tournaments with their series
  const tournamentsWithSeries = bettableTournaments.map((tournament) => ({
    ...tournament,
    series: seriesWithMatches.filter((series) =>
      series.tournament.equals(tournament._id)
    ),
  }));

  return tournamentsWithSeries;
};

module.exports = {
  getAllTournamentsDataTree,
  getTournamentDataTree,
  getSeriesDataTree,
  getBettableDataTree,
};
