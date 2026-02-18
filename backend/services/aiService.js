const pdfParse = require('pdf-parse');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const analyzeDocument = async (fileBuffer, mimeType) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log(`OpenRouter API key present: ${!!apiKey}, prefix: ${apiKey ? apiKey.substring(0, 15) + '...' : 'NONE'}, length: ${apiKey?.length || 0}`);
    if (!apiKey) {
        console.error("OPENROUTER_API_KEY not set");
        return { status: 'Failed', summary: "AI not configured.", risks: [], tags: [] };
    }

    try {
        // Extract text from the file
        let documentText = '';

        if (mimeType === 'application/pdf') {
            try {
                const pdfData = await pdfParse(fileBuffer);
                documentText = pdfData.text || '';
                console.log(`PDF text extracted: ${documentText.length} chars`);
            } catch (pdfErr) {
                console.error("PDF parse error:", pdfErr.message);
                documentText = '';
            }
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

        // If PDF extraction failed or got minimal text, try raw buffer as text
        if (documentText.trim().length < 50) {
            console.log("PDF text extraction got minimal text, trying raw buffer...");
            const rawText = fileBuffer.toString('utf-8');
            // Extract readable text from raw buffer (filter out binary garbage)
            const readable = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ').trim();
            if (readable.length > documentText.trim().length) {
                documentText = readable;
                console.log(`Raw extraction got: ${documentText.length} chars`);
            }
        }

        if (!documentText || documentText.trim().length < 20) {
            return {
                status: 'Skipped',
                summary: "Could not extract enough text from this document for analysis.",
                risks: [],
                tags: []
            };
        }

        // Truncate to save tokens (first 3000 chars)
        const truncatedText = documentText.substring(0, 3000);

        console.log(`Sending ${truncatedText.length} chars to OpenRouter for analysis...`);

        // Add 30 second timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://doxradar.app',
                'X-Title': 'DoxRadar AI Life Manager'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct:free',
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
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

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
        console.log("OpenRouter raw response:", JSON.stringify(data).substring(0, 300));

        let text = data.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error("No response from OpenRouter");
        }

        // Clean markdown code blocks if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const parsed = JSON.parse(text);
        console.log("AI Analysis completed successfully!");
        return { ...parsed, status: 'Completed' };

    } catch (error) {
        const msg = error.name === 'AbortError'
            ? 'AI request timed out after 30 seconds'
            : error.message;
        console.error("OpenRouter Analysis Failed:", msg);
        return {
            status: 'Failed',
            summary: `AI Analysis failed: ${msg}`,
            risks: [],
            tags: []
        };
    }
};

module.exports = { analyzeDocument };
