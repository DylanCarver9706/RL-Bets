const {
    createSeries,
    getAllSeries,
    getSeriesById,
    updateSeries,
    deleteSeries,
  } = require("../services/seriesService");
  
  const create = async (req, res) => {
    try {
      const result = await createSeries(req.body);
      res.status(201).json({ message: "Series created successfully", ...result });
    } catch (error) {
      res.status(500).json({ error: "Failed to create series", details: error.message });
    }
  };
  
  const getAll = async (req, res) => {
    try {
      const series = await getAllSeries();
      res.status(200).json(series);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch series", details: error.message });
    }
  };
  
  const getById = async (req, res) => {
    try {
      const series = await getSeriesById(req.params.id);
      if (!series) return res.status(404).json({ error: "Series not found" });
      res.status(200).json(series);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch series", details: error.message });
    }
  };
  
  const update = async (req, res) => {
    try {
      await updateSeries(req.params.id, req.body);
      res.status(200).json({ message: "Series updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update series", details: error.message });
    }
  };
  
  const remove = async (req, res) => {
    try {
      await deleteSeries(req.params.id);
      res.status(200).json({ message: "Series deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete series", details: error.message });
    }
  };
  
  module.exports = { create, getAll, getById, update, remove };
  