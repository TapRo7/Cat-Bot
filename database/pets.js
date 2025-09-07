const { insertOne, findOne, updateOne, customUpdateOne } = require('./index');
const AsyncLock = require('async-lock');

const petsCollection = 'playerPets';
const petsDatabaseLock = new AsyncLock();

async function registerPet(userId, petName, petId) {
    const newPet = {
        userId,
        petName,
        petId,
        relationshipPoints: 0,
        petRegisteredEpoch: Math.floor(Date.now() / 1000),
        lastFed: 0,
        lastBathed: 0,
        lastToilet: 0,
        lastPlayed: 0,
        lastSlept: 0,
        lastCareComplete: 0,
        collectedCoins: 0,
        lastCoinCollection: 0
    };

    const registered = await insertOne(petsCollection, newPet);

    return { registered, newPet };
}

async function getUserPet(userId) {
    return await findOne(petsCollection, { userId });
}

async function updateUserPet(userId, updates) {
    return await petsDatabaseLock.acquire(userId, async () => {
        return await updateOne(petsCollection, { userId }, updates);
    });
}

async function customUpdateUserPet(userId, updates) {
    return await petsDatabaseLock.acquire(userId, async () => {
        return await customUpdateOne(petsCollection, { userId }, updates);
    });
}

module.exports = { registerPet, getUserPet, updateUserPet, customUpdateUserPet };