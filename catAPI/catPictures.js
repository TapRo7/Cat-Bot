require('dotenv').config();

const CAT_API_BASE = 'https://api.thecatapi.com/v1';
const API_KEY = process.env.CAT_API_KEY;

if (!API_KEY) {
    throw new Error('Missing CAT_API_KEY in .env file');
}

async function getRandomCatUrl() {
    const res = await fetch(`${CAT_API_BASE}/images/search`, {
        headers: {
            'x-api-key': API_KEY
        }
    });

    if (!res.ok) {
        throw new Error(`The Cat API returned status ${res.status}`);
    }

    const data = await res.json();
    return data[0]?.url || null;
}

module.exports = { getRandomCatUrl };