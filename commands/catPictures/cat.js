const { SlashCommandBuilder, EmbedBuilder, TextChannel } = require('discord.js');
const { getRandomCatUrl } = require('../../catAPI/catPictures');

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Get a random cat picture!'),

    async execute(interaction) {
        await interaction.deferReply();

        if (!interaction.guild) {
            return await interaction.editReply('This command can only be used in a server!');
        }

        if (!(interaction.channel instanceof TextChannel)) {
            return await interaction.editReply({ content: 'This command can only be used in a Text Channel.' });
        }

        const randomCatUrl = await getRandomCatUrl();

        const catEmbed = new EmbedBuilder()
            .setTitle('Meow')
            .setImage(randomCatUrl)
            .setColor(0xFFC0CB);

        await interaction.editReply({ embeds: [catEmbed] });
    }
};
