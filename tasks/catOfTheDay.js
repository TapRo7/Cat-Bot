const { EmbedBuilder } = require('discord.js');
const { getRandomCatUrl } = require('../catAPI/catPictures');
const { getTasksConfig, updateTasksConfig } = require('../database/config');

const dailyCatChannelId = process.env.DAILY_CAT_CHANNEL_ID;
const dailySeconds = 86400;

module.exports = {
    name: 'Cat of the Day',
    intervalSeconds: 60,
    async run(client) {
        const tasksConfig = await getTasksConfig();
        const lastDailyCatPostedAt = tasksConfig.lastDailyCatPostedAt;
        const currentEpoch = Math.floor(Date.now() / 1000);

        const timeElapsed = currentEpoch - lastDailyCatPostedAt;

        if (timeElapsed >= dailySeconds) {
            const updatedConfig = {
                lastDailyCatPostedAt: lastDailyCatPostedAt + dailySeconds
            };

            const updated = await updateTasksConfig(updatedConfig);

            if (updated) {
                console.log('Daily cat config updated');
            } else {
                return console.error('Couldn\'t write to config database for daily cat task');
            }

            const dailyCatChannel = client.channels.cache.get(dailyCatChannelId);

            const randomCatUrl = await getRandomCatUrl();

            const catEmbed = new EmbedBuilder()
                .setTitle('Behold! The Cat of the Day <:Catblushy:1399804880587325451>')
                .setImage(randomCatUrl)
                .setColor(0xFFC0CB);

            await dailyCatChannel.send({ embeds: [catEmbed] });
        }
    }
};