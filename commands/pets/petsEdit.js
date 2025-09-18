const { MessageFlags, SeparatorBuilder, SeparatorSpacingSize, ContainerBuilder } = require('discord.js');
const { getUserPet, updateUserPet } = require('../../database/pets');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

module.exports = async (interaction) => {
    const petName = interaction.options.getString('name');

    const userPetData = await getUserPet(interaction.user.id);

    if (!userPetData) {
        return await interaction.editReply({ content: `You have not registered a pet yet, please use </pet register:1416420485721362433> to register before using other commands!` });
    }

    const updateData = {
        petName
    };
    await updateUserPet(interaction.user.id, updateData);

    const petConfigData = interaction.client.petSkins.get(userPetData.petId);

    const petContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`# ${petName}`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('# ' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`Your cat's data has been updated!`)
        );

    await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });
};