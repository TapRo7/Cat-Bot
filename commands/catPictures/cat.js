const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRandomCatUrl } = require('../../catAPI/catPictures');

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Get a random cat picture!'),

    async execute(interaction) {
        await interaction.deferReply();

        const randomCatUrl = await getRandomCatUrl();

        const catEmbed = new EmbedBuilder()
            .setTitle('Meow')
            .setImage(randomCatUrl)
            .setColor(0xFFC0CB);

        await interaction.editReply({ embeds: [catEmbed] });
    }
};
