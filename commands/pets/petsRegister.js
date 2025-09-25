const { MessageFlags, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { registerPet, getUserPet } = require('../../database/pets');
const { getCatCoinsUser } = require('../../database/catCoins');
const { petRoll, petDisplayBuilder } = require('../../utils/pets');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const startingPetTier = '3';
const punishmentSeconds = 86400 * 7;

module.exports = async (interaction) => {
    const petName = interaction.options.getString('name');
    const pronoun = interaction.options.getString('gender');

    const playerData = await getCatCoinsUser(interaction.user.id);

    if (!playerData) {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    const now = Math.floor(Date.now() / 1000);

    if (playerData.lastPetAbandon > now + punishmentSeconds) {
        return await interaction.editReply({ content: `You have recently abandoned an old pet, you are not allowed to adopt a new one.\nYou can adopt a new pet after <t:${playerData.lastPetAbandon + punishmentSeconds}:F>` });
    }

    if (playerData.totalPetAbandons >= 3) {
        return await interaction.editReply({ content: 'You have abandoned pets too often, you\'ve been banned by the **Alberto Cat Federation** from adopting more pets.' });
    }

    const userPetData = await getUserPet(interaction.user.id);

    if (userPetData) {
        return await interaction.editReply({ content: 'You are already have a pet! You can only have one pet at a time.' });
    }

    const selectedPet = await petRoll(interaction.client.petConfig.petSkins, startingPetTier);

    const { registered, newPet } = await registerPet(interaction.user.id, petName, selectedPet.id, pronoun);

    if (!registered) {
        return await interaction.editReply({ content: 'Something went wrong, please try again later.' });
    }

    const petConfigData = interaction.client.petSkins.get(newPet.petId);

    const petContainer = await petDisplayBuilder(newPet, petConfigData, interaction.client.petConfig.rarityCareConfig);

    petContainer
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay.setContent('You have sucessfully registered your pet! Make sure to care for all its needs'));

    await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });
};