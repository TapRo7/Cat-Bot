const { insertOne, findOne, updateOne } = require('./index');

const catCoinsCollection = 'catCoinPlayers';

async function registerCatCoinsUser(userId) {
    const newUser = {
        userId,
        coins: 200,
        lastDailyClaimed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesWonStreak: 0
    };

    return await insertOne(catCoinsCollection, newUser);
}

async function getCatCoinsUser(userId) {
    return await findOne(catCoinsCollection, { userId });
}

async function updateCatCoinsUser(userId, updates) {
    return await updateOne(catCoinsCollection, { userId }, updates);
}

module.exports = { registerCatCoinsUser, getCatCoinsUser, updateCatCoinsUser };