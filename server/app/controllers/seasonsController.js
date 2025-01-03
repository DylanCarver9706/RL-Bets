const {
  createSeason,
  getAllSeasons,
  getSeasonById,
  updateSeason,
  deleteSeason,
} = require("../services/seasonsService");

const create = async (req, res, logError) => {
  try {
    const seasonId = await createSeason(req.body);
    res.status(201).json({ message: "Season created successfully", seasonId });
  } catch (error) {
    logError(error);
  }
};

const getAll = async (req, res, logError) => {
  try {
    const seasons = await getAllSeasons();
    res.status(200).json(seasons);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const season = await getSeasonById(req.params.id);
    if (!season) return res.status(404).json({ error: "Season not found" });
    res.status(200).json(season);
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    await updateSeason(req.params.id, req.body);
    res.status(200).json({ message: "Season updated successfully" });
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deleteSeason(req.params.id);
    res.status(200).json({ message: "Season deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { create, getAll, getById, update, remove };
