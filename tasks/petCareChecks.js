const { ContainerBuilder, MessageFlags } = require('discord.js');
const { getAllPets, deleteUserPet, updateUserPet } = require('../database/pets');
const { customUpdateCatCoinsUser } = require('../database/catCoins');
const { updateTemprolesConfig } = require('../database/config');
const { getPetCareStatus } = require('../utils/pets');

const notificationChannel = process.env.NOTIFICATION_CHANNEL_ID;
const punishmentRoleId = process.env.PUNISHMENT_ROLE_ID;
const punishmentSeconds = 86400 * 7;
const dailySeconds = 86400 + (6 * 3600);
const catCoinEmoji = '<:CatCoin:1401235223831642133>';

module.exports = {
    name: 'Pet Care Checks',
    intervalSeconds: 60,
    async run(client) {
        const now = Math.floor(Date.now() / 1000);
        const pets = await getAllPets();
        const penalties = client.petConfig.neglectPenalties;
        const channel = await client.channels.cache.get(notificationChannel);
        const guild = channel.guild;

        for (const pet of pets) {
            const petConfigData = client.petSkins.get(pet.petId);

            if (pet.isInHotel) {
                if (pet.hotelUntil < now) {
                    const petUpdate = {
                        lastFed: now,
                        lastBathed: now,
                        lastToilet: now,
                        lastPlayed: now,
                        lastSlept: now,
                        lastCareComplete: now,
                        careWarnings: {
                            'day1': false,
                            'day2': false,
                            'day3': false,
                            'day4': false,
                            'day5': false,
                            'day6': false,
                        },
                        isInHotel: false,
                        hotelUntil: 0,
                        lastHotel: now
                    };
                    await updateUserPet(pet.userId, petUpdate);

                    const container = new ContainerBuilder()
                        .setAccentColor(0x00FF00)
                        .addTextDisplayComponents(textDisplay => textDisplay.setContent(`<@${pet.userId}> **${pet.petName} ${petConfigData.emoji}** is back from the hotel!\n\nThank you for using our hotel services! Your pet has been returned fully refreshed and cared for.`));

                    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
                }
                continue;
            }

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
                    .setAccentColor(0xFF0000)
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(`<@${pet.userId}> **${pet.petName} ${petConfigData.emoji}** has run away due to neglect after 7 days without care.\n\nYou have been charged a fine of **${neglectPenalty} Cat Coins** ${catCoinEmoji} and banned from gambling for 1 week by the **Alberto Cat Federation** for neglecting your cat.`));

                const userUpdate = {
                    $inc: {
                        coins: -neglectPenalty,
                        totalPetAbandons: 1
                    },
                    $set: {
                        lastPetAbandon: now
                    }
                };
                await customUpdateCatCoinsUser(pet.userId, userUpdate);
                await deleteUserPet(pet.userId);

                const configUpdate = {
                    $push: {
                        rolesToRemove: {
                            userId: pet.userId,
                            removeAt: now + punishmentSeconds,
                            roleId: punishmentRoleId
                        }
                    }
                };

                await guild.members.addRole({ user: pet.userId, role: punishmentRoleId });
                await updateTemprolesConfig(configUpdate);

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
                        .setAccentColor(0xFFA500)
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