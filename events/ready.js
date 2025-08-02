const { Events, ActivityType } = require('discord.js');
const { connectToDatabase, setupDatabase } = require('../database/index');
const { startTasks } = require('../taskRunner');

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

        console.log(`Client Ready! Logged in as ${client.user.tag}`);
        client.user.setPresence({ status: 'dnd' });
        client.user.setActivity('Cat Videos', { type: ActivityType.Watching });

        startTasks(client);
    }
};