const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

async function petRoll(petSkins, rarityNumber) {
    const pets = petSkins.filter(p => p.rarityNumber === rarityNumber);

    const totalWeight = pets.reduce((sum, pet) => sum + pet.weight, 0);

    let roll = Math.random() * totalWeight;

    for (const pet of pets) {
        if (roll < pet.weight) {
            return pet;
        }
        roll -= pet.weight;
    }
}

function rarityCatsString(petsConfig) {
    const rarityGroups = {};

    for (const pet of petsConfig.petSkins) {
        const rarityName = petsConfig.rarityNames[pet.rarityNumber] || 'Unknown';
        if (!rarityGroups[rarityName]) {
            rarityGroups[rarityName] = [];
        }
        rarityGroups[rarityName].push(pet.emoji);
    }

    let result = '';
    for (const [rarityName, emojis] of Object.entries(rarityGroups)) {
        result += `### ${rarityName}\n# ${emojis.join(' ')}\n\n`;
    }

    return result.trim();
}

async function getPetCareStatus(userPetData, petConfigData, rarityCareConfig, returnCosts = false) {
    const rarity = petConfigData.rarityNumber;
    const now = Math.floor(Date.now() / 1000);

    const careTypes = {
        feed: {
            last: userPetData.lastFed,
            interval: rarityCareConfig.feedIntervalHours[rarity] * 3600,
            cost: rarityCareConfig.feedCost[rarity],
            title: 'Eat'
        },
        bath: {
            last: userPetData.lastBathed,
            interval: rarityCareConfig.bathIntervalHours[rarity] * 3600,
            cost: rarityCareConfig.bathCost[rarity],
            title: 'Bathe'
        },
        play: {
            last: userPetData.lastPlayed,
            interval: rarityCareConfig.playIntervalHours[rarity] * 3600,
            title: 'Play'
        },
        sleep: {
            last: userPetData.lastSlept,
            interval: rarityCareConfig.sleepIntervalHours[rarity] * 3600,
            title: 'Sleep'
        },
        toilet: {
            last: userPetData.lastToilet,
            interval: rarityCareConfig.toiletIntervalHours[rarity] * 3600,
            cost: rarityCareConfig.toiletCost[rarity],
            title: 'Potty'
        }
    };

    const careStatus = {};
    let completed = 0;
    let pendingCare = ``;

    for (const [type, data] of Object.entries(careTypes)) {
        const due = (now - data.last) > data.interval;
        careStatus[type] = {
            due,
            cost: data.cost ?? 0,
            title: data.title
        };
        if (!due) {
            completed++;
        } else {
            pendingCare += `- ${data.title}\n`;
        }
    }

    if (pendingCare === ``) {
        pendingCare = '- Your cat is fully cared for!';
    } else {
        pendingCare = pendingCare.slice(0, -1);
    }

    const happinessLevels = ['Depressed', 'Sad', 'Grumpy', 'Okay', 'Happy', 'Overjoyed'];
    const catHappiness = happinessLevels[completed];

    const total = Object.keys(careTypes).length;

    return {
        careStatus,
        pendingCare,
        completed,
        total,
        catHappiness
    };
}


async function petDisplayBuilder(userPetData, petConfigData, rarityCareConfig) {
    const { catHappiness, completed, total, pendingCare } = await getPetCareStatus(userPetData, petConfigData, rarityCareConfig);
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
            .setContent(`## Cat Type\n- **${petConfigData.rarityName}** - ${petConfigData.name}\n## Cat Mood\n- ${catHappiness} (${completed}/${total})\n## Cat Needs\n${pendingCare}\n## Relationship Points\n- ${userPetData.relationshipPoints}`)
        );

    return petContainer;
}

function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { petRoll, petDisplayBuilder, getPetCareStatus, capitalizeFirstLetter, rarityCatsString };