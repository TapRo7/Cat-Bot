const { registerCatCoinsUser, getCatCoinsUser } = require('../../database/catCoins');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';

module.exports = async (interaction) => {
    const userData = await getCatCoinsUser(interaction.user.id);

    if (userData) {
        return await interaction.editReply({ content: 'You are already registered in the Cat Coins system! You don\'t need to register again' });
    }

    const registered = await registerCatCoinsUser(interaction.user.id);

    if (registered) {
        interaction.client.userItems.set(interaction.user.id, []);
        return await interaction.editReply({ content: `You have successfully registered in the Cat Coins System!\nYou have been given **200 Cat Coins** ${catCoinEmoji} as a sign up bonus!` });
    } else {
        return await interaction.editReply({ content: 'Something went wrong, please try again later.' });
    }
};