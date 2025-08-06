const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const gameRps = require('./gamesRps');
//const newGame = require('./newGame');
//const newGame = require('./newGame');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('games')
        .setDescription('Cat Coin Games')
        .addSubcommand(subcommand => subcommand
            .setName('rps')
            .setDescription('Challenge someone to Rock Paper Scissors!')
            .addUserOption(option => option.setName('user').setDescription('Select the user you want to challenge!').setRequired(true))
            .addIntegerOption(option => option.setName('bet').setDescription('Enter how many Cat Coins you want to bet').setRequired(true))
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case 'rps':
                return await gameRps(interaction);
            default:
                return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};
