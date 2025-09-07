const { findOne, updateOne, customUpdateOne } = require('./index');

const configCollection = 'Config';

async function getTasksConfig(configKey = 'tasks') {
    return await findOne(configCollection, { configKey });
}

async function updateTasksConfig(updates, configKey = 'tasks') {
    return await updateOne(configCollection, { configKey }, updates);
}

async function getShopConfig(configKey = 'shop') {
    return await findOne(configCollection, { configKey });
}

async function updateShopConfig(updates, configKey = 'shop') {
    return await customUpdateOne(configCollection, { configKey }, updates);
}

async function getHangmanConfig(configKey = 'hangman') {
    return await findOne(configCollection, { configKey });
}

async function getPetsConfig(configKey = 'pets') {
    return await findOne(configCollection, { configKey });
}

module.exports = { getTasksConfig, updateTasksConfig, getShopConfig, updateShopConfig, getHangmanConfig, getPetsConfig };