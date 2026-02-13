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
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Updated model to one confirmed in the user's list
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

        return { ...data, status: 'Completed' };
    } catch (error) {
        console.error("Gemini Analysis Failed:", error);
        if (error.response) {
            console.error("Gemini Error Details:", JSON.stringify(error.response, null, 2));
        }
        return {
            status: 'Failed',
            summary: "AI Analysis failed to process this document.",
            risks: [],
            tags: []
        };
    }
};

module.exports = { analyzeDocument };
