const { Events, MediaGalleryBuilder, SeparatorSpacingSize, ContainerBuilder, MessageFlags, ButtonStyle, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../database/catCoins');
const { fetchInviteInfo } = require('../utils/inviteApi');

const whitelistedUsers = JSON.parse(process.env.WHITELISTED_USERS);
const generalChatId = process.env.GENERAL_CHAT_ID;
const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const luckyMessageCoins = 100;
const boosterMultiplier = 2;

function chance(numerator, denominator) {
    return Math.random() < numerator / denominator;
}

const claimDropButton = new ButtonBuilder()
    .setCustomId('claimDrop')
    .setLabel('Claim Drop')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(catCoinEmoji);

const claimDropRow = new ActionRowBuilder().addComponents(claimDropButton);

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        // Lucky Message
        try {
            if (message.channel.id === generalChatId) {
                if (chance(1, 1000)) {
                    const userData = await getCatCoinsUser(message.author.id);

                    if (!userData) {
                        return;
                    }

                    let coinsToAdd;

                    if (message.member.premiumSince) {
                        coinsToAdd = luckyMessageCoins * boosterMultiplier;
                    } else {
                        coinsToAdd = luckyMessageCoins;
                    }

                    const updatedUserData = {
                        $inc: {
                            coins: coinsToAdd
                        }
                    };

                    const updated = await customUpdateCatCoinsUser(message.author.id, updatedUserData);

                    if (updated) {
                        return await message.reply({ content: `Congratulations! You hit a 0.1% chance lucky message, you\'ve been rewarded **${coinsToAdd} Cat Coins** ${catCoinEmoji}` });
                    }
                }
            }
        } catch (error) {
            console.error(`Error in Message Jackpot: ${error}`);
        }

        // Cat Coin Chat Drops
        try {
            if (message.channel.id === generalChatId) {
                if (chance(1, 100)) {
                    await message.channel.send({ content: `Lucky Drop! First one to click the button will earn free **Cat Coins** ${catCoinEmoji}`, components: [claimDropRow] });
                }
            }
        } catch (error) {
            console.error(`Error in Cat Coin Drops: ${error}`);
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

        if (message.content.includes('-drop')) {
            try {
                await message.channel.send({ content: `Lucky Drop! First one to click the button will earn free **Cat Coins** ${catCoinEmoji}`, components: [claimDropRow] });
            } catch (error) {
                console.error(`Error in Cat Coin Drops: ${error}`);
            }
        }

        if (message.content.includes('-invite')) {
            try {
                await message.delete();

                const memberId = message.content.replace('-invite', '').trim();
                const member = message.guild.members.cache.get(memberId);

                if (!member) return;

                const guildId = message.guild.id;

                const memberInviteInfo = await fetchInviteInfo(guildId, memberId);

                if (memberInviteInfo) {
                    const inviteLogEmbed = new EmbedBuilder()
                        .setColor(0xFFC0CB)
                        .setTitle('Invite Log')
                        .setAuthor({ name: `${member.user.username} (${member.id})`, iconURL: member.displayAvatarURL() })
                        .addFields(
                            { name: 'Inviter', value: `<@${memberInviteInfo.inviterId}> (${memberInviteInfo.inviterId})` },
                            { name: 'Invite Code', value: memberInviteInfo.inviteCode }
                        );

                    await message.channel.send({ embeds: [inviteLogEmbed] });
                } else {
                    const inviteLogEmbed = new EmbedBuilder()
                        .setColor(0xFFC0CB)
                        .setTitle('Invite Log')
                        .setAuthor({ name: `${member.user.username} (${member.id})`, iconURL: member.displayAvatarURL() })
                        .addFields(
                            { name: 'Inviter', value: 'Unknown' },
                            { name: 'Invite Code', value: 'Unknown' }
                        );

                    await message.channel.send({ embeds: [inviteLogEmbed] });
                }
            } catch (error) {
                console.error(`Error in -invite command: ${error}`);
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