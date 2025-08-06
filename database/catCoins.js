const { insertOne, findOne, updateOne, customUpdateOne } = require('./index');
const AsyncLock = require('async-lock');

const catCoinsCollection = 'catCoinPlayers';
const coinDatabaseLock = new AsyncLock();

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
    return await coinDatabaseLock.acquire(userId, async () => {
        return await updateOne(catCoinsCollection, { userId }, updates);
    });
}

async function customUpdateCatCoinsUser(userId, updates) {
    return await coinDatabaseLock.acquire(userId, async () => {
        return await customUpdateOne(catCoinsCollection, { userId }, updates);
    });
}

module.exports = { registerCatCoinsUser, getCatCoinsUser, updateCatCoinsUser, customUpdateCatCoinsUser, coinDatabaseLock };