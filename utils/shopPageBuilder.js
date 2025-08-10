const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

function shopItemStringBuilder(itemData) {
    let itemInfo = `## **${itemData.name} (${itemData.id})**
- **Description:** ${itemData.description}
- **Cost:** ${itemData.price} Cat Coins ${catCoinEmoji}
- **Type:** ${itemData.type}
- **Usable**: ${itemData.usable ? 'Yes' : 'No'}`;

    if (itemData.expiry > 0) {
        itemInfo += `\n\nThis item will leave the shop on <t:${itemData.expiry}:F>`;
    }

    return itemInfo;
}

async function shopPageBuilder(pageNumber, shopData, itemsPerPage) {
    const shopContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`# Cat Coins Shop ${catCoinEmoji}`)
        )
        .addSeparatorComponents(largeSeparator);

    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = shopData.slice(startIndex, endIndex);

    for (const item of pageItems) {
        shopContainer
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(shopItemStringBuilder(item))
            )
            .addSeparatorComponents(largeSeparator);
    }

    shopContainer.addTextDisplayComponents(
        textDisplay => textDisplay.setContent(`-# Page Number: ${pageNumber}`)
    );

    return shopContainer;
}

module.exports = { shopPageBuilder };