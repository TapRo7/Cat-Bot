const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, MessageFlags, } = require('discord.js');
const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');
const { criticalErrorNotify } = require('../../utils/errorNotifier');
const { createDeferred } = require('../../utils/createDeferred');
const AsyncLock = require('async-lock');

const messageEditLocker = new AsyncLock();

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catAcceptEmoji = '<a:yes:1403153341780988006>';
const catRejectEmoji = '<a:no:1403153353407725710>';
const catCheerEmoji = '<a:Cheer:1403153695192911893>';
const catDrawEmoji = '<:catsHugging:1404464702045819022>';
const catTimeoutEmoji = '<:SadCat:1403156017059074241>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const criticalErrorContainer = new ContainerBuilder()
    .setAccentColor(0xFF0000)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('A critical error occured updating the user coins, this game could not be processed.')
    );

const acceptButton = new ButtonBuilder()
    .setCustomId('acceptTicTacToe')
    .setLabel('Accept')
    .setEmoji(catAcceptEmoji)
    .setStyle(ButtonStyle.Success);

const rejectButton = new ButtonBuilder()
    .setCustomId('rejectTicTacToe')
    .setLabel('Reject')
    .setEmoji(catRejectEmoji)
    .setStyle(ButtonStyle.Danger);

const styleMap = {
    X: ButtonStyle.Danger,
    O: ButtonStyle.Success
};

function createTicTacToeGrid(gameState, gameEnded = false) {
    const rows = [];

    for (let row = 0; row < 3; row++) {
        const buttons = [];
        for (let col = 0; col < 3; col++) {
            const position = row * 3 + col;
            const cellValue = gameState[position];

            const button = new ButtonBuilder()
                .setCustomId(`ttt_${position}`)
                .setLabel(cellValue || '⬜')
                .setStyle(cellValue ? styleMap[cellValue] : ButtonStyle.Primary)
                .setDisabled(!!cellValue || gameEnded);

            buttons.push(button);
        }
        rows.push(buttons);
    }
    return rows;
}

const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
];

function checkWinner(gameState) {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a];
        }
    }

    if (gameState.every(cell => cell !== null)) {
        return 'draw';
    }

    return null;
}

