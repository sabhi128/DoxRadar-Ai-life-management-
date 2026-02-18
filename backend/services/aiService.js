// Direct REST API calls instead of SDK (SDK has quota issues)
const MAX_FILE_SIZE = 500 * 1024; // 500KB

const analyzeDocument = async (fileBuffer, mimeType) => {
    // Skip AI for very large files
    if (fileBuffer.length > MAX_FILE_SIZE) {
        console.log(`File too large for AI (${(fileBuffer.length / 1024).toFixed(0)}KB). Skipping.`);
        return {
            status: 'Skipped',
            summary: "File too large for AI analysis. Upload a smaller file (under 500KB) for AI insights.",
            risks: [],
            tags: []
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY not set");
        return { status: 'Failed', summary: "AI not configured.", risks: [], tags: [] };
    }

    try {
        console.log("Attempting AI analysis with direct REST API (gemini-2.0-flash)");

        const base64Data = fileBuffer.toString("base64");

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: `Analyze this document briefly. Return JSON only (no markdown):
{"summary":"2 sentence summary","expiryDate":"YYYY-MM-DD or null","renewalDate":"YYYY-MM-DD or null","risks":["risk1"],"tags":["tag1"]}`
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ]
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Gemini API Error (${response.status}):`, errorData);

            if (response.status === 429) {
                return {
                    status: 'QuotaExceeded',
                    summary: "AI quota exceeded. Please try again in a minute.",
                    risks: [],
                    tags: []
                };
            }

            throw new Error(`API returned ${response.status}: ${errorData.substring(0, 200)}`);
        }

        const data = await response.json();

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error("No text in API response");
        }

        // Clean markdown code blocks if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(text);
        console.log("AI Analysis completed successfully!");
        return { ...parsed, status: 'Completed' };

    } catch (error) {
        console.error("Gemini Analysis Failed:", error.message);
        return {
            status: 'Failed',
            summary: `AI Analysis failed: ${error.message}`,
            risks: [],
            tags: []
        };
    }
};

module.exports = { analyzeDocument };
