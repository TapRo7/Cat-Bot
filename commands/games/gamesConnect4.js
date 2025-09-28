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

const redPieceEmoji = '🔴';
const yellowPieceEmoji = '🟡';
const emptyPieceEmoji = '⚪';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const criticalErrorContainer = new ContainerBuilder()
    .setAccentColor(0xFF0000)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('A critical error occured updating the user coins, this game could not be processed.')
    );

const acceptButton = new ButtonBuilder()
    .setCustomId('acceptConnect4')
    .setLabel('Accept')
    .setEmoji(catAcceptEmoji)
    .setStyle(ButtonStyle.Success);

const rejectButton = new ButtonBuilder()
    .setCustomId('rejectConnect4')
    .setLabel('Reject')
    .setEmoji(catRejectEmoji)
    .setStyle(ButtonStyle.Danger);

const playerEmojis = {
    1: redPieceEmoji,
    2: yellowPieceEmoji
};

function createConnect4ColumnButtons(gameEnded = false, gameState) {
    const buttons = [];

    for (let col = 0; col < 7; col++) {
        const isColumnFull = gameState[0][col] !== 0;

        const button = new ButtonBuilder()
            .setCustomId(`c4_${col}`)
            .setLabel(`Column ${col + 1}`)
            .setEmoji('⬇️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isColumnFull || gameEnded);

        buttons.push(button);
    }

    return buttons;
}

function createConnect4Board(gameState) {
    let boardString = '';

    boardString += '```\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n';

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const cell = gameState[row][col];
            if (cell === 0) {
                boardString += emptyPieceEmoji;
            } else {
                boardString += playerEmojis[cell];
            }
        }
        boardString += '\n';
    }
    boardString += '```';

    return boardString;
}

function checkConnect4Winner(gameState) {
    // Check horizontal
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col <= 3; col++) {
            if (gameState[row][col] !== 0 &&
                gameState[row][col] === gameState[row][col + 1] &&
                gameState[row][col] === gameState[row][col + 2] &&
                gameState[row][col] === gameState[row][col + 3]) {
                return gameState[row][col];
            }
        }
    }

    // Check vertical
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= 2; row++) {
            if (gameState[row][col] !== 0 &&
                gameState[row][col] === gameState[row + 1][col] &&
                gameState[row][col] === gameState[row + 2][col] &&
                gameState[row][col] === gameState[row + 3][col]) {
                return gameState[row][col];
            }
        }
    }

    // Check diagonal (top-left to bottom-right)
    for (let row = 0; row <= 2; row++) {
        for (let col = 0; col <= 3; col++) {
            if (gameState[row][col] !== 0 &&
                gameState[row][col] === gameState[row + 1][col + 1] &&
                gameState[row][col] === gameState[row + 2][col + 2] &&
                gameState[row][col] === gameState[row + 3][col + 3]) {
                return gameState[row][col];
            }
        }
    }

    // Check diagonal (top-right to bottom-left)
    for (let row = 0; row <= 2; row++) {
        for (let col = 3; col < 7; col++) {
            if (gameState[row][col] !== 0 &&
                gameState[row][col] === gameState[row + 1][col - 1] &&
                gameState[row][col] === gameState[row + 2][col - 2] &&
                gameState[row][col] === gameState[row + 3][col - 3]) {
                return gameState[row][col];
            }
        }
    }

    // Check for draw (board full)
    let isBoardFull = true;
    for (let col = 0; col < 7; col++) {
        if (gameState[0][col] === 0) {
            isBoardFull = false;
            break;
        }
    }

    if (isBoardFull) {
        return 'draw';
    }

    return null;
}

