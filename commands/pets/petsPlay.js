const { MessageFlags, ButtonStyle, ButtonBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const { getUserPet, customUpdateUserPet } = require('../../database/pets');
const { getPetCareStatus, capitalizeFirstLetter } = require('../../utils/pets');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const getYarnButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Get Yarn')
    .setEmoji('🧶')
    .setStyle(ButtonStyle.Primary);

const throwYarnButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Throw Yarn')
    .setEmoji('🤾')
    .setStyle(ButtonStyle.Success);

const catFetchButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Fetch Yarn')
    .setEmoji('🐈')
    .setStyle(ButtonStyle.Primary);

const catPetButton = new ButtonBuilder()
    .setCustomId('catCareButton')
    .setLabel('Pet Cat')
    .setEmoji('🫳')
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

    const needsSleep = Object.entries(petCareStatusFull.careStatus)
        .filter(([need, data]) => data.due && need === 'sleep')
        .map(([_, data]) => data.title);

    if (needsSleep.length > 0) {
        return await interaction.editReply({ content: `${petNameEmojiString} is tired, ${userPetData.pronoun} doesn't want to play! ${capitalizeFirstLetter(userPetData.pronoun)} needs to **Sleep** before being able to play!` });
    }

    const petCareStatus = petCareStatusFull.careStatus.play;

    if (!petCareStatus.due) {
        return await interaction.editReply({ content: `${petNameEmojiString} does not want to play right now!` });
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
            .setContent(petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Get the Yarn to play!'))
            .setButtonAccessory(getYarnButton)
        );

    const petMessage = await interaction.editReply({ components: [petContainer], flags: MessageFlags.IsComponentsV2 });

    const yarnGotten = await waitForButton(petMessage, buttonIntFilter);

    if (yarnGotten === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t get the Yarn in time, ${userPetData.petName} still wants to play!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('🧶' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Toss the Yarn away!'))
            .setButtonAccessory(throwYarnButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const yarnThrown = await waitForButton(petMessage, buttonIntFilter);

    if (yarnThrown === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t toss the yarn in time, ${userPetData.petName} still wants to play!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('‼️' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Make the Cat fetch the Yarn!'))
            .setButtonAccessory(catFetchButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const yarnFetched = await waitForButton(petMessage, buttonIntFilter);

    if (yarnFetched === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t fetch the Yarn in time, ${userPetData.petName} still wants to play!`,
            petContainer.components.length - 1,
            1,
            petContainer
        );
    }

    petContainer.spliceComponents(petContainer.components.length - 3, 3);
    petContainer
        .addTextDisplayComponents(textDisplay => textDisplay
            .setContent('🧶' + petConfigData.emoji)
        )
        .addSeparatorComponents(largeSeparator)
        .addSectionComponents(section => section
            .addTextDisplayComponents(textDisplay => textDisplay.setContent('Pet the Cat for doing a good job!'))
            .setButtonAccessory(catPetButton)
        );

    await petMessage.edit({ components: [petContainer] });

    const catPetted = await waitForButton(petMessage, buttonIntFilter);

    if (catPetted === 'timeout') {
        return await handleTimeout(
            petMessage,
            `You didn\'t pet the cat in time, ${userPetData.petName} still wants to play!`,
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
            .setContent('Your cat has been played with! You\'ve earned 1 relationship point')
        );

    now = Math.floor(Date.now() / 1000);

    const petUpdateSet = {
        lastPlayed: now
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