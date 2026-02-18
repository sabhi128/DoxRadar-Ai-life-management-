require('dotenv').config();

async function quickTest() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('');

    // Test 1: Simple text request (same as curl)
    console.log('=== TEST 1: Simple text (like your curl) ===');
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Say hello in one word" }] }]
                })
            }
        );

        if (res.ok) {
            const data = await res.json();
            console.log('SUCCESS! Response:', data.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
            const err = await res.text();
            console.log('FAILED (' + res.status + '):', err.substring(0, 300));
        }
    } catch (e) {
        console.log('ERROR:', e.message);
    }

    console.log('');
    console.log('If Test 1 FAILED with 429 -> your API key has no quota at all.');
    console.log('If Test 1 PASSED -> the issue is file size/tokens when uploading docs.');
}

quickTest();
