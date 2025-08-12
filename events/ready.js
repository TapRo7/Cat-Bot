const { Events, ActivityType } = require('discord.js');
const { connectToDatabase, setupDatabase } = require('../database/index');
const { getShopConfig, getHangmanConfig } = require('../database/config');
const { getCatCoinUserInventories } = require('../database/catCoins');
const { startTasks } = require('../utils/taskRunner');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        try {
            await connectToDatabase();
            await setupDatabase();
        } catch (error) {
            console.log(`Error connecting to or setting up Database: ${error}\nUnable to start bot.`);
            process.exit(1);
        }

        const shopConfig = await getShopConfig();

        client.shop = new Map();
        client.shopItemNames = new Array();
        client.usedShopIds = shopConfig.usedShopIds;

        for (const shopItem of shopConfig.shop) {
            client.shop.set(shopItem.id, shopItem);
            client.shopItemNames.push(`${shopItem.name} - ${shopItem.id}`);
        }

        const userItemsData = await getCatCoinUserInventories();

        client.userItems = new Map();

        for (const userData of userItemsData) {
            client.userItems.set(userData.userId, userData.inventoryItemNames);
        }

        const hangmanConfig = await getHangmanConfig();

        client.hangmanWords = new Map();

        client.hangmanWords.set('Hard', hangmanConfig.hardWords);
        client.hangmanWords.set('Medium', hangmanConfig.mediumWords);
        client.hangmanWords.set('Easy', hangmanConfig.easyWords);

        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.members.fetch();
                console.log(`Fetched ${guild.memberCount} members for ${guild.name}`);
            } catch (error) {
                console.error(`Failed to fetch members for ${guild.name}:`, error);
            }
        }
        console.log('All guild members cached!');

        console.log(`Client Ready! Logged in as ${client.user.tag}`);
        client.user.setPresence({ status: 'dnd' });
        client.user.setActivity('Cat Videos', { type: ActivityType.Watching });

        startTasks(client);
    }
};