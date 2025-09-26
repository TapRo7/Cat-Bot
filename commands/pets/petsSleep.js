const { MessageFlags, ButtonStyle, ButtonBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { getUserPet, customUpdateUserPet } = require('../../database/pets');
const { getPetCareStatus, capitalizeFirstLetter } = require('../../utils/pets');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const makeBedButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Make the Bed')
    .setEmoji('🛏️')
    .setStyle(ButtonStyle.Primary);

const tuckCatButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Tuck In')
    .setEmoji('🐱')
    .setStyle(ButtonStyle.Success);

const nightKissButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Goodnight Kiss')
    .setEmoji('😽')
    .setStyle(ButtonStyle.Primary);

const catSleepButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Sleep')
    .setEmoji('💤')
    .setStyle(ButtonStyle.Success);

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

function formatNeedsList(needs) {
    if (needs.length === 0) return '';
    if (needs.length === 1) return needs[0];
    if (needs.length === 2) return `${needs[0]} and ${needs[1]}`;
    return `${needs.slice(0, -1).join(', ')}, and ${needs[needs.length - 1]}`;
}

module.exports = async (interaction) => {
    const userPetData = await getUserPet(interaction.user.id);

    if (!userPetData) {
        return await interaction.editReply({ content: `You have not registered a pet yet, please use </pet register:1416420485721362433> to register before using other commands!` });
    }

    const petConfigData = interaction.client.petSkins.get(userPetData.petId);
    const petNameEmojiString = `**${userPetData.petName} ${petConfigData.emoji}**`;

    if (userPetData.isInHotel) {
        return await interaction.editReply({ content: `${petNameEmojiString} is at the hotel! ${capitalizeFirstLetter(userPetData.pronoun)} is being looked after by the hotel, you can relax.\n${capitalizeFirstLetter(userPetData.pronoun)} will return from the hotel <t:${userPetData.hotelUntil}:R>` });
    }

    let now = Math.floor(Date.now() / 1000);

    const petSleepHours = interaction.client.petConfig.rarityCareConfig.sleepHours[petConfigData.rarityNumber];
    const petSleepSeconds = petSleepHours * 60 * 60;

    if (userPetData.lastSlept > now - petSleepSeconds) {
        const wakeUpIn = (userPetData.lastSlept + petSleepSeconds) - now;
        const wakeUpInMinutes = Math.ceil(wakeUpIn / 60);
        const timeText = wakeUpInMinutes >= 60
            ? `${Math.ceil(wakeUpInMinutes / 60)} hour${wakeUpInMinutes >= 120 ? 's' : ''}`
            : `${wakeUpInMinutes} minute${wakeUpInMinutes > 1 ? 's' : ''}`;
        return await interaction.editReply({ content: `${petNameEmojiString} is already sleeping! ${capitalizeFirstLetter(userPetData.pronoun)} will wake up in ${timeText}` });
    }

    const petCareStatusFull = await getPetCareStatus(userPetData, petConfigData, interaction.client.petConfig.rarityCareConfig);
    const dueCareCount = Object.values(petCareStatusFull.careStatus).filter(c => c.due).length;

    const requiredUnmetNeeds = Object.entries(petCareStatusFull.careStatus)
        .filter(([need, data]) => data.due && need !== 'sleep')
        .map(([_, data]) => data.title);

    if (requiredUnmetNeeds.length > 0) {
        return await interaction.editReply({ content: `${petNameEmojiString} cannot sleep yet! ${userPetData.pronoun} still needs to **${formatNeedsList(requiredUnmetNeeds)}** before going to sleep!` });
    }

    const petCareStatus = petCareStatusFull.careStatus.sleep;

    if (!petCareStatus.due) {
        return await interaction.editReply({ content: `${petNameEmojiString} does not want to sleep right now!` });
    }

    const buttonIntFilter = btnInt => {
        return (btnInt.customId === 'catCareButton') && btnInt.user.id === interaction.user.id;
    };

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
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Make the bed for the Cat!'))
            .setButtonAccessory(makeBedButton)
        );

    const petMessage = await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });

    const bedMade = await waitForButton(petMessage, buttonIntFilter);

    if (bedMade === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t make the bed in time, ${userPetData.petName} still needs to go to sleep!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('# ' + '🛏️' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Tuck the Cat in!'))
            .setButtonAccessory(tuckCatButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const catTucked = await waitForButton(petMessage, buttonIntFilter);

    if (catTucked === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t tuck the cat in bed in time, ${userPetData.petName} still needs to go to sleep!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('# ' + '🛌' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Give the Cat a goodnight kiss!'))
            .setButtonAccessory(nightKissButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const catKissed = await waitForButton(petMessage, buttonIntFilter);

    if (catKissed === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t kiss the cat goodnight in time, ${userPetData.petName} still needs to go to sleep!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('# ' + '🛌' + petConfigData.emoji + '😻')
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Put the Cat to sleep!'))
            .setButtonAccessory(catSleepButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const catAsleep = await waitForButton(petMessage, buttonIntFilter);

    if (catAsleep === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t put the cat to sleep in time, ${userPetData.petName} still needs to go to sleep!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('# ' + '💤' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('Your cat has been put to sleep! You\'ve earned 1 relationship point')
        );

    now = Math.floor(Date.now() / 1000);

    const petUpdateSet = {
        lastSlept: now
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