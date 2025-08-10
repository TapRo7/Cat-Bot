const { getShopConfig, updateShopConfig } = require('../database/config');

module.exports = {
    name: 'Shop Expiry Cleanup',
    intervalSeconds: 30,
    async run(client) {
        const now = Math.floor(Date.now() / 1000);
        const shopConfig = await getShopConfig();

        if (!shopConfig) {
            console.error('Unable to get Shop Config for expiry cleanup task.');
            return;
        }

        const activeItems = shopConfig.shop.filter(item => item.expiry === 0 || item.expiry > now);

        if (activeItems.length === shopConfig.shop.length) return;

        const activeIds = activeItems.map(item => item.id);

        const result = await updateShopConfig({
            $set: {
                shop: activeItems,
                usedShopIds: activeIds
            }
        });

        if (!result) {
            console.error('Failed to update shop in DB during expiry cleanup.');
            return;
        }

        const newShop = new Map();
        const newShopItemNames = [];

        for (const item of activeItems) {
            newShop.set(item.id, item);
            newShopItemNames.push(`${item.name} - ${item.id}`);
        }

        client.shop = newShop;
        client.shopItemNames = newShopItemNames;
        client.usedShopIds = activeIds;

        console.log(`Shop Cleanup Removed ${shopConfig.shop.length - activeItems.length} expired item(s)`);
    }
};
