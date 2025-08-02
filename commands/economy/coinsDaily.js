const { getCatCoinsUser, updateCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const dailyCoinReward = 100;
const dailySeconds = 86400;

module.exports = async (interaction) => {
    const userData = await getCatCoinsUser(interaction.user.id);

    if (!userData) {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    const lastDailyClaimed = userData.lastDailyClaimed;
    const currentEpoch = Math.floor(Date.now() / 1000);
    const timeElapsed = currentEpoch - lastDailyClaimed;

    if (timeElapsed >= dailySeconds) {
        const newCoins = userData.coins + dailyCoinReward;

        const updatedUserData = {
            coins: newCoins,
            lastDailyClaimed: currentEpoch
        };

        const updated = await updateCatCoinsUser(interaction.user.id, updatedUserData);

        if (updated) {
            return await interaction.editReply({ content: `You have claimed your daily ${dailyCoinReward} coins! You now have **${newCoins} Cat Coins** ${catCoinEmoji}` });
        } else {
            return await interaction.editReply({ content: 'Something went wrong, please try again later.' });
        }
    } else {
        const timeLeftToClaim = lastDailyClaimed + dailySeconds;
        return await interaction.editReply({ content: `You have already claimed your daily!\nYou can claim your daily again <t:${timeLeftToClaim}:R>` });
    }
};