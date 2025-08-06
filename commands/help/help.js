const { SlashCommandBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

// Economy Help
const economyHelpHeader = '# Cat Coin Commands <:CatCoin:1401235223831642133>';

const economyHelpString1 = `## Registering
You can register in the Cat Coins System by using the </coins register:1401243483649605752> command`;

const economyHelpString2 = `## Daily Coins
You get free daily coins once every 24 hours by using the </coins daily:1401243483649605752> command`;

const economyHelpString3 = `## Check Coins
You can check your own, or someone else's Cat Coins by using the </coins check:1401243483649605752> command
You can enter an optional \`user\` if you want to check someone else's coins`;

// Games Help
const gamesHelpHeader = '# Game Commands <a:playfulcat:1402099047959105596>';

const gamesHelpString1 = `## Rock, Paper, Scissors
You can challange other players to Rock Paper Scissors and bet Cat Coins by using the </games rps:1402095106969833563> command
You need to enter the \`user\` you want to challange, and the amount of coins you want to \`bet\``;

// Fun Help
const funHelpHeader = '# Fun Commands <a:HappyHappy:1399809689008738516>';

const funHelpString1 = `## Random Cat Pictures
You can get a random cat picture by using the </cat:1401267900882616461> command`;

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Guide for the Cat Bot!'),

    async execute(interaction) {
        await interaction.deferReply();

        const economyContainer = new ContainerBuilder()
            .setAccentColor(0xFFC0CB)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(economyHelpHeader)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(economyHelpString1)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(economyHelpString2)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(economyHelpString3)
            );

        const gamesContainer = new ContainerBuilder()
            .setAccentColor(0xFFC0CB)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(gamesHelpHeader)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(gamesHelpString1)
            );

        const funContainer = new ContainerBuilder()
            .setAccentColor(0xFFC0CB)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(funHelpHeader)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(funHelpString1)
            );

        await interaction.editReply({ components: [economyContainer, gamesContainer, funContainer] });
    }
};
