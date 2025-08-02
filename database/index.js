const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const databaseClient = new MongoClient(uri);
const requiredCollections = ['catCoinPlayers', 'Config'];

let database;

async function connectToDatabase() {
    await databaseClient.connect();
    database = databaseClient.db('botDatabase');
    console.log('Connected to MongoDB');
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

async function findAll(collectionName) {
    const collection = getCollection(collectionName);
    return await collection.find().toArray();
}

async function find(collectionName, filter) {
    const collection = getCollection(collectionName);
    return await collection.find(filter).toArray();
}

module.exports = { connectToDatabase, getCollection, setupDatabase, insertOne, findOne, deleteOne, updateOne, findAll, find };