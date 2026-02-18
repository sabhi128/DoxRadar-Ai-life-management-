require('dotenv').config();

async function listAvailableModels() {
    console.log('\n=== LISTING AVAILABLE MODELS ===\n');

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('NO GEMINI_API_KEY found in .env file!');
        return;
    }

    console.log('API Key: ' + apiKey.substring(0, 10) + '...\n');

    try {
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
        );

        if (!response.ok) {
            const text = await response.text();
            console.error('HTTP Error ' + response.status + ': ' + text);
            return;
        }

        const data = await response.json();

        if (!data.models || data.models.length === 0) {
            console.log('No models found for this API key');
            return;
        }

        console.log('Found ' + data.models.length + ' models:\n');

        // Filter and show only models that support generateContent
        const contentModels = data.models.filter(function (m) {
            return m.supportedGenerationMethods &&
                m.supportedGenerationMethods.indexOf('generateContent') !== -1;
        });

        console.log('=== MODELS THAT SUPPORT generateContent ===\n');
        contentModels.forEach(function (model, index) {
            var name = model.name.replace('models/', '');
            console.log((index + 1) + '. ' + name + ' (' + model.displayName + ')');
        });

        console.log('\n=== COPY THIS INTO aiService.js ===\n');
        var geminiModels = contentModels
            .filter(function (m) { return m.name.indexOf('gemini') !== -1; })
            .map(function (m) { return m.name.replace('models/', ''); });

        console.log('const models = [');
        geminiModels.forEach(function (name) {
            console.log('    "' + name + '",');
        });
        console.log('];');

    } catch (error) {
        console.error('Error: ' + error.message);
    }
}

listAvailableModels();
