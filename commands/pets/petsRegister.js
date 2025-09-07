const { MessageFlags } = require('discord.js');
const { registerPet, getUserPet } = require('../../database/pets');
const { petRoll, petDisplayBuilder } = require('../../utils/pets');

const startingPetTier = '3';

module.exports = async (interaction) => {
    const petName = interaction.options.getString('name');

    const userPetData = await getUserPet(interaction.user.id);

    if (userPetData) {
        return await interaction.editReply({ content: 'You are already have a pet! You can only have one pet at a time.' });
    }

    const selectedPet = await petRoll(interaction.client.petConfig.petSkins, startingPetTier);

    const { registered, newPet } = await registerPet(interaction.user.id, petName, selectedPet.id);

    if (!registered) {
        return await interaction.editReply({ content: 'Something went wrong, please try again later.' });
    }

    const petConfigData = interaction.client.petSkins.get(newPet.petId);

    const petContainer = await petDisplayBuilder(newPet, petConfigData, interaction.client.petConfig.rarityCareConfig);

    await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });
};