const { Events, MessageFlags, Collection } = require('discord.js');

const expectedNoHandlers = ['acceptRps', 'rejectRps', 'rpsChoice', 'acceptHangman', 'rejectHangman', 'acceptTicTacToe', 'rejectTicTacToe', 'acceptVault', 'rejectVault'];

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            const sub = interaction.options.getSubcommand(false);
            let commandName;

            if (sub) {
                commandName = `${command.data.name} ${sub}`;
            } else {
                commandName = command.data.name;
            }

            const cooldowns = interaction.client.cooldowns;

            if (!cooldowns.has(commandName)) {
                cooldowns.set(commandName, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(commandName);
            const defaultCooldownDuration = 5;
            let cooldownAmount;

            if (sub && command.subCooldowns && command.subCooldowns[sub] != null) {
                cooldownAmount = command.subCooldowns[sub] * 1000;
            } else {
                cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
            }

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1_000);
                    return interaction.reply({ content: `Please wait, you are on a cooldown for the \`${commandName}\` command. You can use it again <t:${expiredTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
                timestamps.delete(interaction.user.id);
            }
        }
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
        else if (interaction.isButton()) {
            const handler = interaction.client.buttons.get(interaction.customId);
            if (!handler) {
                try {
                    await interaction.deferUpdate();
                } catch (error) {
                    console.error(error);
                }
                if (!expectedNoHandlers.includes(interaction.customId) && !interaction.customId.startsWith('ttt_') && !interaction.customId.startsWith('answer_')) {
                    console.log(`No handler found for Button Custom ID: ${interaction.customId}`);
                }
                return;
            }

            try {
                await handler.execute(interaction);
            } catch (error) {
                console.log(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        }
        else if (interaction.isModalSubmit()) {
            const handler = interaction.client.modals.get(interaction.customId);

            if (!handler) {
                if (!expectedNoHandlers.includes(interaction.customId)) {
                    console.log(`No handler found for Modal Custom ID: ${interaction.customId}`);
                }
                return;
            }

            try {
                await handler.execute(interaction);
            } catch (error) {
                console.log(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        }
        else if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()) {
            const handler = interaction.client.selects.get(interaction.customId);

            if (!handler) {
                try {
                    await interaction.deferUpdate();
                } catch (error) {
                    console.error(error);
                }
                if (!expectedNoHandlers.includes(interaction.customId)) {
                    console.log(`No handler found for Select Custom ID: ${interaction.customId}`);
                }
                return;
            }

            try {
                await handler.execute(interaction);
            } catch (error) {
                console.log(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        }
        else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    }
};