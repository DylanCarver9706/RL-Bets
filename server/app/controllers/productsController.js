const productsService = require("../services/productsService");

const getAllProducts = async (req, res, logError) => {
  try {
    const products = await productsService.getAllProducts();
    res.status(200).json(products);
  } catch (error) {
    logError(error);
  }
};

const getProductById = async (req, res, logError) => {
  try {
    const product = await productsService.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    logError(error);
  }
};

const createProduct = async (req, res, logError) => {
  try {
    const newProduct = await productsService.createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    logError(error);
  }
};

const updateProduct = async (req, res, logError) => {
  try {
    const updatedProduct = await productsService.updateProduct(
      req.params.id,
      req.body
    );
    res.status(200).json(updatedProduct);
  } catch (error) {
    logError(error);
  }
};

const deleteProduct = async (req, res, logError) => {
  try {
    await productsService.deleteProduct(req.params.id);
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    logError(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
