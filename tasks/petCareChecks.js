const { ContainerBuilder, MessageFlags } = require('discord.js');
const { getAllPets, deleteUserPet, updateUserPet } = require('../database/pets');
const { customUpdateCatCoinsUser } = require('../database/catCoins');
const { getPetCareStatus } = require('../utils/pets');

const notificationChannel = process.env.NOTIFICATION_CHANNEL_ID;
const dailySeconds = 86400;
const catCoinEmoji = '<:CatCoin:1401235223831642133>';

module.exports = {
    name: 'Pet Care Checks',
    intervalSeconds: 60,
    async run(client) {
        const now = Math.floor(Date.now() / 1000);
        const pets = await getAllPets();
        const penalties = client.petConfig.neglectPenalties;
        const channel = await client.channels.cache.get(notificationChannel);

        for (const pet of pets) {
            const petConfigData = client.petSkins.get(pet.petId);

            if (!pet.lastCareComplete) {
                continue;
            }

            const timeSinceCare = now - pet.lastCareComplete;
            const daysNeglected = Math.floor(timeSinceCare / dailySeconds);

            if (daysNeglected >= 7) {
                const petCareStatus = await getPetCareStatus(pet, petConfigData, client.petConfig.rarityCareConfig);

                if (petCareStatus.completed === petCareStatus.total) {
                    await updateUserPet(pet.userId, { lastCareComplete: now });
                    continue;
                }

                const neglectPenalty = penalties['day7'];

                const container = new ContainerBuilder()
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(`<@${pet.userId}> **${pet.petName} ${petConfigData.emoji}** has run away due to neglect after 7 days without care.\n\nYou have been charged a fine of **${neglectPenalty} Cat Coins** ${catCoinEmoji} by the **Alberto Cat Federation** for neglecting your cat.`));

                const userUpdate = {
                    $inc: {
                        coins: -neglectPenalty
                    }
                };

                await customUpdateCatCoinsUser(pet.userId, userUpdate);
                await deleteUserPet(pet.userId);

                await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

                continue;
            }

            if (daysNeglected >= 1 && daysNeglected <= 6) {
                const petCareStatus = await getPetCareStatus(pet, petConfigData, client.petConfig.rarityCareConfig);

                if (petCareStatus.completed === petCareStatus.total) {
                    await updateUserPet(pet.userId, { lastCareComplete: now });
                    continue;
                }

                const dayKey = `day${daysNeglected}`;
                if (!pet.careWarnings[dayKey]) {
                    const dayWord = daysNeglected === 1 ? 'day' : 'days';

                    const neglectPenalty = penalties[dayKey];

                    const container = new ContainerBuilder()
                        .addTextDisplayComponents(textDisplay => textDisplay.setContent(`<@${pet.userId}> you haven't completed care for **${pet.petName} ${petConfigData.emoji}** in ${daysNeglected} ${dayWord}! Please look after your pet or ${pet.pronoun} may abandon you!\n\nYou have been charged a fine of **${neglectPenalty} Cat Coins** ${catCoinEmoji} by the **Alberto Cat Federation** for neglecting your cat.`));

                    const userUpdate = {
                        $inc: {
                            coins: -neglectPenalty
                        }
                    };
                    pet.careWarnings[dayKey] = true;

                    await customUpdateCatCoinsUser(pet.userId, userUpdate);
                    await updateUserPet(pet.userId, { careWarnings: pet.careWarnings });

                    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
                }
            }
        }
    }
};