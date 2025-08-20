const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, MessageFlags, ButtonBuilder, ButtonStyle, TextChannel, ThreadAutoArchiveDuration } = require('discord.js');
const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');
const { criticalErrorNotify } = require('../../utils/errorNotifier');
const AsyncLock = require('async-lock');

const messageEditLocker = new AsyncLock();

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catCheerEmoji = '<a:Cheer:1403153695192911893>';
const catSadEmoji = '<:SadCat:1403156017059074241>';
const catAcceptEmoji = '<a:yes:1403153341780988006>';
const catRejectEmoji = '<a:no:1403153353407725710>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const gameTimeoutSeconds = 3 * 60;
const maxWrongGuesses = 6;

const difficultySettings = {
    'Easy': { reward: 20, lossPenalty: 10 },
    'Medium': { reward: 35, lossPenalty: 20 },
    'Hard': { reward: 50, lossPenalty: 30 }
};

const hangmanStates = [
    '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========\n```',
    '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========\n```'
];

const criticalErrorContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('A critical error occurred updating your coins, this game could not be processed.')
    );

function getWordDisplay(word, guessedLetters) {
    const display = word.split('').map(letter => guessedLetters.includes(letter) ? letter : '_').join(' ');
    return `\`${display}\``;
}

function isWordComplete(word, guessedLetters) {
    return word.split('').every(letter => guessedLetters.includes(letter));
}

const acceptButton = new ButtonBuilder()
    .setCustomId('acceptHangman')
    .setLabel('Yes')
    .setStyle(ButtonStyle.Success)
    .setEmoji(catAcceptEmoji);

const rejectButton = new ButtonBuilder()
    .setCustomId('rejectHangman')
    .setLabel('No')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(catRejectEmoji);

