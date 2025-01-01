const { ObjectId } = require("mongodb");
const { collections } = require("../../database/mongoCollections");

const getAllSeasonsDataTree = async () => {
  // Fetch all season documents
  const seasons = await collections.seasonsCollection.find().toArray();

  // Iterate over each season to construct a complete data tree
  const seasonsWithData = await Promise.all(
    seasons.map(async (season) => {
      // Add type to season
      season.type = "season";

      // Convert season.tournaments IDs to ObjectId if they are strings
      season.tournaments = season.tournaments.map((id) =>
        typeof id === "string" ? ObjectId.createFromHexString(id) : id
      );

      // Fetch the tournaments related to this season
      const tournaments = await collections.tournamentsCollection
        .find({ _id: { $in: season.tournaments } })
        .toArray();

      // Add type to each tournament
      const tournamentsWithType = tournaments.map((tournament) => ({
        ...tournament,
        type: "tournament",
      }));

      // Fetch all series for the tournaments
      const tournamentIds = tournamentsWithType.map(
        (tournament) => tournament._id
      );
      const seriesList = await collections.seriesCollection
        .find({
          tournament: {
            $in: tournamentIds.map((id) =>
              typeof id === "string" ? ObjectId.createFromHexString(id) : id
            ),
          },
        })
        .toArray();

      // Add type to each series
      const seriesWithType = seriesList.map((series) => ({
        ...series,
        type: "series",
      }));

      // Fetch all matches for the series
      const seriesIds = seriesWithType.map((series) => series._id);
      const matches = await collections.matchesCollection
        .find({
          series: {
            $in: seriesIds.map((id) =>
              typeof id === "string" ? ObjectId.createFromHexString(id) : id
            ),
          },
        })
        .toArray();

      // Add type to each match
      const matchesWithType = matches.map((match) => ({
        ...match,
        type: "match",
      }));

      // Fetch all teams for the series and matches
      const matchTeamIds = matchesWithType.flatMap((match) =>
        match.teams.map((id) =>
          typeof id === "string" ? ObjectId.createFromHexString(id) : id
        )
      );
      const seriesTeamIds = seriesWithType.flatMap((series) =>
        series.teams.map((id) =>
          typeof id === "string" ? ObjectId.createFromHexString(id) : id
        )
      );
      const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])]; // Unique list of all team IDs

      const teams = await collections.teamsCollection
        .find({ _id: { $in: allTeamIds } })
        .toArray();

      // Add type to each team
      const teamsWithType = teams.map((team) => ({
        ...team,
        type: "team",
      }));

      // Fetch all players for the teams
      const playerIds = teams.flatMap((team) =>
        team.players.map((id) =>
          typeof id === "string" ? ObjectId.createFromHexString(id) : id
        )
      );
      const players = await collections.playersCollection
        .find({ _id: { $in: playerIds } })
        .toArray();

      // Add type to each player
      const playersWithType = players.map((player) => ({
        ...player,
        type: "player",
      }));

      // Map teams with their respective players
      const teamsWithPlayers = teamsWithType.map((team) => ({
        ...team,
        players: playersWithType.filter((player) =>
          player.team.equals(team._id)
        ), // Populate players in the team
      }));

      // Map matches with their respective teams and players
      const matchesWithTeams = matchesWithType.map((match) => ({
        ...match,
        teams: teamsWithPlayers.filter((team) =>
          match.teams.some((t) =>
            typeof t === "string"
              ? ObjectId.createFromHexString(t).equals(team._id)
              : t.equals(team._id)
          )
        ), // Populate teams in the match
      }));

      // Map series with their respective matches and teams
      const seriesWithMatches = seriesWithType.map((series) => ({
        ...series,
        teams: teamsWithPlayers.filter((team) =>
          series.teams.some((t) =>
            typeof t === "string"
              ? ObjectId.createFromHexString(t).equals(team._id)
              : t.equals(team._id)
          )
        ), // Populate teams in the series
        matches: matchesWithTeams.filter((match) =>
          typeof match.series === "string"
            ? ObjectId.createFromHexString(match.series).equals(series._id)
            : match.series.equals(series._id)
        ), // Populate matches in the series
      }));

      // Map tournaments with their respective series
      const tournamentsWithSeries = tournamentsWithType.map((tournament) => ({
        ...tournament,
        series: seriesWithMatches.filter((series) =>
          typeof series.tournament === "string"
            ? ObjectId.createFromHexString(series.tournament).equals(
                tournament._id
              )
            : series.tournament.equals(tournament._id)
        ), // Populate series in the tournament
      }));

      // Construct the complete season object with type
      return {
        ...season,
        tournaments: tournamentsWithSeries,
      };
    })
  );

  return seasonsWithData;
};

