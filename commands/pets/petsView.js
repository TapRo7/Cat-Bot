const { MessageFlags } = require('discord.js');
const { getUserPet } = require('../../database/pets');
const { petDisplayBuilder } = require('../../utils/pets');

module.exports = async (interaction) => {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    const userPetData = await getUserPet(targetUser.id);

    if (!userPetData) {
        return await interaction.editReply({ content: `${targetUser.id === interaction.user.id ? 'You' : targetUser.username} You have not registered a pet yet, please use </pet register:1416420485721362433> to register before using other commands!` });
    }

    const petConfigData = interaction.client.petSkins.get(userPetData.petId);

    const petContainer = await petDisplayBuilder(userPetData, petConfigData, interaction.client.petConfig.rarityCareConfig);

    await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });
};