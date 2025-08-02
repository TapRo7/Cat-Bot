const { findOne } = require('./index');

const configCollection = 'catCoinPlayers';

async function getTasksConfig(configKey = 'tasks') {
    return await findOne(configCollection, { configKey });
}

module.exports = { getTasksConfig };