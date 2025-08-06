const { Events, EmbedBuilder } = require('discord.js');
const { getRandomCatUrl } = require('../catAPI/catPictures');
require('dotenv').config();

const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
const inviteLogChannelId = process.env.INVITE_LOG_CHANNEL_ID;
const inviteApiUrl = process.env.INVITE_API_URL;
const inviteApiToken = process.env.INVITE_API_TOKEN;

async function fetchInviteInfo(guildId, memberId) {
    const payload = {
        token: inviteApiToken,
        guildId,
        memberId
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetch(inviteApiUrl, options);
        if (response.status !== 200) {
            return null;
        }

        const responseJson = await response.json();
        if (!responseJson.inviterId || !responseJson.inviteCode) {
            return null;
        }
        return responseJson;
    } catch (error) {
        console.error(`Error in invite API fetch: ${error}`);
        return null;
    }
}

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const welcomeChannel = member.client.channels.cache.get(welcomeChannelId);

            if (welcomeChannel.guild.id !== member.guild.id) {
                return;
            }

            const randomCatImageUrl = await getRandomCatUrl();

            const welcomeEmbed = new EmbedBuilder()
                .setColor(0xFFC0CB)
                .setTitle('Welcome to the Catwitch Corner! <:Catblushy:1399804880587325451>')
                .setDescription('We hope you enjoy your time here at the Catwitch Corner, a comfy safe cuddly place that welcomes all kitties! <a:catkisses:1399809676710772746>')
                .setAuthor({ name: `${member.user.username} (${member.id})`, iconURL: member.displayAvatarURL() })
                .setThumbnail(randomCatImageUrl)
                .setImage('https://cdn.discordapp.com/attachments/1399810315419385916/1400965438531178688/TJ8cuFj.gif')
                .setTimestamp();

            const welcomeMessage = await welcomeChannel.send({ embeds: [welcomeEmbed] });

            await welcomeMessage.react('<a:HappyHappy:1399809689008738516>');

            // Invite Tracking
            const memberInviteInfo = await fetchInviteInfo(member.guild.id, member.id);
            const inviteLogChannel = member.client.channels.cache.get(inviteLogChannelId);

            if (memberInviteInfo) {
                const inviteLogEmbed = new EmbedBuilder()
                    .setColor(0xFFC0CB)
                    .setTitle('Invite Log')
                    .setAuthor({ name: `${member.user.username} (${member.id})`, iconURL: member.displayAvatarURL() })
                    .addFields(
                        { name: 'Inviter', value: `<@${memberInviteInfo.inviterId}> (${memberInviteInfo.inviterId})` },
                        { name: 'Invite Code', value: memberInviteInfo.inviteCode }
                    );

                await inviteLogChannel.send({ embeds: [inviteLogEmbed] });
            } else {
                const inviteLogEmbed = new EmbedBuilder()
                    .setColor(0xFFC0CB)
                    .setTitle('Invite Log')
                    .setAuthor({ name: `${member.user.username} (${member.id})`, iconURL: member.displayAvatarURL() })
                    .addFields(
                        { name: 'Inviter', value: 'Unknown' },
                        { name: 'Invite Code', value: 'Unknown' }
                    );

                await inviteLogChannel.send({ embeds: [inviteLogEmbed] });
            }

        } catch (error) {
            console.error(`Error in member join event: ${error}`);
        }
    }
};