async function removeCooldown(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    const sub = interaction.options.getSubcommand();
    const commandName = `${command.data.name} ${sub}`;
    interaction.client.cooldowns.get(commandName)?.delete(interaction.user.id);
}

module.exports = { removeCooldown };