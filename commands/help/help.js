const { SlashCommandBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const wiggleCatEmoji = '<a:wiggle:1403383636811845765>';
const happyCatEmoji = '<a:Happy:1403155072384503929>';

// Economy Help
const economyHelpHeader = `# Cat Coin Commands ${catCoinEmoji}`;

const economyHelpString1 = `## Registering
You can register in the Cat Coins System by using the </coins register:1401243483649605752> command`;

const economyHelpString2 = `## Daily Coins
You get free daily coins once every 24 hours by using the </coins daily:1401243483649605752> command`;

const economyHelpString3 = `## Check Statistics
You can check your own, or someone else's statistics by using the </coins check:1401243483649605752> command
You can enter an optional \`user\` if you want to check someone else's statistics`;

const economyHelpString4 = `## Coins Leaderboard
You can check the top Cat Coin leaderboard by using the </coins leaderboard:1401243483649605752> command`;

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
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(economyHelpString4)
    );;

// Games Help
const gamesHelpHeader = `# Game Commands ${wiggleCatEmoji}`;

const gamesHelpString1 = `## Rock, Paper, Scissors
You can challange other players to Rock Paper Scissors and bet Cat Coins by using the </games rps:1402095106969833563> command
You need to enter the \`user\` you want to challange, and the amount of coins you want to \`bet\``;

const gamesContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpHeader)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpString1)
    );

// Fun Help
const funHelpHeader = `# Fun Commands ${happyCatEmoji}`;

const funHelpString1 = `## Random Cat Pictures
You can get a random cat picture by using the </cat:1401267900882616461> command`;

const funContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(funHelpHeader)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(funHelpString1)
    );

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Guide for the Cat Bot!')
        .addSubcommand(subcommand => subcommand
            .setName('coins')
            .setDescription('Get help regarding the Cat Coins system!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('games')
            .setDescription('Get help regarding the Game commands!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('fun')
            .setDescription('Get help regarding the fun commands!')
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case 'coins':
                return await interaction.editReply({ components: [economyContainer], flags: MessageFlags.IsComponentsV2 });
            case 'games':
                return await interaction.editReply({ components: [gamesContainer], flags: MessageFlags.IsComponentsV2 });
            case 'fun':
                return await interaction.editReply({ components: [funContainer], flags: MessageFlags.IsComponentsV2 });
            default:
                return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};
