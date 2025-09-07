const { SlashCommandBuilder, MessageFlags, TextChannel } = require('discord.js');

const petsRegister = require('./petsRegister');

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('pet')
        .setDescription('Pet Commands')
        .addSubcommand(subcommand => subcommand
            .setName('register')
            .setDescription('Register your own pet cat!')
            .addStringOption(option => option
                .setName('name')
                .setDescription('Give your pet a name!')
                .setMaxLength(10)
                .setMinLength(3)
                .setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('feed')
            .setDescription('Feed your cat!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('toilet')
            .setDescription('Take your cat to the toilet!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('bath')
            .setDescription('Give your cat a bath!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('sleep')
            .setDescription('Put your cat to sleep!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('skin')
            .setDescription('Get a new skin for your cat!')
            .addStringOption(option => option.setName('rarity').setDescription('Select the rarity of skin you want to roll for').setRequired(true).setChoices(
                { name: 'Special', value: '0' },
                { name: 'Luxury', value: '1' },
                { name: 'Classic', value: '2' },
                { name: 'Street', value: '3' }
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
            case 'register':
                return await petsRegister(interaction);
            case 'feed':
                return;
            case 'toilet':
                return;
            case 'bath':
                return;
            case 'sleep':
                return;
            case 'skin':
                return;
            default:
                return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};
