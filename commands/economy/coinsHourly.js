const { getCatCoinsUser, updateCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const hourlyCoinReward = 10;
const boosterMultiplier = 1.5;
const hourlySeconds = 3600;

module.exports = async (interaction) => {
    const userData = await getCatCoinsUser(interaction.user.id);

    if (!userData) {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    const lastHourlyClaimed = userData.lastHourlyClaimed;
    const currentEpoch = Math.floor(Date.now() / 1000);
    const timeElapsed = currentEpoch - lastHourlyClaimed;

    if (timeElapsed >= hourlySeconds) {
        let coinsToAdd;

        if (interaction.member.premiumSince) {
            coinsToAdd = Math.floor(hourlyCoinReward * boosterMultiplier);
        } else {
            coinsToAdd = hourlyCoinReward;
        }

        const newCoins = userData.coins + coinsToAdd;

        const updatedUserData = {
            coins: newCoins,
            lastHourlyClaimed: currentEpoch
        };

        const updated = await updateCatCoinsUser(interaction.user.id, updatedUserData);

        if (updated) {
            return await interaction.editReply({ content: `You have claimed your hourly ${coinsToAdd} coins! You now have **${newCoins} Cat Coins** ${catCoinEmoji}` });
        } else {
            return await interaction.editReply({ content: 'Something went wrong, please try again later.' });
        }
    } else {
        const timeLeftToClaim = lastHourlyClaimed + hourlySeconds;
        return await interaction.editReply({ content: `You have already claimed your hourly!\nYou can claim your hourly again <t:${timeLeftToClaim}:R>` });
    }
};