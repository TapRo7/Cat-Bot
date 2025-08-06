const { Events, MediaGalleryBuilder, SeparatorSpacingSize, ContainerBuilder, MessageFlags, ButtonStyle } = require('discord.js');
const { getCatCoinsUser, updateCatCoinsUser } = require('../database/catCoins');
require('dotenv').config();

const whitelistedUsers = JSON.parse(process.env.WHITELISTED_USERS);
const generalChatId = process.env.GENERAL_CHAT_ID;
const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const luckyMessageCoins = 100;

function chance(numerator, denominator) {
    return Math.random() < numerator / denominator;
}

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        try {
            if (message.channel.id === generalChatId) {
                if (chance(1, 1000)) {
                    const userData = await getCatCoinsUser(message.author.id);

                    if (!userData) {
                        return;
                    }

                    const coins = userData.coins;
                    const newCoins = coins + luckyMessageCoins;

                    const updatedUserData = {
                        coins: newCoins
                    };

                    const updated = await updateCatCoinsUser(message.author.id, updatedUserData);

                    if (updated) {
                        return await message.reply({ content: `Congratulations! You hit a 0.1% chance lucky message, you\'ve been rewarded **${luckyMessageCoins} Cat Coins** ${catCoinEmoji}` });
                    }
                }
            }
        } catch (error) {
            console.error(`Error in Message Jackpot: ${error}`);
        }


        // Admin Commands below this
        if (!whitelistedUsers.includes(message.author.id)) return;

        if (message.content.includes('-msg')) {
            try {
                await message.delete();

                const newContent = message.content.replace('-msg', '').trim();
                await message.channel.send({ content: newContent });
            } catch (error) {
                console.error(`Error in -msg command: ${error}`);
            }
        }

        if (message.content === '-embed') {
            const rulesImageGallery = new MediaGalleryBuilder()
                .addItems(
                    MediaGalleryItem => MediaGalleryItem.setURL('https://cdn.discordapp.com/attachments/1397400389602508901/1401537448793608222/0jurTm5.png')
                );

            const rulesContainer = new ContainerBuilder()
                .addMediaGalleryComponents(rulesImageGallery)
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🐾 Be Pawsitive and Respectful\nTreat every cat (and human) with kindness. No hissing, scratching, or rude behavior allowed.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🐈 No Catfights\nKeep drama out of the server. Disagreements? Settle them calmly or bring in a mod (like the wise old tomcat).')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🚫 No Littering\nSpamming, flooding, or posting irrelevant links will get you scooped out.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🐟 Keep the Catnip Clean\nThis is a cozy space! No NSFW, offensive, or disturbing content. Let’s keep the fur unruffled.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🧶 Stay in Your Box\nStick to the right channels—don\'t bring yarn (off-topic stuff) into the wrong corner of the house.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 📋 No Copycats Allowed\nRespect others\' work and words. No stealing art, ideas, or identities.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🎭 Be Your True Kitty Self\nNo impersonation of others, especially staff. That’s just not purr-lite.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🔊 Meow with Care\nIn voice channels, keep background noise down and don’t hog the mic like a hungry kitten.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🚪 Respect the Kitty Keepers (Mods)\nOur modcats are here to help. Follow their guidance and don\'t chase the tail of justice.')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('## 🪀 Have Fun and Stay Fluffy!\nShare your memes, paw pics, and good vibes. This server\'s all about cozy community!')
                )
                .addSeparatorComponents(
                    separator => separator.setSpacing(SeparatorSpacingSize.Large)
                )
                .addSectionComponents(
                    section => section
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent('## <:OfficerWumpus:1401543172861202556> Follow Discord Guidelines\nMake sure to always follow the Discord\'s **Terms of Service** and **Community Guidelines**!')
                        )
                        .setButtonAccessory(
                            button => button
                                .setLabel('Discord Community Guidelines')
                                .setStyle(ButtonStyle.Link)
                                .setURL('https://discord.com/guidelines')
                        )
                );

            await message.delete();
            await message.channel.send({ components: [rulesContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
};