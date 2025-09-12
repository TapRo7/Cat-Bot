const { ContainerBuilder, MessageFlags } = require('discord.js');
const { getAllPets, deleteUserPet, updateUserPet } = require('../database/pets');

const dailyCatChannelId = process.env.NOTIFICATION_CHANNEL_ID;
const dailySeconds = 86400;

module.exports = {
    name: 'Pet Care Checks',
    intervalSeconds: 60,
    async run(client) {
        const now = Math.floor(Date.now() / 1000);
        const pets = await getAllPets();

        const channel = await client.channels.cache.get(dailyCatChannelId);

        for (const pet of pets) {
            const petConfigData = client.petSkins.get(pet.petId);

            if (!pet.lastCareComplete) {
                continue;
            }

            const timeSinceCare = now - pet.lastCareComplete;
            const daysNeglected = Math.floor(timeSinceCare / dailySeconds);

            if (daysNeglected >= 7) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(textDisplay => textDisplay.setContent(`<@${pet.userId}> 😿 Your pet **${pet.petName} ${petConfigData.emoji}** has run away due to neglect after 7 days without care.`));
                await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

                await deleteUserPet(pet.userId);
                continue;
            }

            if (daysNeglected >= 1 && daysNeglected <= 6) {
                const dayKey = `day${daysNeglected}`;
                if (!pet.careWarnings[dayKey]) {
                    const dayWord = daysNeglected === 1 ? 'day' : 'days';

                    const container = new ContainerBuilder()
                        .addTextDisplayComponents(textDisplay => textDisplay.setContent(`<@${pet.userId}> you haven't completed care for **${pet.petName} ${petConfigData.emoji}** in ${daysNeglected} ${dayWord}! Please look after your pet or they may abandon you!`));
                    await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });

                    pet.careWarnings[dayKey] = true;
                    await updateUserPet(pet.userId, { careWarnings: pet.careWarnings });
                }
            }
        }
    }
};