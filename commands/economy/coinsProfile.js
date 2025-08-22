const { EmbedBuilder } = require('discord.js');
const { getCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const winsEmoji = '<a:Happy:1403155072384503929>';
const streakEmoji = '<a:vibeCat:1403155858954649641>';
const lossEmoji = '<:SadCat:1403156017059074241>';
const drawEmoji = '<:catsHugging:1404464702045819022>';
const inventoryEmoji = '<:CatFlex:1408288059774074932>';

async function getWinRate(wins, losses) {
    const totalGames = wins + losses;
    if (totalGames === 0) return 0;
    return ((wins / totalGames) * 100).toFixed(2);
}

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
    const gameDraws = userData.gameDraws;
    const winStreak = userData.gamesWonStreak;
    const inventory = userData.inventory;
    const winRate = await getWinRate(gamesWon, gamesLost);

    let inventoryString = '';

    if (inventory.length === 0) {
        inventoryString += 'No Items';
    } else {
        for (const item of inventory) {
            inventoryString += `- ${item.name}\n`;
        }
    }

    const statsEmbed = new EmbedBuilder()
        .setColor(0xFFC0CB)
        .setTitle('Profile')
        .setAuthor({ name: `${targetUser.username} (${targetUser.id})`, iconURL: targetUser.displayAvatarURL() })
        .setFields(
            { name: `Cat Coins ${catCoinEmoji}`, value: `${coins}` },
            { name: `Game Wins ${winsEmoji}`, value: `${gamesWon} (${winRate}% Win Rate)` },
            { name: `Game Wins Streak ${streakEmoji}`, value: `${winStreak}` },
            { name: `Game Losses ${lossEmoji}`, value: `${gamesLost}` },
            { name: `Game Draws ${drawEmoji}`, value: `${gameDraws}` },
            { name: `Inventory ${inventoryEmoji}`, value: inventoryString }
        );

    return await interaction.editReply({ embeds: [statsEmbed] });
};
