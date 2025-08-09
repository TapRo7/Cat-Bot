const { insertOne, find, deleteOne, updateOne } = require('./index');

const pendingInvitesCollection = 'pendingInviteTracking';

async function addPendingTracking(discordId, guildId) {
    const newUser = {
        discordId,
        guildId,
        attempts: 0
    };

    return await insertOne(pendingInvitesCollection, newUser);
}

async function updatePendingTracking(discordId, guildId, attempts) {
    return await updateOne(pendingInvitesCollection, { discordId, guildId }, { attempts });
}

async function getPendingTrackings() {
    return await find(pendingInvitesCollection, {});
}

async function deletePendingTracking(discordId, guildId) {
    return await deleteOne(pendingInvitesCollection, { discordId, guildId });
}

module.exports = { addPendingTracking, updatePendingTracking, getPendingTrackings, deletePendingTracking };