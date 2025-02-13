const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const {
  createMongoDocument,
  updateMongoDocument,
} = require("../../database/middlewares/mongo");

const getAllProducts = async () => {
  return await collections.productsCollection.find().toArray();
};

const getProductById = async (id) => {
  return await collections.productsCollection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
};

const createProduct = async (productData) => {
  return await createMongoDocument(collections.productsCollection, productData, true);
};

const updateProduct = async (id, updateData) => {
  return await updateMongoDocument(collections.productsCollection, id, {
    $set: updateData,
  }, true);
};

const deleteProduct = async (id) => {
  const result = await collections.productsCollection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });

  if (result.deletedCount === 0) {
    throw new Error("Product not found");
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
