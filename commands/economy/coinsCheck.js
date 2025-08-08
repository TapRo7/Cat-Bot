const { EmbedBuilder } = require('discord.js');
const { getCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const winsEmoji = '<a:Happy:1403155072384503929>';
const streakEmoji = '<a:vibeCat:1403155858954649641>';
const lossEmoji = '<:SadCat:1403156017059074241>';

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
    const gamesWon = userData.gamesWon;
    const gamesLost = userData.gamesLost;
    const winStreak = userData.gamesWonStreak;

    const statsEmbed = new EmbedBuilder()
        .setColor(0xFFC0CB)
        .setTitle('User Statistics')
        .setAuthor({ name: `${targetUser.username} (${targetUser.id})`, iconURL: targetUser.displayAvatarURL() })
        .setFields(
            { name: `Cat Coins ${catCoinEmoji}`, value: `${coins}` },
            { name: `Game Wins ${winsEmoji}`, value: `${gamesWon}` },
            { name: `Game Wins Streak ${streakEmoji}`, value: `${winStreak}` },
            { name: `Game Losses ${lossEmoji}`, value: `${gamesLost}` }
        );

    return await interaction.editReply({ embeds: [statsEmbed] });
};
