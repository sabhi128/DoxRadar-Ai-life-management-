require('dotenv').config();
const fs = require('fs');

async function listModels() {
    console.log("Listing models to file...");
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const modelNames = data.models ? data.models.map(m => m.name).join('\n') : "No models found";
        fs.writeFileSync('models_list.txt', modelNames);
        console.log("Models written to models_list.txt");
    } catch (error) {
        console.error("Fetch Failed:", error.message);
    }
}

listModels();
