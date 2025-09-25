const { getTemprolesConfig, updateTemprolesConfig } = require('../database/config');

module.exports = {
    name: 'Remove Expired Roles',
    intervalSeconds: 60,
    async run(client) {
        const now = Math.floor(Date.now() / 1000);

        const config = await getTemprolesConfig();

        if (!config.rolesToRemove) return;

        const guild = client.guilds.cache.get(process.env.GUILD_ID);

        const remainingRoles = [];

        for (const entry of config.rolesToRemove) {
            if (entry.removeAt > now) {
                remainingRoles.push(entry);
                continue;
            }

            try {
                const member = await guild.members.cache.get(entry.userId);

                if (!member) {
                    console.log(`[Role Removal] Member ${entry.userId} not found, removing entry.`);
                    continue;
                }

                if (member.roles.cache.has(entry.roleId)) {
                    await member.roles.remove(entry.roleId);
                    console.log(`[Role Removal] Removed role ${entry.roleId} from ${entry.userId}.`);
                } else {
                    console.log(`[Role Removal] Role ${entry.roleId} was already removed for ${entry.userId}.`);
                }
            } catch (err) {
                console.error(`[Role Removal] Failed to remove role ${entry.roleId} from ${entry.userId}:`, err);
                remainingRoles.push(entry);
            }
        }
        if (remainingRoles.length !== config.rolesToRemove.length) {
            await updateTemprolesConfig({ $set: { rolesToRemove: remainingRoles } });
        }
    }
};
