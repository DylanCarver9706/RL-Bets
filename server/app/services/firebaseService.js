const { bucket } = require("../middlewares/firebaseAdmin");

const uploadImageToFirebase = async (
  file,
  userId,
  userName,
  documentType,
  imageType
) => {
  try {
    const storageBucket = bucket();

    if (!storageBucket) {
      throw new Error("Firebase Storage bucket is not initialized");
    }

    // ✅ Generate a properly formatted file name
    const fileName = `Identity_Verification_Documents/${userName}_${userId}/${documentType}/${imageType}_${file.originalname}`;
    const fileUpload = storageBucket.file(fileName);

    // ✅ Upload file stream
    const blobStream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    return new Promise((resolve, reject) => {
      blobStream.on("error", (error) => reject(error));

      blobStream.on("finish", async () => {
        const downloadURL = `https://storage.googleapis.com/${storageBucket.name}/${fileName}`;
        resolve(downloadURL);
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error("Error uploading file to Firebase:", error);
    throw new Error("Failed to upload file to Firebase");
  }
};

const listIdentityVerificationImages = async () => {
  try {
    const storageBucket = bucket();

    const [files] = await storageBucket.getFiles({
      prefix: "Identity_Verification_Documents/",
    });

    if (!files.length) {
      return { message: "No identity verification images found", images: [] };
    }

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const [signedUrl] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60 * 24, // 24-hour expiry
        });
        return { name: file.name, url: signedUrl };
      })
    );

    return {
      message: "Identity verification images retrieved successfully",
      images: imageUrls,
    };
  } catch (error) {
    console.error("Error listing identity verification images:", error);
    throw new Error("Failed to retrieve identity verification images");
  }
};

const deleteIdentityVerificationFiles = async (userId, userName) => {
    try {
      const storageBucket = bucket();
  
      if (!storageBucket) {
        throw new Error("Firebase Storage bucket is not initialized");
      }
  
      const userDirectory = `Identity_Verification_Documents/${userName}_${userId}/`;
  
      // ✅ Get all files under the user directory
      const [files] = await storageBucket.getFiles({ prefix: userDirectory });
  
      if (files.length === 0) {
        return { message: "No files found for this user." };
      }
  
      // ✅ Delete all files
      await Promise.all(files.map(file => file.delete()));
  
      return { message: `All identity verification files for ${userName} have been deleted.` };
    } catch (error) {
      console.error("Error deleting identity verification files:", error);
      throw new Error("Failed to delete identity verification files");
    }
};

module.exports = { uploadImageToFirebase, listIdentityVerificationImages, deleteIdentityVerificationFiles };
