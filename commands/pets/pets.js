const { SlashCommandBuilder, MessageFlags, TextChannel } = require('discord.js');
const { startCare, endCare } = require('../../utils/petCareLock');

const petsRegister = require('./petsRegister');
const petsSkin = require('./petsSkin');
const petsView = require('./petsView');
const petsEdit = require('./petsEdit');
const petsHotel = require('./petsHotel');
const petsFeed = require('./petsFeed');
const petsBath = require('./petsBath');
const petsToilet = require('./petsToilet');
const petsPlay = require('./petsPlay');
const petsSleep = require('./petsSleep');

const petCareCommands = ['feed', 'bath', 'toilet', 'play', 'sleep'];

module.exports = {
    cooldown: 20,
    subCooldowns: {
        'register': 300
    },
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
            .addStringOption(option => option.setName('gender').setDescription('Select the gender of your cat').setRequired(true).setChoices(
                { name: 'Male', value: 'he' },
                { name: 'Female', value: 'she' }
            ))
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
        )
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('View your cat!')
            .addUserOption(option => option.setName('user').setDescription('Select a user to check the pet of'))
        )
        .addSubcommand(subcommand => subcommand
            .setName('hotel')
            .setDescription('Send your cat to the hotel!')
            .addIntegerOption(option => option
                .setName('days')
                .setDescription('The number of days to send your cat away for')
                .setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('edit')
            .setDescription('Edit your cat!')
            .addStringOption(option => option
                .setName('name')
                .setDescription('Name for your pet')
                .setMaxLength(10)
                .setMinLength(3)
                .setRequired(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('feed')
            .setDescription('Feed your cat!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('bath')
            .setDescription('Give your cat a bath!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('toilet')
            .setDescription('Take your cat to the toilet!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('play')
            .setDescription('Play with your cat!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('sleep')
            .setDescription('Put your cat to sleep!')
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

        if (petCareCommands.includes(sub) && !startCare(interaction.user.id)) {
            return await interaction.editReply({ content: 'You are already using a care command, please only use one at a time.', flags: MessageFlags.Ephemeral });
        }

        switch (sub) {
            case 'register':
                return await petsRegister(interaction);
            case 'skin':
                return await petsSkin(interaction);
            case 'view':
                return await petsView(interaction);
            case 'edit':
                return await petsEdit(interaction);
            case 'hotel':
                return await petsHotel(interaction);
            case 'feed':
                try {
                    await petsFeed(interaction);
                } finally {
                    endCare(interaction.user.id);
                }
                return;
            case 'bath':
                try {
                    await petsBath(interaction);
                } finally {
                    endCare(interaction.user.id);
                }
                return;
            case 'toilet':
                try {
                    await petsToilet(interaction);
                } finally {
                    endCare(interaction.user.id);
                }
                return;
            case 'play':
                try {
                    await petsPlay(interaction);
                } finally {
                    endCare(interaction.user.id);
                }
                return;
            case 'sleep':
                try {
                    await petsSleep(interaction);
                } finally {
                    endCare(interaction.user.id);
                }
                return;
            default:
                return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};
