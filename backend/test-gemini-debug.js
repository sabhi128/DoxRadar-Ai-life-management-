require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function testGeminiAPI() {
    console.log('\n=== GEMINI API DEBUG TEST ===\n');

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('1. API Key Check:');
    console.log(`   - Exists: ${!!apiKey}`);
    console.log(`   - Length: ${apiKey?.length || 0}`);
    console.log(`   - First 10 chars: ${apiKey?.substring(0, 10)}...`);
    console.log('');

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env file!');
        return;
    }

    // Test models in order
    const modelsToTest = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    console.log('2. Testing Models:\n');

    for (const modelName of modelsToTest) {
        try {
            console.log(`   Testing: ${modelName}`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent("Say 'Hello World' in one word");
            const response = await result.response;
            const text = response.text();

            console.log(`   ✅ SUCCESS with ${modelName}`);
            console.log(`   Response: ${text}`);
            console.log('');

            // If this model works, test with a PDF
            console.log('3. Testing PDF Analysis:\n');
            await testPDFAnalysis(modelName, apiKey);
            return; // Exit after first successful model

        } catch (error) {
            console.log(`   ❌ FAILED with ${modelName}`);
            console.log(`   Error: ${error.message}`);
            console.log('');
        }
    }

    console.log('❌ All models failed. Check your API key permissions.');
}

async function testPDFAnalysis(modelName, apiKey) {
    try {
        console.log(`   Using model: ${modelName}`);

        // Create a simple test PDF buffer (minimal PDF structure)
        const testPdfBuffer = Buffer.from(
            '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test Document) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000317 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n408\n%%EOF'
        );

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const base64Data = testPdfBuffer.toString("base64");

        const prompt = `Analyze this document and return JSON: {"summary": "brief summary", "tags": ["tag1"]}`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf",
                },
            },
        ]);

        const response = await result.response;
        let text = response.text();

        console.log(`   ✅ PDF Analysis SUCCESS`);
        console.log(`   Response: ${text.substring(0, 200)}...`);
        console.log('');
        console.log('🎉 All tests passed! Your setup is working correctly.');

    } catch (error) {
        console.log(`   ❌ PDF Analysis FAILED`);
        console.log(`   Error: ${error.message}`);

        if (error.message.includes('quota')) {
            console.log('\n⚠️  QUOTA EXCEEDED - Wait for quota reset or upgrade your plan');
        } else if (error.message.includes('404')) {
            console.log('\n⚠️  MODEL NOT FOUND - This model is not available for your API key');
        } else {
            console.log('\n⚠️  Check the full error above for details');
        }
    }
}

// Run the test
testGeminiAPI().catch(console.error);
