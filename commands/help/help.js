const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const economyHelpString = `## Registering
You can register in the Cat Coins System by using the </coins register:1401243483649605752> command

## Daily Coins
You get free daily coins once every 24 hours by using the </coins daily:1401243483649605752> command

## Check Coins
You can check your own, or someone else's Cat Coins by using the </coins check:1401243483649605752> command
You can enter an optional \`user\` if you want to check someone else's coins`;

const funHelpString = `## Random Cat Pictures
You can get a random cat picture by using the </cat:1401267900882616461> command`;

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Guide for the Cat Bot!'),

    async execute(interaction) {
        await interaction.deferReply();

        const economyEmbed = new EmbedBuilder()
            .setTitle('Cat Coin Commands <:CatCoin:1401235223831642133>')
            .setDescription(economyHelpString)
            .setColor(0xFFC0CB);

        const funEmbed = new EmbedBuilder()
            .setTitle('Fun Commands <a:HappyHappy:1399809689008738516>')
            .setDescription(funHelpString)
            .setColor(0xFFC0CB);

        await interaction.editReply({ embeds: [economyEmbed, funEmbed] });
    }
};
