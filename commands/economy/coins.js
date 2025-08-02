const { SlashCommandBuilder, MessageFlags } = require('discord.js');

const coinsRegister = require('./coinsRegister');
const coinsDaily = require('./coinsDaily');
const coinsCheck = require('./coinsCheck');

module.exports = {
	cooldown: 5,
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
			.setName('check')
			.setDescription('Check your or someone else\'s Cat Coins!')
			.addUserOption(option => option.setName('user').setDescription('Select a user to check the Cat Coin\'s of').setRequired(false))
		),

	async execute(interaction) {
		await interaction.deferReply();

		const sub = interaction.options.getSubcommand();

		switch (sub) {
			case 'register':
				return await coinsRegister(interaction);
			case 'daily':
				return await coinsDaily(interaction);
			case 'check':
				return await coinsCheck(interaction);
			default:
				return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
		}
	}
};
