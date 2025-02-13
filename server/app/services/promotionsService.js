// app/services/promotionsService.js
const { collections } = require("../../database/mongoCollections");
const { ObjectId } = require("mongodb");
const { createMongoDocument, updateMongoDocument } = require("../../database/middlewares/mongo");
const { getUserById } = require("./usersService");

const getAllPromotions = async () => {
  return await collections.promotionsCollection.find().toArray();
};

const getPromotionById = async (id) => {
  return await collections.promotionsCollection.findOne({ _id: ObjectId.createFromHexString(id) });
};

const getPromotionByType = async (type) => {
  return await collections.promotionsCollection.findOne({ name: type });
};

const createPromotion = async (promotionData) => {
  return await createMongoDocument(collections.promotionsCollection, promotionData, true);
};

const updatePromotion = async (id, updateData) => {
  return await updateMongoDocument(collections.promotionsCollection, id, { $set: updateData }, true);
};

const deletePromotion = async (id) => {
  const result = await collections.promotionsCollection.deleteOne({ _id: ObjectId.createFromHexString(id) });
  if (result.deletedCount === 0) throw new Error("Promotion not found");
};

const redeemPromotion = async (promotionType, userId, meta) => {
  console.log("redeemPromotion called with promotionType:", promotionType, "userId:", userId.toString(), "meta:", meta);
  const promotion = await getPromotionByType(promotionType);
  if (!promotion) throw new Error("Promotion not found");
    
    // Check if the promotion has expired
    if (promotion.endDate < new Date()) {
      throw new Error("Promotion has expired");
    }

    // If the userId is in the promotion.userIdsClaimed array, return an error
    if (promotion.userIdsClaimed.includes(userId)) {
      throw new Error("User has already claimed this promotion");
    }

    if (promotion.name === "Referred User") {

        const newUserId = userId
        if (!newUserId) {
          throw new Error("New user id not found");
        }
        
        // if newUserId is not in the given meta object, return an error
        if (!meta.existingUserId) {
          throw new Error("Existing user id not found");
        }
        
        // Update the redeem user object with the promotional credits
        existingUserObject = await getUserById(meta.existingUserId);
        if (existingUserObject) {
            if (existingUserObject.accountStatus !== "active") {
              throw new Error("Existing user account is not active");
            }
            await updateMongoDocument(collections.usersCollection, meta.existingUserId, { $set: { credits: (existingUserObject.credits + promotion.promotionalCredits) } });
        } else {
          throw new Error("Existing user id not found");
        }

        // Update the promotion object with the new user id added to the userIdsClaimed array
        await updateMongoDocument(collections.promotionsCollection, promotion._id.toString(), { $push: { userIdsClaimed: newUserId } });
    }

}


module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  redeemPromotion,
};
