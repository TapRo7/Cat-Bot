const { SlashCommandBuilder, MessageFlags, TextChannel } = require('discord.js');

const gameRps = require('./gamesRps');
const gameHangman = require('./gamesHangman');
const gameTicTacToe = require('./gamesTicTacToe');
const gameConnect4 = require('./gamesConnect4');
const gameVault = require('./gamesVault');

module.exports = {
    cooldown: 30,
    subCooldowns: {
        'hangman': 600,
        'vault': 600,
    },
    data: new SlashCommandBuilder()
        .setName('games')
        .setDescription('Cat Coin Games')
        .addSubcommand(subcommand => subcommand
            .setName('rps')
            .setDescription('Challenge someone to Rock Paper Scissors!')
            .addUserOption(option => option.setName('user').setDescription('Select the user you want to challenge!').setRequired(true))
            .addIntegerOption(option => option.setName('bet').setDescription('Enter how many Cat Coins you want to bet').setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('hangman')
            .setDescription('Guess the word and save hangman!')
            .addStringOption(option => option.setName('difficulty').setDescription('Select the difficulty you want to play at!').setRequired(true).setChoices(
                { name: 'Hard', value: 'Hard' },
                { name: 'Medium', value: 'Medium' },
                { name: 'Easy', value: 'Easy' }
            ))
        )
        .addSubcommand(subcommand => subcommand
            .setName('tic-tac-toe')
            .setDescription('Challenge someone to Tic Tac Toe!')
            .addUserOption(option => option.setName('user').setDescription('Select the user you want to challenge!').setRequired(true))
            .addIntegerOption(option => option.setName('bet').setDescription('Enter how many Cat Coins you want to bet').setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('connect4')
            .setDescription('Challenge someone to Connect 4!')
            .addUserOption(option => option.setName('user').setDescription('Select the user you want to challenge!').setRequired(true))
            .addIntegerOption(option => option.setName('bet').setDescription('Enter how many Cat Coins you want to bet').setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('vault')
            .setDescription('Crack the vault and win some coins!')
            .addStringOption(option => option.setName('difficulty').setDescription('Select the difficulty you want to play at!').setRequired(true).setChoices(
                { name: 'Hard', value: 'Hard' },
                { name: 'Medium', value: 'Medium' },
                { name: 'Easy', value: 'Easy' }
            ))
            .addStringOption(option => option.setName('type').setDescription('Select the type of questions you want to solve!').setRequired(true).setChoices(
                { name: 'Sequence', value: 'Sequence' },
                { name: 'Math Equations', value: 'Math Equations' }
            ))
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
            case 'rps':
                return await gameRps(interaction);
            case 'hangman':
                return await gameHangman(interaction);
            case 'tic-tac-toe':
                return await gameTicTacToe(interaction);
            case 'connect4':
                return await gameConnect4(interaction);
            case 'vault':
                return await gameVault(interaction);
            default:
                return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};
