const { EmbedBuilder } = require('discord.js');
const { getPendingTrackings, deletePendingTracking, updatePendingTracking } = require('../database/inviteTracking');
const { fetchInviteInfo } = require('../utils/inviteApi');

const inviteLogChannelId = process.env.INVITE_LOG_CHANNEL_ID;
const maxAttempts = 5;

module.exports = {
    name: 'Invite Tracking',
    intervalSeconds: 30,
    async run(client) {
        const pendingInviteTrackings = await getPendingTrackings();
        const inviteLogChannel = client.channels.cache.get(inviteLogChannelId);

        if (pendingInviteTrackings.length === 0) return;

        for (let i = 0; i < pendingInviteTrackings.length; i++) {
            const memberData = pendingInviteTrackings[i];
            const memberId = memberData.discordId;
            const guildId = memberData.guildId;
            const attempts = memberData.attempts;

            const guild = client.guilds.cache.get(guildId);

            if (!guild) {
                console.error(`Guild ${guildId} not found in cache`);
                continue;
            }
            const member = guild.members.cache.get(memberId);

            if (!member) {
                console.error(`Member ${memberId} not found in cache`);
                continue;
            }

            const memberInviteInfo = await fetchInviteInfo(guildId, memberId);
            let processed = false;

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
                processed = true;
            } else if (attempts >= maxAttempts) {
                const inviteLogEmbed = new EmbedBuilder()
                    .setColor(0xFFC0CB)
                    .setTitle('Invite Log')
                    .setAuthor({ name: `${member.user.username} (${member.id})`, iconURL: member.displayAvatarURL() })
                    .addFields(
                        { name: 'Inviter', value: 'Unknown' },
                        { name: 'Invite Code', value: 'Unknown' }
                    );

                await inviteLogChannel.send({ embeds: [inviteLogEmbed] });
                processed = true;
            } else {
                const result = await updatePendingTracking(memberId, guildId, attempts + 1);

                if (!result) {
                    console.error(`Failed to update attempts for member ${memberId} belonging to guild ${guildId}`);
                }
            }

            if (processed) {
                const result = await deletePendingTracking(memberId, guildId);

                if (!result) {
                    console.error(`Failed to remove member ${memberId} belonging to guild ${guildId} from database after tracking invite.`);
                }
            }
        }
    }
};