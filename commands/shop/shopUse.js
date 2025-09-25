const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');

const staffNotifyChannelId = process.env.STAFF_NOTIFY_CHANNEL_ID;

async function staffNotify(interaction, itemData) {
    const staffNotifyChannel = interaction.client.channels.cache.get(staffNotifyChannelId);

    await staffNotifyChannel.send({ content: `<@${interaction.user.id}> has used the **${itemData.name} - ${itemData.id}** item!\nPlease contact them for their reward` });

    await interaction.editReply({ content: `You have used the **${itemData.name} - ${itemData.id}** item\nA notification about your item claim has been received! It will be processed soon` });
}

module.exports = async (interaction) => {
    const selectedItem = interaction.options.getString('item');
    const validChoices = interaction.client.userItems.get(interaction.user.id);

    if (!validChoices.includes(selectedItem)) {
        return await interaction.editReply({ content: 'Please select a valid item to use' });
    }

    const itemId = selectedItem.split('-').pop().trim();

    const userData = await getCatCoinsUser(interaction.user.id);

    if (!userData) {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    const itemToBuy = userData.inventory.find(i => i.id === itemId);

    if (!itemToBuy.usable) {
        return await interaction.editReply({ content: 'The item you selected is not a usable item' });
    }

    const userUpdate = {
        $pull: {
            inventory: { id: itemToBuy.id },
            inventoryItemNames: `${itemToBuy.name} - ${itemToBuy.id}`
        },
        $push: {
            usedInventory: itemToBuy
        }
    };

    const result = await customUpdateCatCoinsUser(interaction.user.id, userUpdate);

    if (!result) {
        return await interaction.editReply({ content: 'Something went wrong trying to use this item, please try again later.' });
    }

    const items = interaction.client.userItems.get(interaction.user.id);
    const index = items.indexOf(`${itemToBuy.name} - ${itemToBuy.id}`);
    items.splice(index, 1);

    switch (itemToBuy.effect) {
        case 'staffNotify':
            return await staffNotify(interaction, itemToBuy);
        default:
            await interaction.editReply({ content: 'This item was unable to be used, please contact a staff member for help.' });
    }
};