function dropPiece(gameState, col, player) {
    for (let row = 5; row >= 0; row--) {
        if (gameState[row][col] === 0) {
            gameState[row][col] = player;
            return true;
        }
    }
    return false;
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
            textDisplay => textDisplay.setContent(`# Connect 4 Battle! 🔴🟡\n<@${interaction.user.id}> has challenged <@${targetUser.id}>`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## Bet 🎰\n**${betAmount} Cat Coins ${catCoinEmoji}**`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`<@${targetUser.id}> you have been challenged to a Connect 4 game, do you accept?`)
        )
        .addActionRowComponents(
            actionRow => actionRow.addComponents(acceptButton, rejectButton)
        );

    const challengeMessage = await interaction.editReply({ components: [challengeContainer], flags: MessageFlags.IsComponentsV2 });
    await challengeMessage.reply({ content: `<@${targetUser.id}> You have been challenged!` });

    const acceptRejectFilter = btnInt => {
        return (btnInt.customId === 'acceptConnect4' || btnInt.customId === 'rejectConnect4') && btnInt.user.id === targetUser.id;
    };

    const confirmResult = await new Promise((resolve) => {
        const acceptRejectCollector = challengeMessage.createMessageComponentCollector({
            filter: acceptRejectFilter,
            time: 60_000,
            max: 1
        });

        acceptRejectCollector.on('collect', async btnInt => {
            resolve(btnInt.customId === 'acceptConnect4');
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

    const playerNumbers = {
        [firstPlayer.id]: 1,
        [secondPlayer.id]: 2
    };

    let currentPlayerId = firstPlayer.id;
    const gameState = Array(6).fill().map(() => Array(7).fill(0));

    matchLogsString += `\n- <@${targetUser.id}> accepted the challenge\n- <@${firstPlayer.id}> goes first and is playing as **${redPieceEmoji} Red**`;
    matchLogsString += `\n- <@${secondPlayer.id}> will go second and is playing as **${yellowPieceEmoji} Yellow**`;

    challengeContainer.spliceComponents(challengeContainer.components.length - 3, 3);

    const columnButtons = createConnect4ColumnButtons(false, gameState);
    const boardDisplay = createConnect4Board(gameState);

    challengeContainer
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(boardDisplay)
        )
        .addActionRowComponents(actionRow => actionRow.addComponents(columnButtons.slice(0, 4)))
        .addActionRowComponents(actionRow => actionRow.addComponents(columnButtons.slice(4, 7)))
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(matchLogsString + `\n# Current Turn ⏳\nIt\'s <@${currentPlayerId}>'s turn!`)
        );

    await challengeMessage.edit({ components: [challengeContainer] });

    const gameFilter = btnInt => {
        return btnInt.customId.startsWith('c4_') && (btnInt.user.id === currentPlayerId);
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

            const column = parseInt(btnInt.customId.split('_')[1]);

            const success = dropPiece(gameState, column, playerNumbers[currentPlayerId]);

            if (!success) {
                return;
            }

            const winner = checkConnect4Winner(gameState);

            if (winner) {
                gameEnded = true;
                const newColumnButtons = createConnect4ColumnButtons(gameEnded, gameState);
                const newBoardDisplay = createConnect4Board(gameState);

                challengeContainer.spliceComponents(4, 5);
                challengeContainer
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(newBoardDisplay)
                    )
                    .addActionRowComponents(actionRow => actionRow.addComponents(newColumnButtons.slice(0, 4)))
                    .addActionRowComponents(actionRow => actionRow.addComponents(newColumnButtons.slice(4, 7)))
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
                    const playerIds = Object.keys(playerNumbers);
                    const winnerId = playerIds.find(id => playerNumbers[id] === winner);
                    const loserId = playerIds.find(id => playerNumbers[id] !== winner);

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

            const newColumnButtons = createConnect4ColumnButtons(false, gameState);
            const newBoardDisplay = createConnect4Board(gameState);

            challengeContainer.spliceComponents(4, 5);
            challengeContainer
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(newBoardDisplay)
                )
                .addActionRowComponents(actionRow => actionRow.addComponents(newColumnButtons.slice(0, 4)))
                .addActionRowComponents(actionRow => actionRow.addComponents(newColumnButtons.slice(4, 7)))
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
                const newColumnButtons = createConnect4ColumnButtons(gameEnded, gameState);
                const newBoardDisplay = createConnect4Board(gameState);

                challengeContainer.spliceComponents(4, 5);
                challengeContainer
                    .addTextDisplayComponents(
                        textDisplay => textDisplay.setContent(newBoardDisplay)
                    )
                    .addActionRowComponents(actionRow => actionRow.addComponents(newColumnButtons.slice(0, 4)))
                    .addActionRowComponents(actionRow => actionRow.addComponents(newColumnButtons.slice(4, 7)))
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