const { insertOne, findOne, updateOne, customUpdateOne, find, findOneAndDelete } = require('./index');
const AsyncLock = require('async-lock');

const petsCollection = 'playerPets';
const deletedPetsCollection = 'deletedPlayerPets';
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
        careWarnings: {
            'day1': false,
            'day2': false,
            'day3': false,
            'day4': false,
            'day5': false,
            'day6': false,
        },
        collectedCoins: 0,
        lastCoinCollection: 0
    };

    const registered = await insertOne(petsCollection, newPet);

    return { registered, newPet };
}

async function getUserPet(userId) {
    return await findOne(petsCollection, { userId });
}

async function deleteUserPet(userId) {
    const deletedPet = await findOneAndDelete(petsCollection, { userId });
    return await insertOne(deletedPetsCollection, deletedPet);
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

async function getAllPets() {
    return await find(petsCollection);
}

module.exports = { registerPet, getUserPet, updateUserPet, customUpdateUserPet, deleteUserPet, getAllPets };