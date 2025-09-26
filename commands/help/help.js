const { SlashCommandBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, TextChannel } = require('discord.js');
const { rarityCatsString } = require('../../utils/pets');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const wiggleCatEmoji = '<a:wiggle:1403383636811845765>';
const happyCatEmoji = '<a:Happy:1403155072384503929>';
const catFlexEmoji = '<:CatFlex:1408288059774074932>';
const petEmoji = '<:Pet:1416425590201913435>';

// Economy Help
const economyHelpHeader = `# Cat Coin Commands ${catCoinEmoji}`;

const economyHelpString1 = `## Registering
You can register in the Cat Coins System by using the </coins register:1401243483649605752> command`;

const economyHelpString2 = `## Daily Coins
You get free daily coins once every 24 hours by using the </coins daily:1401243483649605752> command`;

const economyHelpString3 = `## Hourly Coins
You get free daily coins once every hour by using the </coins hourly:1401243483649605752> command`;

const economyHelpString4 = `## Check Profile
You can check your own, or someone else's profile by using the </coins profile:1401243483649605752> command
You can enter an optional \`user\` if you want to check someone else's profile`;

const economyHelpString5 = `## Coins Leaderboard
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
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(economyHelpString5)
    );

// Shop Help
const shopHelpHeader = `# Shop Commands ${catFlexEmoji}`;

const shopHelpString1 = `## View Shop
You can view the current shop items by using the </shop view:1404177783697047553> command`;

const shopHelpString2 = `## Buy Item
You can buy an item from the shop by using the </shop buy:1404177783697047553> command
You have to select an item from the shown items in the \`item\` field`;

const shopHelpString3 = `## Use Item
Some items are usable, you can use an item by using the </shop use:1404177783697047553> command
You have to select an item from your inventory shown in the \`item\` field`;

const shopContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(shopHelpHeader)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(shopHelpString1)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(shopHelpString2)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(shopHelpString3)
    );

// Games Help
const gamesHelpHeader = `# Game Commands ${wiggleCatEmoji}`;

const gamesHelpString1 = `## Rock, Paper, Scissors
You can challange other players to Rock Paper Scissors and bet Cat Coins by using the </games rps:1402095106969833563> command
You need to enter the \`user\` you want to challange, and the amount of coins you want to \`bet\``;

const gamesHelpString2 = `## Hangman
You can play Hangman by using the </games hangman:1402095106969833563> command
You need to select the \`difficulty\` you want to play at, each difficulty has different rewards and loss amounts, exact amounts will be shown when you run the command.`;

const gamesHelpString3 = `## Tic Tac Toe
You can challange other players to Tic Tac Toe and bet Cat Coins by using the </games tic-tac-toe:1402095106969833563> command
You need to enter the \`user\` you want to challange, and the amount of coins you want to \`bet\`

**Note:** You must finish all games, even if it is an obvious draw, abandoning a game in the middle will be considered a loss after 60 seconds of not making a move.`;

const gamesHelpString4 = `## Crack the Vault
You can play Crack the Vault by using the </games vault:1402095106969833563> command
You need to select the \`difficulty\` you want to play at, each difficulty has different rewards and loss amounts, exact amounts will be shown when you run the command.`;

const gamesHelpString5 = `## Connect 4
You can challange other players to Connect 4 and bet Cat Coins by using the </games connect4:1402095106969833563> command
You need to enter the \`user\` you want to challange, and the amount of coins you want to \`bet\`

**Note:** You must finish all games, even if it is an obvious draw, abandoning a game in the middle will be considered a loss after 60 seconds of not making a move.`;

const gamesContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpHeader)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpString1)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpString2)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpString3)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpString4)
    )
    .addSeparatorComponents(largeSeparator)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent(gamesHelpString5)
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

const petsHelpHeader = `# Pet Commands ${petEmoji}`;

const petHelpString1 = `## Registering
You can register a pet using the </pet register:1416420485721362433> command
You need to choose the \`name\` and \`gender\` of your pet while registering, you cannot change these later`;

const petHelpString3 = `## Editing
You can edit your pet using the </pet edit:1416420485721362433> command
You need to choose the new \`name\` of the pet in the command`;

const petHelpString4 = `## Skins
You can roll for a new pet skin by using the </pet skin:1416420485721362433> command
You need to choose the \`rarity\` you want to roll for, and pay the amount of coins needed for a reroll`;

const petHelpString5 = `## Viewing
You can view your pet and its current status by using the </pet view:1416420485721362433> command`;

const petHelpString6 = `## Pet Care
Your pet will have various needs, you can use the following commands to take care of your pet and all its needs:
- </pet feed:1416420485721362433>
- </pet bath:1416420485721362433>
- </pet toilet:1416420485721362433>
- </pet play:1416420485721362433>
- </pet sleep:1416420485721362433>

## Pet Hotel
If you are busy and cannot take care of your pet, you can send them to the pet hotel using the </pet hotel:1416420485721362433> command
You can select the number of \`days\` you want to send your cat away for in the command

Depending on the pet's rarity and the number of days you send your pet away for, you will have to pay a hotel fee
The pet will return fully cared for and you will not be fined for not caring for the pet while it is away!

If you want to bring your pet back early, you can select the \`return\` option in the command as **Yes**`;

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
            .setName('shop')
            .setDescription('Get help regarding the Cat Coins shop!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('games')
            .setDescription('Get help regarding the Game commands!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('fun')
            .setDescription('Get help regarding the fun commands!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('pets')
            .setDescription('Get help regarding the pet commands!')
        ),

    async execute(interaction) {
        await interaction.deferReply();

        if (!interaction.guild) {
            return await interaction.editReply('This command can only be used in a server!');
        }

        if (!(interaction.channel instanceof TextChannel)) {
            return await interaction.editReply({ content: 'This command can only be used in a Text Channel.' });
        }

        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case 'coins':
                return await interaction.editReply({ components: [economyContainer], flags: MessageFlags.IsComponentsV2 });
            case 'shop':
                return await interaction.editReply({ components: [shopContainer], flags: MessageFlags.IsComponentsV2 });
            case 'games':
                return await interaction.editReply({ components: [gamesContainer], flags: MessageFlags.IsComponentsV2 });
            case 'fun':
                return await interaction.editReply({ components: [funContainer], flags: MessageFlags.IsComponentsV2 });
            case 'pets':
                const petHelpString2 = `## Rarities
You can get different rarities of cat skins! The better the rarity the more the cat's needs. Following are all the cats available for each rarity!

${rarityCatsString(interaction.client.petConfig)}`;

                const petsContainer = new ContainerBuilder()
                    .setAccentColor(0xFFC0CB)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(petsHelpHeader))
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(petHelpString1))
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(petHelpString2))
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(petHelpString3))
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(petHelpString4))
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(petHelpString5))
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(petHelpString6));

                return await interaction.editReply({ components: [petsContainer], flags: MessageFlags.IsComponentsV2 });
            default:
                return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};
