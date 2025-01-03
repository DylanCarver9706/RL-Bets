const {
  createSeries,
  getAllSeries,
  getSeriesById,
  updateSeries,
  deleteSeries,
} = require("../services/seriesService");

const create = async (req, res, logError) => {
  try {
    const result = await createSeries(req.body);
    res.status(201).json({ message: "Series created successfully", ...result });
  } catch (error) {
    logError(error);
  }
};

const getAll = async (req, res, logError) => {
  try {
    const series = await getAllSeries();
    res.status(200).json(series);
  } catch (error) {
    logError(error);
  }
};

const getById = async (req, res, logError) => {
  try {
    const series = await getSeriesById(req.params.id);
    if (!series) return res.status(404).json({ error: "Series not found" });
    res.status(200).json(series);
  } catch (error) {
    logError(error);
  }
};

const update = async (req, res, logError) => {
  try {
    await updateSeries(req.params.id, req.body);
    res.status(200).json({ message: "Series updated successfully" });
  } catch (error) {
    logError(error);
  }
};

const remove = async (req, res, logError) => {
  try {
    await deleteSeries(req.params.id);
    res.status(200).json({ message: "Series deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = { create, getAll, getById, update, remove };
