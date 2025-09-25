# Cat Bot
A fun bot in Discord.JS for a private server.

## Environment Variables Setup
The variables required are as following:
- BOT_TOKEN
- CLIENT_ID
- MONGO_URI
- CAT_API_KEY
- WELCOME_CHANNEL_ID
- NOTIFICATION_CHANNEL_ID
- INVITE_LOG_CHANNEL_ID
- INVITE_API_URL
- INVITE_API_TOKEN
- GENERAL_CHAT_ID
- DAILY_CAT_CHANNEL_ID
- WHITELISTED_USERS (Array)
- CRITICAL_ERROR_WEBHOOK
- DEFAULT_AVATAR_URL
- STAFF_NOTIFY_CHANNEL_ID
- MAX_BET
- PUNISHMENT_ROLE_ID
- GUILD_ID

## First Time Setup
- Run `node deployCommands.js` after setting environment variables
- Edit `commands/help/help.js` with your application's command IDs