module.exports = async (interaction) => {
    const difficulty = interaction.options.getString('difficulty');
    const settings = difficultySettings[difficulty];

    const playerData = await getCatCoinsUser(interaction.user.id);

    if (!playerData) {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    if (playerData.coins < settings.lossPenalty) {
        return await interaction.editReply({ content: `You need at least **${settings.lossPenalty} Cat Coins** ${catCoinEmoji} to play the **${difficulty}** difficulty, but you only have **${playerData.coins}**` });
    }

    const confirmationContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`Are you sure you want to play hangman on **${difficulty}** difficulty?\n\nIf you win you will get **${settings.reward} Cat Coins** ${catCoinEmoji}\nIf you lose, you will lose **${settings.lossPenalty} Cat Coins** ${catCoinEmoji}`)
        )
        .addSeparatorComponents(largeSeparator)
        .addActionRowComponents(actionRow => actionRow.addComponents(acceptButton, rejectButton));

    const confirmFilter = btnInt => {
        return (btnInt.customId === 'acceptHangman' || btnInt.customId === 'rejectHangman') && btnInt.user.id === interaction.user.id;
    };

    const gameMessage = await interaction.editReply({ components: [confirmationContainer], flags: MessageFlags.IsComponentsV2 });

    const confirmResult = await new Promise((resolve) => {
        const confirmCollector = gameMessage.createMessageComponentCollector({
            filter: confirmFilter,
            time: 60_000,
            max: 1
        });

        confirmCollector.on('collect', async btnInt => {
            resolve(btnInt.customId === 'acceptHangman');
        });

        confirmCollector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                resolve('timeout');
            }
        });
    });

    if (confirmResult === false) {
        const command = interaction.client.commands.get(interaction.commandName);
        const sub = interaction.options.getSubcommand();
        const commandName = `${command.data.name} ${sub}`;
        interaction.client.cooldowns.get(commandName)?.delete(interaction.user.id);

        confirmationContainer.spliceComponents(2, 1);

        confirmationContainer.addTextDisplayComponents(
            textDisplay => textDisplay.setContent('You cancelled the game.')
        );

        return await gameMessage.edit({ components: [confirmationContainer] });
    }

    if (confirmResult === 'timeout') {
        confirmationContainer.spliceComponents(2, 1);

        confirmationContainer.addTextDisplayComponents(
            textDisplay => textDisplay.setContent('This game has timed out, you did not accept in time.')
        );

        return await gameMessage.edit({ components: [confirmationContainer] });
    }

    const wordsList = interaction.client.hangmanWords.get(difficulty);
    const word = wordsList[Math.floor(Math.random() * wordsList.length)].toUpperCase();

    const guessedLetters = [];
    const wrongLetters = [];

    let wrongGuesses = 0;
    let matchLogsString = '# Match Logs :scroll:';

    const currentEpoch = Math.floor(Date.now() / 1000);
    const gameEndEpoch = currentEpoch + gameTimeoutSeconds;

    matchLogsString += `\n- Game started with a **${word.length}** letter word`;

    const gameContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`# Hangman - ${difficulty} 🎯`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`${hangmanStates[wrongGuesses]}\n### Word: ${getWordDisplay(word, guessedLetters)}\n### Wrong letters: ${wrongLetters.length > 0 ? wrongLetters.join(', ') : 'None'}`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(matchLogsString)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`-# Time Ends: <t:${gameEndEpoch}:R>`)
        );

    await gameMessage.edit({ components: [gameContainer] });

    const guessFilter = msg => {
        return msg.author.id === interaction.user.id && msg.content.length === 1 && /^[A-Za-z]$/.test(msg.content);
    };

    const guessThread = await gameMessage.startThread({ name: 'Guess Thread', rateLimitPerUser: 3, autoArchiveDuration: ThreadAutoArchiveDuration.OneHour });

    const guessCollector = guessThread.createMessageCollector({
        filter: guessFilter,
        time: gameTimeoutSeconds * 1000
    });

    await guessThread.send(`<@${interaction.user.id}> Send your guesses here! Send a message with only one letter to make a valid guess.\nAnything extra, or multiple letters in the message will make it not count!`);

    let gameEnded = false;

    guessCollector.on('collect', async msg => {
        await messageEditLocker.acquire('edit', async () => {
            if (gameEnded) return;

            const guess = msg.content.toUpperCase();

            if (guessedLetters.includes(guess)) {
                matchLogsString += `\n- <@${interaction.user.id}> tried to guess **${guess}** again, but it has been guessed before`;
            } else {
                guessedLetters.push(guess);

                if (word.includes(guess)) {
                    const count = word.split('').filter(letter => letter === guess).length;
                    matchLogsString += `\n- <@${interaction.user.id}> guessed **${guess}**, the letter was found **${count}** time${count > 1 ? 's' : ''} in the word`;
                } else {
                    wrongLetters.push(guess);
                    wrongGuesses++;
                    matchLogsString += `\n- <@${interaction.user.id}> guessed **${guess}**, the letter was not found`;
                }
            }

            const hangmanDisplay = new TextDisplayBuilder()
                .setContent(`${hangmanStates[wrongGuesses]}\n## Word: ${getWordDisplay(word, guessedLetters)}\n**Wrong letters:** ${wrongLetters.length > 0 ? wrongLetters.join(', ') : 'None'}`);

            const matchLogsDisplay = new TextDisplayBuilder().setContent(matchLogsString);

            gameContainer.spliceComponents(2, 1, hangmanDisplay);
            gameContainer.spliceComponents(4, 1, matchLogsDisplay);

            await gameMessage.edit({ components: [gameContainer] });

            if (isWordComplete(word, guessedLetters) && !gameEnded) {
                gameEnded = true;
                matchLogsString += `\n- **VICTORY!** The word was **${word}**`;

                gameContainer.spliceComponents(gameContainer.components.length - 3, 3);
                gameContainer
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(matchLogsString)
                    )
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(`## Victory! ${catCheerEmoji}\nYou won **${settings.reward} Cat Coins** ${catCoinEmoji}`)
                    );

                const winUpdate = {
                    $inc: {
                        coins: settings.reward,
                        gamesWon: 1,
                        gamesWonStreak: 1
                    }
                };

                const winUpdated = await customUpdateCatCoinsUser(interaction.user.id, winUpdate);

                if (!winUpdated) {
                    await gameMessage.edit({ components: [criticalErrorContainer] });
                    guessCollector.stop();
                    return await criticalErrorNotify('Critical error in updating user coins after hangman win', `User: ${interaction.user.id}\nReward: ${settings.reward}`);
                }

                await gameMessage.edit({ components: [gameContainer] });
                return;
            }

            if (wrongGuesses >= maxWrongGuesses && !gameEnded) {
                gameEnded = true;
                matchLogsString += `\n- **DEFEAT!** Hangman is dead. The word was **${word}**`;

                gameContainer.spliceComponents(gameContainer.components.length - 3, 3);
                gameContainer
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(matchLogsString)
                    )
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(`## Defeat! ${catSadEmoji}\nYou lost **${settings.lossPenalty} Cat Coins** ${catCoinEmoji}`)
                    );

                const loseUpdate = {
                    $inc: {
                        coins: -settings.lossPenalty,
                        gamesLost: 1
                    },
                    $set: {
                        gamesWonStreak: 0
                    }
                };

                const loseUpdated = await customUpdateCatCoinsUser(interaction.user.id, loseUpdate);

                if (!loseUpdated) {
                    await gameMessage.edit({ components: [criticalErrorContainer] });
                    guessCollector.stop();
                    return await criticalErrorNotify('Critical error in updating user coins after hangman loss', `User: ${interaction.user.id}\nLoss Penalty: ${settings.lossPenalty}`);
                }

                await gameMessage.edit({ components: [gameContainer] });
                return;
            }
        });
    });

    guessCollector.on('end', async (collected, reason) => {
        await messageEditLocker.acquire('edit', async () => {
            if (reason === 'time') {
                if (gameEnded) {
                    return;
                } else {
                    gameEnded = true;
                }

                matchLogsString += `\n- **DEFEAT!** The time ran out. The word was **${word}**`;

                gameContainer.spliceComponents(gameContainer.components.length - 3, 3);
                gameContainer
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(matchLogsString)
                    )
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(`## Defeat! ${catSadEmoji}\nYou lost **${settings.lossPenalty} Cat Coins** ${catCoinEmoji}`)
                    );

                const timeoutUpdate = {
                    $inc: {
                        coins: -settings.lossPenalty,
                        gamesLost: 1
                    },
                    $set: {
                        gamesWonStreak: 0
                    }
                };

                const timeoutUpdated = await customUpdateCatCoinsUser(interaction.user.id, timeoutUpdate);

                if (!timeoutUpdated) {
                    await gameMessage.edit({ components: [criticalErrorContainer] });
                    return await criticalErrorNotify('Critical error in updating user coins after hangman timeout', `User: ${interaction.user.id}\nEntry Fee: ${settings.lossPenalty}`);
                }

                await gameMessage.edit({ components: [gameContainer] });

            }
        });
    });
};