module.exports = async (interaction) => {
    const targetUser = interaction.options.getUser('user');
    const betAmount = interaction.options.getInteger('bet');

    if (targetUser.id === interaction.user.id) {
        return await interaction.editReply({ content: 'You cannot challenge yourself!' });
    }

    if (targetUser.id === interaction.client.application.id) {
        return await interaction.editReply({ content: 'You cannot challenge me! Meow' });
    }

    const challengerUserData = await getCatCoinsUser(interaction.user.id);

    if (challengerUserData) {
        if (challengerUserData.coins < betAmount) {
            return await interaction.editReply({ content: `You only have **${challengerUserData.coins} Cat Coins** ${catCoinEmoji}, you cannot bet **${betAmount}**` });
        }
    } else {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    const targetUserData = await getCatCoinsUser(targetUser.id);

    if (targetUserData) {
        if (targetUserData.coins < betAmount) {
            return await interaction.editReply({ content: `The user you are trying to challenge only has **${targetUserData.coins} Cat Coins** ${catCoinEmoji}, they cannot bet **${betAmount}**` });
        }
    } else {
        return await interaction.editReply({ content: 'The user you are trying to challenge has not registered in the Cat Coin System' });
    }

    const challengeContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`# Tic Tac Toe Advanced Battle! ❌⭕\n<@${interaction.user.id}> has challenged <@${targetUser.id}>`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## Bet 🎰\n**${betAmount} Cat Coins ${catCoinEmoji}**`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`<@${targetUser.id}> you have been challenged to Tic Tac Toe Advanced game, do you accept?`)
        )
        .addActionRowComponents(
            actionRow => actionRow.addComponents(acceptButton, rejectButton)
        );

    const challengeMessage = await interaction.editReply({ components: [challengeContainer], flags: MessageFlags.IsComponentsV2 });
    await challengeMessage.reply({ content: `<@${targetUser.id}> You have been challenged!` });

    const acceptRejectFilter = btnInt => {
        return (btnInt.customId === 'acceptTicTacToe' || btnInt.customId === 'rejectTicTacToe') && btnInt.user.id === targetUser.id;
    };

    const confirmResult = await new Promise((resolve) => {
        const acceptRejectCollector = challengeMessage.createMessageComponentCollector({
            filter: acceptRejectFilter,
            time: 60_000,
            max: 1
        });

        acceptRejectCollector.on('collect', async btnInt => {
            resolve(btnInt.customId === 'acceptTicTacToe');
        });

        acceptRejectCollector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                resolve('timeout');
            }
        });
    });

    let matchLogsString = '# Match Logs :scroll:';

    if (confirmResult === false) {
        matchLogsString += `\n- <@${targetUser.id}> rejected the challenge`;

        challengeContainer.spliceComponents(challengeContainer.components.length - 3, 3);
        challengeContainer.addSeparatorComponents(largeSeparator);
        challengeContainer.addTextDisplayComponents(
            textDisplay => textDisplay.setContent(matchLogsString)
        );

        return await challengeMessage.edit({ components: [challengeContainer] });
    }

    if (confirmResult === 'timeout') {
        challengeContainer.spliceComponents(challengeContainer.components.length - 3, 3);

        challengeContainer
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`## Timeout ${catTimeoutEmoji}\n<@${targetUser.id}> did not accept the challenge in time`)
            );

        return await challengeMessage.edit({ components: [challengeContainer] });
    }

    await challengeMessage.reply({ content: `<@${interaction.user.id}> your challenge has been accepted!` });

    const firstPlayer = Math.random() < 0.5 ? interaction.user : targetUser;
    const secondPlayer = firstPlayer.id === interaction.user.id ? targetUser : interaction.user;

    const playerSymbols = {
        [firstPlayer.id]: 'X',
        [secondPlayer.id]: 'O'
    };

    let currentPlayerId = firstPlayer.id;
    const gameState = new Array(9).fill(null);
    const moveHistory = {
        [firstPlayer.id]: [],
        [secondPlayer.id]: []
    };

    matchLogsString += `\n- <@${targetUser.id}> accepted the challenge\n- <@${firstPlayer.id}> goes first and is playing as **${playerSymbols[firstPlayer.id]}**`;
    matchLogsString += `\n- <@${secondPlayer.id}> will go second and is playing as **${playerSymbols[secondPlayer.id]}**`;

    challengeContainer.spliceComponents(challengeContainer.components.length - 3, 3);

    const gridRows = createTicTacToeGrid(gameState);

    challengeContainer
        .addSeparatorComponents(largeSeparator)
        .addActionRowComponents(actionRow => actionRow.addComponents(...gridRows[0]))
        .addActionRowComponents(actionRow => actionRow.addComponents(...gridRows[1]))
        .addActionRowComponents(actionRow => actionRow.addComponents(...gridRows[2]))
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(matchLogsString + `\n# Current Turn ⏳\nIt\'s <@${currentPlayerId}>'s turn!`)
        );

    await challengeMessage.edit({ components: [challengeContainer] });

    const gameFilter = btnInt => {
        return btnInt.customId.startsWith('ttt_') && (btnInt.user.id === currentPlayerId);
    };

    const gameCollector = challengeMessage.createMessageComponentCollector({
        filter: gameFilter
    });

    let gameEnded = false;
    let turnTimeoutId;

    turnTimeoutId = setTimeout(() => {
        gameCollector.stop('playerTimeout');
    }, 60_000);

    const handleGameCollect = async (btnInt) => {
        clearTimeout(turnTimeoutId);

        await messageEditLocker.acquire('edit', async () => {
            if (gameEnded) return;

            if (btnInt.user.id !== currentPlayerId) {
                return;
            }

            const position = parseInt(btnInt.customId.split('_')[1]);

            if (gameState[position]) {
                return;
            }

            moveHistory[currentPlayerId].push(position);

            if (moveHistory[currentPlayerId].length > 3) {
                const oldestPosition = moveHistory[currentPlayerId].shift();
                gameState[oldestPosition] = null;
            }

            gameState[position] = playerSymbols[currentPlayerId];

            //matchLogsString += `\n- <@${currentPlayerId}> placed **${playerSymbols[currentPlayerId]}** at position ${position + 1}`;

            const winner = checkWinner(gameState);

            if (winner) {
                gameEnded = true;
                const newGridRows = createTicTacToeGrid(gameState, gameEnded);

                challengeContainer.spliceComponents(4, 6);
                challengeContainer
                    .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[0]))
                    .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[1]))
                    .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[2]))
                    .addSeparatorComponents(largeSeparator);

                if (winner === 'draw') {
                    matchLogsString += `\n- The game ended in a draw!`;

                    challengeContainer
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(matchLogsString)
                        )
                        .addSeparatorComponents(largeSeparator)
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(`## Draw ${catDrawEmoji}\nBoth users get their **${betAmount} Cat Coins** ${catCoinEmoji} back!`)
                        );

                    const drawUpdate = {
                        $inc: {
                            gameDraws: 1
                        }
                    };

                    try {
                        await customUpdateCatCoinsUser(interaction.user.id, drawUpdate);
                        await customUpdateCatCoinsUser(targetUser.id, drawUpdate);
                    } catch (error) {
                        console.error(error);
                        console.error(`Failed to update draws for one of the two users. ${interaction.user.id} / ${targetUser.id}`);
                    }
                } else {
                    const playerSymbolIds = Object.keys(playerSymbols);
                    const winnerId = playerSymbolIds.find(id => playerSymbols[id] === winner);
                    const loserId = playerSymbolIds.find(id => playerSymbols[id] !== winner);

                    matchLogsString += `\n- <@${winnerId}> wins!`;

                    challengeContainer
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(matchLogsString)
                        )
                        .addSeparatorComponents(largeSeparator)
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(`## Winner ${catCheerEmoji}\n<@${winnerId}> wins **${betAmount} Cat Coins** ${catCoinEmoji}`)
                        );

                    let criticalError = false;

                    const winnerUpdate = {
                        $inc: {
                            coins: betAmount,
                            gamesWon: 1,
                            gamesWonStreak: 1
                        }
                    };

                    try {
                        await customUpdateCatCoinsUser(winnerId, winnerUpdate);
                    } catch (error) {
                        console.error(error);
                        await challengeMessage.edit({ components: [criticalErrorContainer] });
                        criticalError = 1;
                        gameCollector.stop();
                        await criticalErrorNotify('Critical error in updating user coins after game', `Critical Error Code: ${criticalError}\nUser 1: ${winnerId}\nUser 2: ${loserId}\nBet: ${betAmount}`);
                        return completion.resolve();
                    }

                    const loserUpdate = {
                        $inc: {
                            coins: -betAmount,
                            gamesLost: 1
                        },
                        $set: {
                            gamesWonStreak: 0
                        }
                    };

                    try {
                        await customUpdateCatCoinsUser(loserId, loserUpdate);
                    } catch (error) {
                        console.error(error);
                        await challengeMessage.edit({ components: [criticalErrorContainer] });
                        criticalError = 2;
                        gameCollector.stop();
                        await criticalErrorNotify('Critical error in updating user coins after game', `Critical Error Code: ${criticalError}\nUser 1: ${winnerId}\nUser 2: ${loserId}\nBet: ${betAmount}`);
                        return completion.resolve();
                    }
                }

                await challengeMessage.edit({ components: [challengeContainer] });
                gameCollector.stop();
                return completion.resolve();
            }

            currentPlayerId = currentPlayerId === interaction.user.id ? targetUser.id : interaction.user.id;
            //matchLogsString += `\n- It's now <@${currentPlayerId}>'s turn`;

            const newGridRows = createTicTacToeGrid(gameState);

            challengeContainer.spliceComponents(4, 6);
            challengeContainer
                .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[0]))
                .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[1]))
                .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[2]))
                .addSeparatorComponents(largeSeparator)
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(matchLogsString + `\n# Current Turn ⏳\nIt\'s <@${currentPlayerId}>'s turn!`)
                );

            await challengeMessage.edit({ components: [challengeContainer] });

            turnTimeoutId = setTimeout(() => {
                gameCollector.stop('playerTimeout');
            }, 60_000);
        });
    };

    const handleGameEnd = async (reason) => {
        await messageEditLocker.acquire('edit', async () => {
            if (reason === 'playerTimeout') {
                if (gameEnded) {
                    return;
                } else {
                    gameEnded = true;
                }

                const timedOutPlayerId = currentPlayerId;
                const winningPlayerId = currentPlayerId === interaction.user.id ? targetUser.id : interaction.user.id;

                let criticalError = false;

                const winnerUpdate = {
                    $inc: {
                        coins: betAmount,
                        gamesWon: 1,
                        gamesWonStreak: 1
                    }
                };

                try {
                    await customUpdateCatCoinsUser(winningPlayerId, winnerUpdate);
                } catch (error) {
                    console.error(error);
                    await challengeMessage.edit({ components: [criticalErrorContainer] });
                    criticalError = 1;
                    await criticalErrorNotify('Critical error in updating user coins after game timeout', `Critical Error Code: ${criticalError}\nWinner: ${winningPlayerId}\nTimed Out: ${timedOutPlayerId}\nBet: ${betAmount}`);
                    return completion.resolve();
                }

                const loserUpdate = {
                    $inc: {
                        coins: -betAmount,
                        gamesLost: 1
                    },
                    $set: {
                        gamesWonStreak: 0
                    }
                };

                try {
                    await customUpdateCatCoinsUser(timedOutPlayerId, loserUpdate);
                } catch (error) {
                    console.error(error);
                    await challengeMessage.edit({ components: [criticalErrorContainer] });
                    criticalError = 2;
                    await criticalErrorNotify('Critical error in updating user coins after game timeout', `Critical Error Code: ${criticalError}\nWinner: ${winningPlayerId}\nTimed Out: ${timedOutPlayerId}\nBet: ${betAmount}`);
                    return completion.resolve();
                }

                matchLogsString += `\n- <@${timedOutPlayerId}> timed out and forfeits the game`;
                const newGridRows = createTicTacToeGrid(gameState, gameEnded);

                challengeContainer.spliceComponents(4, 6);
                challengeContainer
                    .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[0]))
                    .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[1]))
                    .addActionRowComponents(actionRow => actionRow.addComponents(...newGridRows[2]))
                    .addSeparatorComponents(largeSeparator);

                challengeContainer
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(matchLogsString)
                    )
                    .addSeparatorComponents(largeSeparator)
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(`## Winner ${catCheerEmoji}\n<@${winningPlayerId}> wins **${betAmount} Cat Coins** ${catCoinEmoji}`)
                    );

                await challengeMessage.edit({ components: [challengeContainer] });
                return completion.resolve();
            }
        });
    };

    const completion = createDeferred();

    gameCollector.on('collect', async btnInt => {
        try {
            await handleGameCollect(btnInt);
        } catch (error) {
            completion.reject(error);
        }
    });

    gameCollector.on('end', async (collected, reason) => {
        try {
            await handleGameEnd(reason);
        } catch (error) {
            completion.reject(error);
        }
    });

    await completion.promise;
};