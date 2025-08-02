const { getCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';

module.exports = async (interaction) => {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    let isOtherUser = false;

    if (targetUser.id != interaction.user.id) {
        isOtherUser = true;
    }

    const userData = await getCatCoinsUser(targetUser.id);

    if (!userData) {
        if (isOtherUser) {
            return await interaction.editReply({ content: 'The user you are trying to check has not registered in the Cat Coin System' });
        } else {
            return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
        }
    }

    const coins = userData.coins;

    if (isOtherUser) {
        return await interaction.editReply({ content: `<@${targetUser.id}> has **${coins} Cat Coins** ${catCoinEmoji}` });
    } else {
        return await interaction.editReply({ content: `You have **${coins} Cat Coins** ${catCoinEmoji}` });
    }
};
