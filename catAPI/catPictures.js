require('dotenv').config();

const catApiUrl = 'https://api.thecatapi.com/v1';
const catApiKey = process.env.CAT_API_KEY;

async function getRandomCatUrl() {
    const res = await fetch(`${catApiUrl}/images/search`, {
        headers: {
            'x-api-key': catApiKey
        }
    });

    if (!res.ok) {
        throw new Error(`The Cat API returned status ${res.status}`);
    }

    const data = await res.json();
    return data[0]?.url || null;
}

module.exports = { getRandomCatUrl };