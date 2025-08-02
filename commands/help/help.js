const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Guide for the Cat Bot!'),

    async execute(interaction) {
        await interaction.deferReply();
    }
};
