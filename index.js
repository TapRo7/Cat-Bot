const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { startTasks } = require('./taskRunner');

require('dotenv').config();
const token = process.env.BOT_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();
client.cooldowns = new Collection();
client.buttons = new Map();
client.modals = new Map();
client.selects = new Map();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const buttonFiles = fs.readdirSync('./buttons').filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
    const button = require(`./buttons/${file}`);
    if (button.customId && typeof button.execute === 'function') {
        client.buttons.set(button.customId, button);
    }
}

const modalFiles = fs.readdirSync('./modals').filter(file => file.endsWith('.js'));

for (const file of modalFiles) {
    const modal = require(`./modals/${file}`);
    if (modal.customId && typeof modal.execute === 'function') {
        client.modals.set(modal.customId, modal);
    }
}

const selectFiles = fs.readdirSync('./selectMenus').filter(file => file.endsWith('.js'));

for (const file of selectFiles) {
    const select = require(`./selectMenus/${file}`);
    if (select.customId && typeof select.execute === 'function') {
        client.selects.set(select.customId, select);
    }
}

client.login(token);