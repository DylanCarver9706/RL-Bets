const { analyzeImageWithOpenAI } = require("../services/openaiService");

const processImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // ✅ **Pass image buffer instead of file path**
    const analysisResult = await analyzeImageWithOpenAI(req.file.buffer, req.body.prompt);
    console.log("Analysis Result:", analysisResult);

    res.json({ result: analysisResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { processImage };