const getSeasonDataTree = async (seasonId) => {
  // Fetch the season document
  const season = await collections.seasonsCollection.findOne({
    _id: ObjectId.createFromHexString(seasonId),
  });

  // Fetch the tournaments related to this season
  const tournaments = await collections.tournamentsCollection
    .find({ _id: { $in: season.tournaments } })
    .toArray();

  // Fetch all series for the tournaments
  const seriesList = await collections.seriesCollection
    .find({ tournament: { $in: season.tournaments } })
    .toArray();

  // Fetch all matches for the series
  const seriesIds = seriesList.map((series) => series._id);
  const matches = await collections.matchesCollection
    .find({ series: { $in: seriesIds } })
    .toArray();

  // Fetch all teams for the series and matches
  const matchTeamIds = matches.flatMap((match) => match.teams);
  const seriesTeamIds = seriesList.flatMap((series) => series.teams);
  const allTeamIds = [...new Set([...matchTeamIds, ...seriesTeamIds])]; // Unique list of all team IDs
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
    players: players.filter((player) => player.team.equals(team._id)), // Populate players in the team
  }));

  // Map matches with their respective teams and players
  const matchesWithTeams = matches.map((match) => ({
    ...match,
    teams: teamsWithPlayers.filter((team) =>
      match.teams.some((t) => t.equals(team._id))
    ), // Populate teams in the match
  }));

  // Map series with their respective matches and teams
  const seriesWithMatches = seriesList.map((series) => ({
    ...series,
    teams: teamsWithPlayers.filter((team) =>
      series.teams.some((t) => t.equals(team._id))
    ), // Populate teams in the series
    matches: matchesWithTeams.filter((match) =>
      match.series.equals(series._id)
    ), // Populate matches in the series
  }));

  // Map tournaments with their respective series
  const tournamentsWithSeries = tournaments.map((tournament) => ({
    ...tournament,
    series: seriesWithMatches.filter((series) =>
      series.tournament.equals(tournament._id)
    ), // Populate series in the tournament
  }));

  // Construct the complete season object
  const seasonWithTournaments = {
    ...season,
    tournaments: tournamentsWithSeries,
  };

  return seasonWithTournaments;
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

const getBetableDataTree = async () => {
  // Fetch all betable matches
  const betableMatches = await collections.matchesCollection
    .find({ status: "Betable" })
    .toArray();

  const seriesIds = betableMatches.map((match) => match.series);

  // Fetch the series for the betable matches
  const betableSeries = await collections.seriesCollection
    .find({
      $or: [{ status: "Betable" }, { _id: { $in: seriesIds } }],
    })
    .toArray();

  const tournamentIds = betableSeries.map((series) => series.tournament);

  // Fetch the tournaments for the betable series
  const betableTournaments = await collections.tournamentsCollection
    .find({
      $or: [{ status: "Betable" }, { _id: { $in: tournamentIds } }],
    })
    .toArray();

  const seasonIds = betableTournaments.map((tournament) => tournament.season);

  // Fetch the seasons for the betable tournaments
  const betableSeasons = await collections.seasonsCollection
    .find({
      $or: [{ status: "Betable" }, { _id: { $in: seasonIds } }],
    })
    .toArray();

  // Fetch all teams related to the betable matches and series
  const allTeamIds = [
    ...new Set(
      betableMatches
        .flatMap((match) => match.teams)
        .concat(betableSeries.flatMap((series) => series.teams))
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
  const matchesWithTeams = betableMatches.map((match) => ({
    ...match,
    teams: teamsWithPlayers.filter((team) =>
      match.teams.some((t) => t.equals(team._id))
    ),
  }));

  // Map series with their matches and teams
  const seriesWithMatches = betableSeries.map((series) => ({
    ...series,
    matches: matchesWithTeams.filter((match) =>
      match.series.equals(series._id)
    ),
    teams: teamsWithPlayers.filter((team) =>
      series.teams.some((t) => t.equals(team._id))
    ),
  }));

  // Map tournaments with their series
  const tournamentsWithSeries = betableTournaments.map((tournament) => ({
    ...tournament,
    series: seriesWithMatches.filter((series) =>
      series.tournament.equals(tournament._id)
    ),
  }));

  // Map seasons with their tournaments
  const seasonsWithTournaments = betableSeasons.map((season) => ({
    ...season,
    tournaments: tournamentsWithSeries.filter((tournament) =>
      tournament.season.equals(season._id)
    ),
  }));

  return seasonsWithTournaments;
};

// Similar logic for other methods like getSeasonById, getTournamentById, etc.

module.exports = {
  getAllSeasonsDataTree,
  getSeasonDataTree,
  getTournamentDataTree,
  getSeriesDataTree,
  getBetableDataTree,
};
