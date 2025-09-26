const { MessageFlags, SeparatorBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, ContainerBuilder } = require('discord.js');
const { getUserPet, updateUserPet } = require('../../database/pets');
const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');
const { capitalizeFirstLetter } = require('../../utils/pets');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catAcceptEmoji = '<a:yes:1403153341780988006>';
const catRejectEmoji = '<a:no:1403153353407725710>';

const dailySeconds = 86400;
const hotelCooldownSeconds = dailySeconds * 3;
const maxHotelDays = 4;

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
    const days = interaction.options.getInteger('days');
    const petReturn = interaction.options.getString('return');

    if (!days && !petReturn) {
        return await interaction.editReply({ content: 'Please provide either the number of `days` to book the hotel, or select **Yes** in the `return` to return your pet early.' });
    }

    if (days && petReturn) {
        return await interaction.editReply({ content: 'You cannot select both a number of `days` and the `return` option. Please choose one action.' });
    }

    const userPetData = await getUserPet(interaction.user.id);
    const petConfigData = interaction.client.petSkins.get(userPetData.petId);
    const petNameEmojiString = `**${userPetData.petName} ${petConfigData.emoji}**`;
    const now = Math.floor(Date.now() / 1000);

    if (petReturn) {
        if (userPetData.isInHotel) {
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
                    .setContent(`Are you sure you want to bring back ${userPetData.petName} from the hotel?\nYour hotel fees will not be refunded!`)
                )
                .addActionRowComponents(actionRow => actionRow
                    .addComponents(acceptButton, rejectButton)
                );

            const petMessage = await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });

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
                petContainer.spliceComponents(petContainer.components.length - 2, 2);
                petContainer.addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(`You cancelled the return`)
                );

                return await petMessage.edit({ components: [petContainer] });
            }

            if (confirmResult === 'timeout') {
                petContainer.spliceComponents(petContainer.components.length - 2, 2);
                petContainer.addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(`You did not confirm the return in time`)
                );

                return await petMessage.edit({ components: [petContainer] });
            }

            petUpdate = {
                hotelUntil: now
            };
            await updateUserPet(interaction.user.id, petUpdate);
            petContainer.spliceComponents(petContainer.components.length - 2, 2);
            petContainer.addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`${petNameEmojiString} is on the way back from the hotel! ${capitalizeFirstLetter(userPetData.pronoun)} will return home soon.`)
            );

            return await petMessage.edit({ components: [petContainer] });
        }

        return await interaction.editReply({ content: `${petNameEmojiString} can't be returned, beacause ${userPetData.pronoun} is not at the hotel!` });
    }

    if (days < 1) {
        return await interaction.editReply({ content: 'You cannot book the pet hotel for 0 days!' });
    }

    if (days > maxHotelDays) {
        return await interaction.editReply({ content: 'The pet hotel only has booking available for 4 days! Please try a lower amount of days.' });
    }

    if (!userPetData) {
        return await interaction.editReply({ content: `You have not registered a pet yet, please use </pet register:1416420485721362433> to register before using other commands!` });
    }

    if (userPetData.isInHotel) {
        return await interaction.editReply({ content: `${petNameEmojiString} is already at the hotel! Your pet will return at <t:${userPetData.hotelUntil}:F>` });
    }

    if (userPetData.lastHotel + hotelCooldownSeconds > now) {
        return await interaction.editReply({ content: `${petNameEmojiString} was sent to the hotel recently! You need to wait until <t:${userPetData.lastHotel + hotelCooldownSeconds}:F> to send your pet to the hotel again` });
    }

    const dailyHotelCost = interaction.client.petConfig.rarityCareConfig.dailyHotelCosts[petConfigData.rarityNumber];
    const totalHotelCost = days * dailyHotelCost;

    const userData = await getCatCoinsUser(interaction.user.id);

    if (totalHotelCost > userData.coins) {
        return await interaction.editReply(({ content: `Sending ${petNameEmojiString} to the hotel for ${days} days costs **${totalHotelCost} Cat Coins ${catCoinEmoji}**, you do not have enough coins!` }));
    }

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
            .setContent(`Sending ${userPetData.petName} to the hotel for ${days} days will cost **${totalHotelCost} Cat Coins ${catCoinEmoji}**, are you sure you want to continue?`)
        )
        .addActionRowComponents(actionRow => actionRow
            .addComponents(acceptButton, rejectButton)
        );

    const petMessage = await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });

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
        petContainer.spliceComponents(petContainer.components.length - 2, 2);
        petContainer.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`You cancelled the hotel booking`)
        );

        return await petMessage.edit({ components: [petContainer] });
    }

    if (confirmResult === 'timeout') {
        petContainer.spliceComponents(petContainer.components.length - 2, 2);
        petContainer.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`You did not confirm the hotel booking in time`)
        );

        return await petMessage.edit({ components: [petContainer] });
    }

    const userUpdate = {
        $inc: {
            coins: -totalHotelCost
        }
    };
    await customUpdateCatCoinsUser(interaction.user.id, userUpdate);

    const hotelUntil = now + (dailySeconds * days);

    const petUpdate = {
        isInHotel: true,
        hotelUntil
    };
    await updateUserPet(interaction.user.id, petUpdate);

    petContainer.spliceComponents(petContainer.components.length - 2, 2);
    petContainer.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`${userPetData.petName} has been sent to the hotel! ${capitalizeFirstLetter(userPetData.pronoun)} will be looked after by the hotel until <t:${hotelUntil}:F>`)
    );

    await petMessage.edit({ components: [petContainer] });
};