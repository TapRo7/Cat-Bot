const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { getCatCoinsUser, updateCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

module.exports = async (interaction) => {
    const targetUser = interaction.options.getUser('user');
    const betAmount = interaction.options.getInteger('bet');

    const challengeContainer = new ContainerBuilder()
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`# Rock Paper Scissors Battle!`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`- ${catCoinEmoji} Bet: **${betAmount}**\n- ${catCoinEmoji} <@${interaction.user.id}> Coins**`)
        );
};
