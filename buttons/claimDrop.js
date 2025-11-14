const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../database/catCoins');
const AsyncLock = require('async-lock');

const winnerLock = new AsyncLock();
const dropCoins = 20;
const boosterMultiplier = 1.5;
const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const processedDropIds = new Set();

module.exports = {
    customId: 'claimDrop',
    async execute(interaction) {
        try {
            await interaction.deferUpdate();

            await winnerLock.acquire('dropClaimed', async () => {
                if (processedDropIds.has(interaction.message.id)) {
                    return;
                }

                processedDropIds.add(interaction.message.id);

                const userData = await getCatCoinsUser(interaction.user.id);

                if (!userData) {
                    return;
                }

                let coinsToAdd;

                if (interaction.member.premiumSince) {
                    coinsToAdd = dropCoins * boosterMultiplier;
                } else {
                    coinsToAdd = dropCoins;
                }

                const updatedUserData = {
                    $inc: {
                        coins: coinsToAdd
                    }
                };

                const updated = await customUpdateCatCoinsUser(interaction.user.id, updatedUserData);

                if (updated) {
                    return await interaction.editReply({ content: `<@${interaction.user.id}> was the first to claim the drop!\nThey've claimed **${coinsToAdd} Cat Coins** ${catCoinEmoji}`, components: [] });
                } else {
                    processedDropIds.delete(interaction.message.id);
                }
            });
        }
        finally {
            setTimeout(() => processedDropIds.delete(interaction.message.id), 60_000);
        }
    },
};