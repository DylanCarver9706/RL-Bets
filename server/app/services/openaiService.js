const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ **Encode Image Buffer to Base64**
const encodeImageToBase64 = (imageBuffer) => {
  try {
    return imageBuffer.toString("base64");
  } catch (error) {
    console.error("Error encoding image:", error);
    throw new Error("Failed to encode image.");
  }
};

// ✅ **Analyze Image with OpenAI**
const analyzeImageWithOpenAI = async (imageBuffer, prompt) => {
  try {
    const base64Image = encodeImageToBase64(imageBuffer);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content || "No response from OpenAI";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image.");
  }
};

module.exports = { analyzeImageWithOpenAI };
