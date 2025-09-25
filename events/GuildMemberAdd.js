const { Events, EmbedBuilder } = require('discord.js');
const { getRandomCatUrl } = require('../catAPI/catPictures');
const { addPendingTracking } = require('../database/inviteTracking');

const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
const inviteLogChannelId = process.env.INVITE_LOG_CHANNEL_ID;

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
            const result = await addPendingTracking(member.id, member.guild.id);

            if (!result) {
                const inviteLogChannel = member.client.channels.cache.get(inviteLogChannelId);
                return await inviteLogChannel.send({ content: `Something went wrong trying to track invite for ${member.id}\nPlease get it manually by using \`-invite ${member.id}\`` });
            }
        } catch (error) {
            console.error(`Error in member join event: ${error}`);
        }
    }
};