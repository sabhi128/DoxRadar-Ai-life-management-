const { GoogleGenerativeAI } = require("@google/generative-ai");

// Map extensions to MIME types manually if needed, or use a library
const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case ".pdf": return "application/pdf";
        case ".jpg":
        case ".jpeg": return "image/jpeg";
        case ".png": return "image/png";
        case ".webp": return "image/webp";
        default: return "application/octet-stream";
    }
};

const analyzeDocument = async (fileBuffer, mimeType) => {
    // Models to try in order of preference/speed/cost
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash-001",
        "gemini-1.5-pro-001"
    ];

    let lastError = null;

    for (const modelName of models) {
        try {
            console.log(`Attempting AI analysis with model: ${modelName}`);
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: modelName });

            const base64Data = fileBuffer.toString("base64");

            const prompt = `
                Analyze the attached document and extract key intelligence.
                Return a purely JSON object (no markdown formatting) with the following structure:
                {
                    "summary": "Plain language summary of the document (max 2 sentences)",
                    "expiryDate": "YYYY-MM-DDT00:00:00.000Z or null",
                    "renewalDate": "YYYY-MM-DDT00:00:00.000Z or null",
                    "risks": ["Risk 1", "Risk 2"],
                    "tags": ["Tag1", "Tag2"]
                }
                If a date is not found, return null. Identify important risks or obligations.
            `;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType,
                    },
                },
            ]);

            const response = await result.response;
            let text = response.text();

            // Clean markdown code blocks if present
            text = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const data = JSON.parse(text);

            return { ...data, status: 'Completed', usedModel: modelName };

        } catch (error) {
            console.error(`Gemini Analysis Failed with ${modelName}:`, error.message);
            lastError = error;
            // Continue to next model
        }
    }

    // If all models failed
    if (lastError && lastError.response) {
        console.error("Gemini Final Error Details:", JSON.stringify(lastError.response, null, 2));
    }

    return {
        status: 'Failed',
        // Return actual error message to UI for debugging
        summary: `AI Analysis failed after trying multiple models. Last error: ${lastError?.message || "Unknown error"}`,
        risks: [],
        tags: []
    };
};

module.exports = { analyzeDocument };
