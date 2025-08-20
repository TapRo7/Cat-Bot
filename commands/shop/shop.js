const { SlashCommandBuilder, MessageFlags, TextChannel } = require('discord.js');

const shopView = require('./shopView');
const shopBuy = require('./shopBuy');
const shopUse = require('./shopUse');
const shopAdd = require('./shopAdd');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Discover the Cat Shop!')
        .addSubcommand(subcommand => subcommand
            .setName('view')
            .setDescription('View the Cat Shop!')
        )
        .addSubcommand(subcommand => subcommand
            .setName('buy')
            .setDescription('Buy an item from the Cat Shop!')
            .addStringOption(option => option.setName('item').setDescription('Select the item to buy!').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('use')
            .setDescription('Use a Cat Shop item!')
            .addStringOption(option => option.setName('item').setDescription('Select the item to use!').setRequired(true).setAutocomplete(true))
        )
        .addSubcommand(subcommand => subcommand
            .setName('add')
            .setDescription('Add an item to the Cat Shop!')
            .addStringOption(option => option.setName('name').setDescription('The Item Name').setRequired(true))
            .addStringOption(option => option.setName('description').setDescription('The Item Description').setRequired(true))
            .addStringOption(option => option.setName('type').setDescription('The Item Type').setRequired(true).setChoices(
                { name: 'Role', value: 'Role' },
                { name: 'Collectable', value: 'Collectable' },
                { name: 'Custom Reward', value: 'Custom Reward' }
            ))
            .addIntegerOption(option => option.setName('price').setDescription('Price of the Item').setRequired(true))
            .addBooleanOption(option => option.setName('usable').setDescription('Whether the Item is Usable or not').setRequired(true))
            .addStringOption(option => option.setName('effect').setDescription('The Effect of Using the Item').setRequired(true).setChoices(
                { name: 'roleAdd', value: 'roleAdd' },
                { name: 'noEffect', value: 'noEffect' },
                { name: 'staffNotify', value: 'staffNotify' }
            ))
            .addIntegerOption(option => option.setName('expiry').setDescription('The Expiry Epoch Timestamp').setRequired(true))
            .addStringOption(option => option.setName('role_id').setDescription('Role ID for Role type Items'))
        ),

    async autocomplete(interaction) {
        const sub = interaction.options.getSubcommand();
        const focusedValue = interaction.options.getFocused().toLowerCase();

        if (sub === 'buy') {
            const choices = interaction.client.shopItemNames;

            const filtered = choices
                .filter(name => name.toLowerCase().includes(focusedValue))
                .slice(0, 25)
                .map(name => ({ name, value: name }));;

            await interaction.respond(filtered);
        } else if (sub === 'use') {
            const choices = interaction.client.userItems.get(interaction.user.id);

            const filtered = choices
                .filter(name => name.toLowerCase().includes(focusedValue))
                .slice(0, 25)
                .map(name => ({ name, value: name }));;

            await interaction.respond(filtered);
        }
    },

    async execute(interaction) {
        await interaction.deferReply();

        if (!interaction.guild) {
            return await interaction.editReply('This command can only be used in a server!');
        }

        if (!(interaction.channel instanceof TextChannel)) {
            return await interaction.editReply({ content: 'This command can only be used in a Text Channel.' });
        }

        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case 'view':
                return shopView(interaction);
            case 'buy':
                return shopBuy(interaction);
            case 'use':
                return shopUse(interaction);
            case 'add':
                return shopAdd(interaction);
            default:
                return await interaction.editReply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
    }
};
