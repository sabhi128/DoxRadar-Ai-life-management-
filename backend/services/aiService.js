const pdfParse = require('pdf-parse');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const analyzeDocument = async (fileBuffer, mimeType) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("OPENROUTER_API_KEY not set");
        return { status: 'Failed', summary: "AI not configured.", risks: [], tags: [] };
    }

    try {
        // Extract text from the file
        let documentText = '';

        if (mimeType === 'application/pdf') {
            const pdfData = await pdfParse(fileBuffer);
            documentText = pdfData.text;
        } else if (mimeType?.startsWith('image/')) {
            return {
                status: 'Skipped',
                summary: "Image files cannot be analyzed as text. Upload a PDF or text document.",
                risks: [],
                tags: []
            };
        } else {
            documentText = fileBuffer.toString('utf-8');
        }

        if (!documentText || documentText.trim().length < 10) {
            return {
                status: 'Skipped',
                summary: "Could not extract meaningful text from this document.",
                risks: [],
                tags: []
            };
        }

        // Truncate to save tokens (first 3000 chars)
        const truncatedText = documentText.substring(0, 3000);

        console.log(`Attempting AI analysis with OpenRouter (${truncatedText.length} chars)`);

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://doxradar.app',
                'X-Title': 'DoxRadar AI Life Manager'
            },
            body: JSON.stringify({
                model: 'deepseek/deepseek-chat-v3-0324:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You analyze documents and return JSON only. No markdown, no explanation.'
                    },
                    {
                        role: 'user',
                        content: `Analyze this document text and return JSON only:
{"summary":"2 sentence summary","expiryDate":"YYYY-MM-DD or null","renewalDate":"YYYY-MM-DD or null","risks":["risk1"],"tags":["tag1"]}

Document text:
${truncatedText}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenRouter API Error (${response.status}):`, errorText);
            return {
                status: 'Failed',
                summary: `AI Analysis failed (${response.status}): ${errorText.substring(0, 150)}`,
                risks: [],
                tags: []
            };
        }

        const data = await response.json();
        let text = data.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error("No response from OpenRouter");
        }

        // Clean markdown code blocks if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(text);
        console.log("AI Analysis completed successfully with OpenRouter!");
        return { ...parsed, status: 'Completed' };

    } catch (error) {
        console.error("OpenRouter Analysis Failed:", error.message);
        return {
            status: 'Failed',
            summary: `AI Analysis failed: ${error.message}`,
            risks: [],
            tags: []
        };
    }
};

module.exports = { analyzeDocument };
