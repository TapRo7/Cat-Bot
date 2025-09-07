const { MongoClient } = require('mongodb');
const { criticalErrorNotify } = require('../utils/errorNotifier');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const requiredCollections = ['catCoinPlayers', 'Config', 'pendingInviteTracking', 'playerPets'];

let databaseClient;
let database;

async function connectToDatabase(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            databaseClient = new MongoClient(uri);
            await databaseClient.connect();
            database = databaseClient.db('botDatabase');

            if (databaseClient.listenerCount('close') === 0) {
                databaseClient.on('close', async () => {
                    console.warn('MongoDB connection closed! Attempting reconnect...');
                    try {
                        await connectToDatabase();
                        console.log('Reconnected to MongoDB!');
                    } catch (err) {
                        console.error('Reconnection failed:', err);
                        await criticalErrorNotify(
                            'Critical error in trying to connect to database on connection close'
                        );
                        process.exit(1);
                    }
                });
            }

            console.log('Connected to MongoDB');
            return database;
        } catch (err) {
            console.error(`MongoDB connection failed (attempt ${i + 1}/${retries}):`, err.message);

            if (i < retries - 1) {
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2;
            } else {
                throw new Error('MongoDB connection failed after multiple attempts');
            }
        }
    }
}


async function setupDatabase() {
    const collections = await database.listCollections({}, { nameOnly: true }).toArray();
    const collectionNames = collections.map(col => col.name);

    for (const name of requiredCollections) {
        if (!collectionNames.includes(name)) {
            await database.createCollection(name);
            console.log(`Created "${name}" collection`);
        } else {
            console.log(`"${name}" collection found`);
        }
    }
}

function getCollection(name) {
    if (!databaseClient || !database) {
        throw new Error(`Database not initialized. Tried to access "${name}" before connectToDatabase().`);
    }
    return database.collection(name);
}

// CRUD Helpers
async function insertOne(collectionName, document) {
    const collection = getCollection(collectionName);
    const result = await collection.insertOne(document);
    return result.acknowledged;
}

async function findOne(collectionName, filter) {
    const collection = getCollection(collectionName);
    return await collection.findOne(filter);
}

async function deleteOne(collectionName, filter) {
    const collection = getCollection(collectionName);
    const result = await collection.deleteOne(filter);
    return result.deletedCount > 0;
}

async function updateOne(collectionName, filter, update, upsert = false) {
    const collection = getCollection(collectionName);
    const result = await collection.updateOne(filter, { $set: update }, { upsert: upsert });

    if (result.upsertedCount > 0) {
        return result.upsertedCount;
    } else if (result.modifiedCount > 0) {
        return result.modifiedCount;
    } else {
        return 0;
    }
}

async function customUpdateOne(collectionName, filter, update) {
    const collection = getCollection(collectionName);
    const result = await collection.updateOne(filter, update);

    if (result.upsertedCount > 0) {
        return result.upsertedCount;
    } else if (result.modifiedCount > 0) {
        return result.modifiedCount;
    } else {
        return 0;
    }
}

async function findAll(collectionName) {
    const collection = getCollection(collectionName);
    return await collection.find().toArray();
}

async function find(collectionName, filter) {
    const collection = getCollection(collectionName);
    return await collection.find(filter).toArray();
}

async function findWithOptions(collectionName, filter = {}, options = {}) {
    const collection = getCollection(collectionName);
    let cursor = collection.find(filter);

    if (options.sort) {
        cursor = cursor.sort(options.sort);
    }
    if (options.limit) {
        cursor = cursor.limit(options.limit);
    }
    if (options.projection) {
        cursor = cursor.project(options.projection);
    }

    return await cursor.toArray();
}


module.exports = { connectToDatabase, getCollection, setupDatabase, insertOne, findOne, deleteOne, updateOne, customUpdateOne, findAll, find, findWithOptions };