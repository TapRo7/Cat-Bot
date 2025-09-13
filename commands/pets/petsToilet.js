const { MessageFlags, ButtonStyle, ButtonBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { getUserPet, customUpdateUserPet } = require('../../database/pets');
const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');
const { getPetCareStatus, capitalizeFirstLetter } = require('../../utils/pets');

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

const goToToilet = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Go To Toilet')
    .setEmoji('🚽')
    .setStyle(ButtonStyle.Primary);

const catPoopButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Poop')
    .setEmoji('💩')
    .setStyle(ButtonStyle.Success);

const catPeeButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Pee')
    .setEmoji('💦')
    .setStyle(ButtonStyle.Primary);

const cleanCatButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Clean Cat')
    .setEmoji('🧻')
    .setStyle(ButtonStyle.Success);

const flushToilet = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Flush Toilet')
    .setEmoji('🪠')
    .setStyle(ButtonStyle.Primary);

async function waitForButton(message, filter, timeout = 60_000) {
    return new Promise(resolve => {
        const collector = message.createMessageComponentCollector({ filter, time: timeout, max: 1 });

        collector.on('collect', i => {
            resolve(true);
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                resolve('timeout');
            }
        });
    });
}

async function handleTimeout(message, timeoutText, spliceIndex, spliceRemoveCount, container) {
    container.spliceComponents(spliceIndex, spliceRemoveCount);
    container.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(timeoutText)
    );

    await message.edit({ components: [container] });
}

module.exports = async (interaction) => {
    const userPetData = await getUserPet(interaction.user.id);

    if (!userPetData) {
        return await interaction.editReply({ content: `You have not registered a pet yet, please use </pets register:1401243483649605752> to register before using other commands!` });
    }

    let now = Math.floor(Date.now() / 1000);

    const petConfigData = interaction.client.petSkins.get(userPetData.petId);
    const petNameEmojiString = `**${userPetData.petName} ${petConfigData.emoji}**`;

    const petSleepHours = interaction.client.petConfig.rarityCareConfig.sleepHours[petConfigData.rarityNumber];
    const petSleepSeconds = petSleepHours * 60 * 60;

    if (userPetData.lastSlept > now - petSleepSeconds) {
        const wakeUpIn = (userPetData.lastSlept + petSleepSeconds) - now;
        const wakeUpInMinutes = Math.ceil(wakeUpIn / 60);
        const timeText = wakeUpInMinutes >= 60
            ? `${Math.ceil(wakeUpInMinutes / 60)} hour${wakeUpInMinutes >= 120 ? 's' : ''}`
            : `${wakeUpInMinutes} minute${wakeUpInMinutes > 1 ? 's' : ''}`;
        return await interaction.editReply({ content: `${petNameEmojiString} is sleeping! ${capitalizeFirstLetter(userPetData.pronoun)} will wake up in ${timeText}` });
    }

    const petCareStatusFull = await getPetCareStatus(userPetData, petConfigData, interaction.client.petConfig.rarityCareConfig);
    const dueCareCount = Object.values(petCareStatusFull.careStatus).filter(c => c.due).length;

    const petCareStatus = petCareStatusFull.careStatus.toilet;

    if (!petCareStatus.due) {
        return await interaction.editReply({ content: `${petNameEmojiString} does not want to go to the toilet right now!` });
    }

    const userData = await getCatCoinsUser(interaction.user.id);

    if (petCareStatus.cost > userData.coins) {
        return await interaction.editReply(({ content: `Taking ${petNameEmojiString} to the toilet costs **${petCareStatus.cost} Cat Coins ${catCoinEmoji}**, you do not have enough coins!` }));
    }

    const petContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`# ${userPetData.petName}`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`Taking ${userPetData.petName} to the toilet will cost **${petCareStatus.cost} Cat Coins ${catCoinEmoji}**, are you sure you want to continue?`)
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
            textDisplay => textDisplay.setContent(`You cancelled the toilet, ${userPetData.petName} still has to go!`)
        );

        return await petMessage.edit({ components: [petContainer] });
    }

    if (confirmResult === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t accept the toilet in time, ${userPetData.petName} still has to go!`,
            petContainer.components.length - 2,
            2,
            petContainer
        );
    }

    const buttonIntFilter = btnInt => {
        return (btnInt.customId === 'catCareButton') && btnInt.user.id === interaction.user.id;
    };

    petContainer.spliceComponents(petContainer.components.length - 2, 2);
    petContainer.addSectionComponents(section => section
        .addTextDisplayComponents(textDisplay => textDisplay.setContent(`Take the Cat to the Toilet!`))
        .setButtonAccessory(goToToilet)
    );

    await petMessage.edit({ components: [petContainer] });

    const atToilet = await waitForButton(petMessage, buttonIntFilter);

    if (atToilet === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t go to the toilet in time, ${userPetData.petName} still has to go!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(petConfigData.emoji + '🚽')
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Help the Cat poop!'))
            .setButtonAccessory(catPoopButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const catPooped = await waitForButton(petMessage, buttonIntFilter);

    if (catPooped === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t help the cat poop in time, ${userPetData.petName} still has to go!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(petConfigData.emoji + '💩🚽')
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Help the Cat pee!'))
            .setButtonAccessory(catPeeButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const catPeed = await waitForButton(petMessage, buttonIntFilter);

    if (catPeed === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t help the cat pee in time, ${userPetData.petName} still has to go!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(petConfigData.emoji + '💦💩🚽')
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Clean the Cat!'))
            .setButtonAccessory(cleanCatButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const soapWashed = await waitForButton(petMessage, buttonIntFilter);

    if (soapWashed === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t clean the cat in time, ${userPetData.petName} still has to go!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent(petConfigData.emoji + '🧻🚽')
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Flush the Toilet!'))
            .setButtonAccessory(flushToilet)
        );

    await petMessage.edit({ components: [petContainer] });

    const toiletFlushed = await waitForButton(petMessage, buttonIntFilter);

    if (toiletFlushed === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t flush the toilet in time, ${userPetData.petName} still has to go!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('✨' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('Your cat has been to the toilet! You\'ve earned 1 relationship point')
        );

    const userUpdate = {
        $inc: {
            coins: -petCareStatus.cost
        }
    };
    await customUpdateCatCoinsUser(interaction.user.id, userUpdate);

    now = Math.floor(Date.now() / 1000);

    const petUpdateSet = {
        lastToilet: now
    };

    if (dueCareCount === 1) {
        petUpdateSet.lastCareComplete = now;
        petUpdateSet.careWarnings = {
            day1: false,
            day2: false,
            day3: false,
            day4: false,
            day5: false,
            day6: false
        };
        petContainer.addTextDisplayComponents(textDisplay => textDisplay
            .setContent(`You have completed all care for ${userPetData.petName}!`)
        );
    }

    const petUpdate = {
        $set: petUpdateSet,
        $inc: {
            relationshipPoints: 1
        }
    };

    await customUpdateUserPet(interaction.user.id, petUpdate);

    await petMessage.edit({ components: [petContainer] });
};