const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Categories the AI can assign
const VALID_CATEGORIES = [
    'Contract', 'Insurance', 'ID', 'Bill', 'Legal',
    'Medical', 'Financial', 'Personal', 'Certificate', 'Subscription', 'Other'
];

// Log API key status at module load (helps debug Vercel env issues)
console.log(`[aiService] OPENAI_API_KEY loaded: ${!!process.env.OPENAI_API_KEY} (length: ${process.env.OPENAI_API_KEY?.length || 0})`);
console.log(`[aiService] OPENROUTER_API_KEY loaded: ${!!process.env.OPENROUTER_API_KEY} (length: ${process.env.OPENROUTER_API_KEY?.length || 0})`);

const analyzeDocument = async (fileBuffer, mimeType) => {
    const openaiKey = process.env.OPENAI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!openaiKey && !openrouterKey) {
        console.error("No AI API keys set.");
        return { status: 'Failed', summary: "AI not configured.", risks: [], tags: [] };
    }

    const useOpenAI = !!openaiKey;
    const apiKey = useOpenAI ? openaiKey : openrouterKey;
    const apiUrl = useOpenAI ? OPENAI_API_URL : OPENROUTER_API_URL;

    try {
        let documentText = '';
        let isImageAnalysis = false;

        // --- TEXT EXTRACTION ---
        if (mimeType === 'application/pdf') {
            try {
                const pdfData = await pdfParse(fileBuffer);
                documentText = pdfData.text || '';
                console.log(`PDF text extracted: ${documentText.length} chars`);
            } catch (pdfErr) {
                console.error("PDF parse error:", pdfErr.message);
                documentText = '';
            }
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
            try {
                const result = await mammoth.extractRawText({ buffer: fileBuffer });
                documentText = result.value || '';
                console.log(`Word doc text extracted: ${documentText.length} chars`);
            } catch (wordErr) {
                console.error("Word parse error:", wordErr.message);
                documentText = '';
            }
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType === 'application/vnd.ms-excel') {
            try {
                const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
                let excelText = '';
                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    excelText += `Sheet: ${sheetName}\n`;
                    excelText += xlsx.utils.sheet_to_csv(worksheet) + '\n\n';
                });
                documentText = excelText;
                console.log(`Excel text extracted: ${documentText.length} chars`);
            } catch (excelErr) {
                console.error("Excel parse error:", excelErr.message);
                documentText = '';
            }
        } else if (mimeType?.startsWith('image/')) {
            // Mark as image — will use vision model
            isImageAnalysis = true;
            console.log(`Image detected (${mimeType}), will use vision model`);
        } else {
            // Fallback for all other file types (Text, Logs, CSV, etc.)
            documentText = fileBuffer.toString('utf-8');

            // If it looks like binary or garbage, clean it
            if (documentText.includes('\ufffd') || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(documentText)) {
                console.log("Detected non-text encoding, cleaning buffer...");
                documentText = fileBuffer.toString('utf-8')
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ') // Remove control chars
                    .replace(/\s{3,}/g, ' ') // Remove excessive whitespace
                    .trim();
            }
            console.log(`Universal fallback extracted: ${documentText.length} chars`);
        }

        // Final secondary fallback if primary extraction yielded very little (less than 50 chars)
        if (!isImageAnalysis && documentText.trim().length < 50) {
            console.log("Minimal text extracted, trying raw string conversion...");
            const rawText = fileBuffer.toString('utf-8');
            const readable = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ').trim();
            if (readable.length > documentText.trim().length) {
                documentText = readable;
                console.log(`Raw fallback got: ${documentText.length} chars`);
            }
        }

        // If no text and not an image, skip
        if (!isImageAnalysis && (!documentText || documentText.trim().length < 20)) {
            return {
                status: 'Skipped',
                summary: "Could not extract enough text from this document for analysis.",
                risks: [], tags: [], suggestedCategory: 'Other'
            };
        }

        // --- BUILD AI REQUEST ---
        const systemPrompt = 'You analyze documents and return JSON only. No markdown, no explanation. No text outside the JSON object.';

        const jsonSchema = `{
  "summary": "2-3 sentence executive summary of the document",
  "plainLanguageExplanation": "A paragraph explaining what this document means in simple, everyday language. Focus on what the reader should know and any obligations or rights.",
  "suggestedCategory": "One of: ${VALID_CATEGORIES.join(', ')}",
  "expiryDate": "YYYY-MM-DD or null",
  "renewalDate": "YYYY-MM-DD or null",
  "isSubscription": "boolean (true if this document represents a recurring service/subscription)",
  "subscriptionDetails": {
    "name": "string (service name, e.g., Netflix)",
    "price": "number (the recurring cost)",
    "period": "string ('Monthly' or 'Yearly')",
    "currency": "string (e.g., USD)"
  },
  "risks": ["List of risks, dangerous terms, or important obligations"],
  "tags": ["Relevant tags for categorization"]
}`;

        const userPrompt = `Analyze this document and return JSON only:\n${jsonSchema}`;

        let messages;
        let model;

        if (useOpenAI) {
            model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        } else {
            model = process.env.OPENROUTER_MODEL || 'openrouter/auto';
        }

        if (isImageAnalysis) {
            // Use vision model with base64 image
            const base64Image = fileBuffer.toString('base64');
            const dataUri = `data:${mimeType};base64,${base64Image}`;

            messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: `${userPrompt}\n\nAnalyze the document shown in this image.` },
                        { type: 'image_url', image_url: { url: dataUri } }
                    ]
                }
            ];

            // Use a vision-capable model for images
            if (!useOpenAI) {
                model = process.env.OPENROUTER_VISION_MODEL || 'google/gemma-3-27b-it:free';
            }
            console.log(`Using vision model: ${model}`);
        } else {
            // Text-based analysis
            const truncatedText = documentText.substring(0, 3000);
            messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `${userPrompt}\n\nDocument text:\n${truncatedText}`
                }
            ];
            console.log(`Sending ${truncatedText.length} chars to ${useOpenAI ? 'OpenAI' : 'OpenRouter'}...`);
        }

        // --- API CALL (with retry for free-tier intermittent failures) ---
        const MAX_RETRIES = 2;
        let response;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 45000);

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };

                if (!useOpenAI) {
                    headers['HTTP-Referer'] = 'https://doxradar.app';
                    headers['X-Title'] = 'DoxRadar AI Life Manager';
                }

                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature: 0.3,
                        max_tokens: 1500
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (response.ok) break; // Success, exit retry loop

                const errorText = await response.text();
                console.warn(`OpenRouter attempt ${attempt + 1} failed (${response.status}):`, errorText.substring(0, 200));

                if (attempt === MAX_RETRIES) {
                    return {
                        status: 'Failed',
                        summary: `AI Analysis failed after ${MAX_RETRIES + 1} attempts (${response.status}): ${errorText.substring(0, 150)}`,
                        risks: [], tags: [], suggestedCategory: 'Other'
                    };
                }

                // Wait before retry
                await new Promise(r => setTimeout(r, 2000));
            } catch (fetchErr) {
                clearTimeout(timeout);
                if (attempt === MAX_RETRIES) throw fetchErr;
                console.warn(`OpenRouter attempt ${attempt + 1} error:`, fetchErr.message);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        const data = await response.json();
        console.log(`${useOpenAI ? 'OpenAI' : 'OpenRouter'} raw response:`, JSON.stringify(data).substring(0, 300));

        let text = data.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error("No response from OpenRouter");
        }

        // Clean markdown code blocks if present
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Try to extract just the JSON object if there's extra text
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        // Attempt to repair truncated JSON before parsing
        const repairJSON = (str) => {
            let s = str.trim();

            // Remove trailing comma
            s = s.replace(/,\s*$/, '');

            // Count and fix unclosed brackets/braces
            let openBraces = 0, openBrackets = 0, inString = false, escapeNext = false;
            for (let i = 0; i < s.length; i++) {
                const c = s[i];
                if (escapeNext) { escapeNext = false; continue; }
                if (c === '\\') { escapeNext = true; continue; }
                if (c === '"') { inString = !inString; continue; }
                if (inString) continue;
                if (c === '{') openBraces++;
                if (c === '}') openBraces--;
                if (c === '[') openBrackets++;
                if (c === ']') openBrackets--;
            }

            // If we're still inside a string, close it
            if (inString) {
                s += '"';
            }

            // Remove trailing comma after fixing string
            s = s.replace(/,\s*$/, '');

            // Close unclosed brackets and braces
            while (openBrackets > 0) { s += ']'; openBrackets--; }
            while (openBraces > 0) { s += '}'; openBraces--; }

            return s;
        };

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (parseErr) {
            console.warn("JSON parse failed, attempting repair...", parseErr.message);
            try {
                const repaired = repairJSON(text);
                parsed = JSON.parse(repaired);
                console.log("JSON repair succeeded!");
            } catch (repairErr) {
                console.warn("JSON repair also failed, extracting fields via regex...");
                // Last resort: extract what we can with regex
                const extractField = (str, field) => {
                    const re = new RegExp(`"${field}"\\s*:\\s*"([^"]*)"`, 'i');
                    const m = str.match(re);
                    return m ? m[1] : null;
                };
                const extractArray = (str, field) => {
                    const re = new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
                    const m = str.match(re);
                    if (m) {
                        return m[1].match(/"([^"]*)"/g)?.map(s => s.replace(/"/g, '')) || [];
                    }
                    return [];
                };

                parsed = {
                    summary: extractField(text, 'summary') || 'Analysis completed with partial results.',
                    plainLanguageExplanation: extractField(text, 'plainLanguageExplanation') || '',
                    suggestedCategory: extractField(text, 'suggestedCategory') || 'Other',
                    expiryDate: extractField(text, 'expiryDate'),
                    renewalDate: extractField(text, 'renewalDate'),
                    risks: extractArray(text, 'risks'),
                    tags: extractArray(text, 'tags'),
                };
            }
        }

        // Validate suggestedCategory
        if (!VALID_CATEGORIES.includes(parsed.suggestedCategory)) {
            parsed.suggestedCategory = 'Other';
        }

        console.log("AI Analysis completed successfully!");
        return { ...parsed, status: 'Completed' };

    } catch (error) {
        const msg = error.name === 'AbortError'
            ? 'AI request timed out after 30 seconds'
            : error.message;
        console.error(`${useOpenAI ? 'OpenAI' : 'OpenRouter'} Analysis Failed:`, msg);
        return {
            status: 'Failed',
            summary: `AI Analysis failed: ${msg}`,
            risks: [], tags: [], suggestedCategory: 'Other'
        };
    }
};

module.exports = { analyzeDocument };
