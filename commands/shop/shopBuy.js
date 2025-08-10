const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';

module.exports = async (interaction) => {
    const selectedItem = interaction.options.getString('item');
    const validChoices = interaction.client.shopItemNames;

    if (!validChoices.includes(selectedItem)) {
        return await interaction.editReply({ content: 'Please select a valid item to buy' });
    }

    const userData = await getCatCoinsUser(interaction.user.id);

    if (!userData) {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    const coins = userData.coins;

    const itemId = selectedItem.split('-').pop().trim();

    const itemToBuy = interaction.client.shop.get(itemId);

    if (itemToBuy.price > coins) {
        return await interaction.editReply({ content: `The item you are trying to buy is worth **${itemToBuy.price} Cat Coins** ${catCoinEmoji}, you only have **${coins}**\nYou cannot afford it` });
    }

    if (itemToBuy.type === 'Role') {
        const guildId = itemToBuy.guildId;
        const roleId = itemToBuy.roleId;

        if (interaction.guild.id !== guildId) {
            return await interaction.editReply({ content: 'The item you are trying to buy is not available in this guild.' });
        }

        if (interaction.member.roles.cache.has(roleId)) {
            return await interaction.editReply({ content: 'You already have this role!' });
        }

        const userUpdate = {
            $push: {
                usedInventory: itemToBuy
            },
            $inc: {
                coins: -itemToBuy.price
            }
        };

        const result = await customUpdateCatCoinsUser(interaction.user.id, userUpdate);

        if (!result) {
            return await interaction.editReply({ content: 'Something went wrong trying to purchase this item, please try again later.' });
        }

        await interaction.member.roles.add(roleId);

        await interaction.editReply({ content: `You have bought the <@&${roleId}> role!\nThe role has been added to you` });
    } else {
        if (userData.inventory.some(item => item.id === itemToBuy.id)) {
            return await interaction.editReply({ content: 'You already have this item!' });
        }

        const userUpdate = {
            $push: {
                inventory: itemToBuy,
                inventoryItemNames: `${itemToBuy.name} - ${itemToBuy.id}`
            },
            $inc: {
                coins: -itemToBuy.price
            }
        };

        const result = await customUpdateCatCoinsUser(interaction.user.id, userUpdate);

        if (!result) {
            return await interaction.editReply({ content: 'Something went wrong trying to purchase this item, please try again later.' });
        }

        interaction.client.userItems.get(interaction.user.id).push(`${itemToBuy.name} - ${itemToBuy.id}`);

        await interaction.editReply({ content: `You have bought **${itemToBuy.name} - ${itemToBuy.id}**!\nThe item has been added to your inventory` });
    }
};
