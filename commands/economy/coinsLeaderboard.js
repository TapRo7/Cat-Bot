const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ContainerComponent } = require('discord.js');
const { getTopCatCoinUsers } = require('../../database/catCoins');
require('dotenv').config();

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const defaultAvatarUrl = process.env.DEFAULT_AVATAR_URL;
const ignoredUsers = JSON.parse(process.env.IGNORE_LEADERBOARD_IDS);
const leaderboardLimit = 10 + ignoredUsers.length;

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

module.exports = async (interaction) => {
    const topUsers = await getTopCatCoinUsers(leaderboardLimit);

    const leaderboardContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## Cat Coins - Top #${leaderboardLimit - ignoredUsers.length} ${catCoinEmoji}`)
        )
        .addSeparatorComponents(largeSeparator);

    let positionNumber = 1;

    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];

        if (ignoredUsers.includes(user.userId)) {
            continue;
        }

        const member = interaction.guild.members.cache.get(user.userId);
        const memberIconUrl = member?.displayAvatarURL() ?? defaultAvatarUrl;

        leaderboardContainer
            .addSectionComponents(
                section => section
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(`${positionNumber}. <@${user.userId}>\n  - **Cat Coins: ** ${user.coins} ${catCoinEmoji}`)
                    )
                    .setThumbnailAccessory(
                        thumbnail => thumbnail.setURL(memberIconUrl)
                    )
            );

        positionNumber++;
    }

    return await interaction.editReply({ components: [leaderboardContainer], flags: MessageFlags.IsComponentsV2 });
};