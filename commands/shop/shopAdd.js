const { updateShopConfig } = require('../../database/config');
require('dotenv').config();

const allowedIdChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const idLength = 6;

function generateId() {
    let id = '';
    for (let i = 0; i < idLength; i++) {
        const index = Math.floor(Math.random() * allowedIdChars.length);
        id += allowedIdChars[index];
    }
    return id;
}

async function generateUniqueId(existingIds) {
    let id;
    do {
        id = generateId();
    } while (existingIds.includes(id));
    return id;
}

const whitelistedUsers = JSON.parse(process.env.WHITELISTED_USERS);

module.exports = async (interaction) => {
    if (!whitelistedUsers.includes(interaction.user.id)) {
        return await interaction.editReply('You cannot use this command!');
    }

    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const type = interaction.options.getString('type');
    let roleId = null;

    if (type === 'Role') {
        roleId = interaction.options.getString('role_id');

        if (!roleId) {
            return await interaction.editReply({ content: 'No role ID provide for role type item.' });
        }
    }

    const price = interaction.options.getInteger('price');
    const usable = interaction.options.getBoolean('usable');
    const effect = interaction.options.getString('effect');

    if (usable && effect === 'noEffect') {
        return await interaction.editReply({ content: 'No effect provided for a usable item' });
    }

    const expiry = interaction.options.getInteger('expiry');
    const createdAt = Math.floor(Date.now() / 1000);

    const id = await generateUniqueId(interaction.client.usedShopIds);

    const newItem = {
        id,
        guildId: interaction.guild.id,
        name,
        description,
        type,
        roleId,
        price,
        usable,
        effect,
        expiry,
        createdAt
    };

    const configUpdate = {
        $push: {
            shop: newItem,
            usedShopIds: id
        }
    };

    const result = await updateShopConfig(configUpdate);

    if (result) {
        interaction.client.shopItemNames.push(`${name} - ${id}`);
        interaction.client.shop.set(id, newItem);
        interaction.client.usedShopIds.push(id);
        return await interaction.editReply({ content: `${name} - ${id} has been added to the shop` });
    }
};
