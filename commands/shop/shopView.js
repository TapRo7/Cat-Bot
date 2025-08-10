const { MessageFlags } = require('discord.js');
const { shopPageBuilder } = require('../../utils/shopPageBuilder');

const itemsPerPage = 10;

module.exports = async (interaction) => {
    const shopLength = interaction.client.shopItemNames.length;

    if (shopLength === 0) {
        return await interaction.editReply({ content: 'The shop is empty right now! Please check back later' });
    }

    let paginator = false;

    if (shopLength > itemsPerPage) {
        paginator = true;
    }

    const shopContainer = await shopPageBuilder(1, Array.from(interaction.client.shop.values()), itemsPerPage);

    // TODO: Add paginator buttons at the bottom of shopContainer if paginator is true
    // Not needed right now as shop will not be bigger than 10 items until I implement this

    await interaction.editReply({ components: [shopContainer], flags: MessageFlags.IsComponentsV2 });
};
