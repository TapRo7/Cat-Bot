const { findOne, updateOne } = require('./index');

const configCollection = 'Config';

async function getTasksConfig(configKey = 'tasks') {
    return await findOne(configCollection, { configKey });
}

async function updateTasksConfig(updates, configKey = 'tasks') {
    return await updateOne(configCollection, { configKey }, updates);
}

module.exports = { getTasksConfig, updateTasksConfig };