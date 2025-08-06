const { WebhookClient } = require('discord.js');

const webhookClient = new WebhookClient({ url: process.env.CRITICAL_ERROR_WEBHOOK });

async function criticalErrorNotify(message, details = '') {
    try {
        await webhookClient.send({
            content: `<@533692379777990656> **Critical Error:** ${message}\n\`\`\`\n${details}\n\`\`\``,
        });
    } catch (err) {
        console.error('Failed to send critical error notification:', err);
    }
}

module.exports = { criticalErrorNotify };