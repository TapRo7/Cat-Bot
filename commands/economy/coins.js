const { SlashCommandBuilder, MessageFlags, TextChannel } = require('discord.js');

const coinsRegister = require('./coinsRegister');
const coinsDaily = require('./coinsDaily');
const coinsHourly = require('./coinsHourly');
const coinsProfile = require('./coinsProfile');
const coinsLeaderboard = require('./coinsLeaderboard');

module.exports = {
	cooldown: 5,
	subCooldowns: {
		'register': 600,
		'leaderboard': 60,
	},
	data: new SlashCommandBuilder()
		.setName('coins')
		.setDescription('Cat Coin Commands')
		.addSubcommand(subcommand => subcommand
			.setName('register')
			.setDescription('Register in the Cat Coins System!')
		)
		.addSubcommand(subcommand => subcommand
			.setName('daily')
			.setDescription('Get your daily dose of free Cat Coins!')
		)
		.addSubcommand(subcommand => subcommand
			.setName('hourly')
			.setDescription('Get your hourly dose of free Cat Coins!')
		)
		.addSubcommand(subcommand => subcommand
			.setName('profile')
			.setDescription('Check your or someone else\'s profile!')
			.addUserOption(option => option.setName('user').setDescription('Select a user to check the profile of'))
		)
		.addSubcommand(subcommand => subcommand
			.setName('leaderboard')
			.setDescription('Check the top users leaderboard for Cat Coins!')
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
				return await coinsRegister(interaction);
			case 'daily':
				return await coinsDaily(interaction);
			case 'hourly':
				return coinsHourly(interaction);
			case 'profile':
				return await coinsProfile(interaction);
			case 'leaderboard':
				return await coinsLeaderboard(interaction);
			default:
				return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
		}
	}
};
