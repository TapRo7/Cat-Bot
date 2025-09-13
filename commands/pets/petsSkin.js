const { MessageFlags, SeparatorBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, ContainerBuilder } = require('discord.js');
const { updateUserPet, getUserPet } = require('../../database/pets');
const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');
const { petRoll } = require('../../utils/pets');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catAcceptEmoji = '<a:yes:1403153341780988006>';
const catRejectEmoji = '<a:no:1403153353407725710>';

const acceptButton = new ButtonBuilder()
    .setCustomId('acceptCatAction')
    .setLabel('Accept')
    .setEmoji(catAcceptEmoji)
    .setStyle(ButtonStyle.Success);

const rejectButton = new ButtonBuilder()
    .setCustomId('rejectCatAction')
    .setLabel('Reject')
    .setEmoji(catRejectEmoji)
    .setStyle(ButtonStyle.Danger);

module.exports = async (interaction) => {
    const selectedRarity = interaction.options.getString('rarity');

    const userPetData = await getUserPet(interaction.user.id);

    if (!userPetData) {
        return await interaction.editReply({ content: `You have not registered a pet yet, please use </pet register:1416420485721362433> to register before using other commands!` });
    }

    const rarityRollPrice = interaction.client.petConfig.rarityRollPrices[selectedRarity];
    const rarityName = interaction.client.petConfig.rarityNames[selectedRarity];
    const userData = await getCatCoinsUser(interaction.user.id);

    if (rarityRollPrice > userData.coins) {
        return await interaction.editReply(({ content: `Getting a **${rarityName}** rarity skin costs **${rarityRollPrice} Cat Coins ${catCoinEmoji}**, you do not have enough coins!` }));
    }

    const confirmContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`Getting a **${rarityName}** rarity skin costs **${rarityRollPrice} Cat Coins ${catCoinEmoji}**, are you sure you want to continue?`)
        )
        .addSeparatorComponents(largeSeparator)
        .addActionRowComponents(actionRow => actionRow
            .addComponents(acceptButton, rejectButton)
        );

    const petMessage = await interaction.editReply({ components: [confirmContainer], flags: MessageFlags.IsComponentsV2 });

    const confirmFilter = btnInt => {
        return (btnInt.customId === 'acceptCatAction' || btnInt.customId === 'rejectCatAction') && btnInt.user.id === interaction.user.id;
    };

    const confirmResult = await new Promise((resolve) => {
        const collector = petMessage.createMessageComponentCollector({
            filter: confirmFilter,
            time: 60_000,
            max: 1
        });

        collector.on('collect', async btnInt => {
            resolve(btnInt.customId === 'acceptCatAction');
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                resolve('timeout');
            }
        });
    });

    if (confirmResult === false) {
        confirmContainer.spliceComponents(confirmContainer.components.length - 3, 3);
        confirmContainer.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`You cancelled the skin reroll.`)
        );

        return await petMessage.edit({ components: [confirmContainer] });
    }

    if (confirmResult === 'timeout') {
        confirmContainer.spliceComponents(confirmContainer.components.length - 3, 3);
        confirmContainer.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`You didn't confirm the reroll in time.`)
        );

        return await petMessage.edit({ components: [confirmContainer] });
    }

    const selectedPet = await petRoll(interaction.client.petConfig.petSkins, selectedRarity);

    const petConfigData = interaction.client.petSkins.get(selectedPet.id);

    const petContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`# ${userPetData.petName}`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('# ' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`## New Cat Skin\n- **${petConfigData.rarityName}** - ${petConfigData.name}`)
        );

    const userUpdate = {
        $inc: {
            coins: -rarityRollPrice
        }
    };
    await customUpdateCatCoinsUser(interaction.user.id, userUpdate);

    const petUpdate = {
        petId: selectedPet.id
    };
    await updateUserPet(interaction.user.id, petUpdate);

    await petMessage.edit({ components: [petContainer] });
};