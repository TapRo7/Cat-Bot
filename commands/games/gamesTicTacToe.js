const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, MessageFlags, } = require('discord.js');
const { getCatCoinsUser, customUpdateCatCoinsUser, coinDatabaseLock } = require('../../database/catCoins');
const { criticalErrorNotify } = require('../../utils/errorNotifier');
const AsyncLock = require('async-lock');

const messageEditLocker = new AsyncLock();

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catAcceptEmoji = '<a:yes:1403153341780988006>';
const catRejectEmoji = '<a:no:1403153353407725710>';
const catCheerEmoji = '<a:Cheer:1403153695192911893>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const noAcceptTimeoutContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('This game has timed out, the challenged user did not accept in time.')
    );

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

    if (betAmount <= 0) {
        return await interaction.editReply({ content: `You cannot bet **0 Cat Coins!** ${catCoinEmoji}` });
    }

    if (betAmount > interaction.client.maxBet) {
        return await interaction.editReply({ content: `You cannot bet more than ${interaction.client.maxBet} in one game!` });
    }

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
            textDisplay => textDisplay.setContent(`# Tic Tac Toe Battle! ❌⭕\n<@${interaction.user.id}> has challenged <@${targetUser.id}>`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## Bet 🎰\n**${betAmount} Cat Coins ${catCoinEmoji}**`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`<@${targetUser.id}> you have been challenged to Tic Tac Toe game, do you accept?`)
        )
        .addActionRowComponents(
            actionRow => actionRow.addComponents(acceptButton, rejectButton)
        );

    const challengeMessage = await interaction.editReply({ components: [challengeContainer], flags: MessageFlags.IsComponentsV2 });

    const acceptRejectFilter = btnInt => {
        return (btnInt.customId === 'acceptTicTacToe' || btnInt.customId === 'rejectTicTacToe') && btnInt.user.id === targetUser.id;
    };

    const acceptRejectCollector = challengeMessage.createMessageComponentCollector({
        filter: acceptRejectFilter,
        time: 60_000,
        max: 1
    });

    let matchLogsString = '# Match Logs :scroll:';

    acceptRejectCollector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await challengeMessage.edit({ components: [noAcceptTimeoutContainer] });
        }
    });

    acceptRejectCollector.on('collect', async btnInt => {
        if (btnInt.customId === 'acceptTicTacToe') {
            await challengeMessage.reply({ content: `<@${interaction.user.id}> your challenge has been accepted!` });

            const firstPlayer = Math.random() < 0.5 ? interaction.user : targetUser;
            const secondPlayer = firstPlayer.id === interaction.user.id ? targetUser : interaction.user;

            const playerSymbols = {
                [firstPlayer.id]: 'X',
                [secondPlayer.id]: 'O'
            };

            let currentPlayerId = firstPlayer.id;
            const gameState = new Array(9).fill(null);

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

            gameCollector.on('collect', async btnInt => {
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
                                    textDisplay => textDisplay.setContent(`## Draw ${catCheerEmoji}\nBoth users get their **${betAmount} Cat Coins** ${catCoinEmoji} back!`)
                                );

                            const drawUpdate = {
                                $inc: {
                                    gameDraws: 1
                                }
                            };
                            const drawUpdate1 = await customUpdateCatCoinsUser(interaction.user.id, drawUpdate);
                            const drawUpdate2 = await customUpdateCatCoinsUser(targetUser.id, drawUpdate);

                            if (!drawUpdate1 || !drawUpdate2) {
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

                            const winnerUpdated = await customUpdateCatCoinsUser(winnerId, winnerUpdate);

                            if (!winnerUpdated) {
                                await challengeMessage.edit({ components: [criticalErrorContainer] });
                                criticalError = 1;
                            }

                            if (criticalError) {
                                gameCollector.stop();
                                return await criticalErrorNotify('Critical error in updating user coins after game', `Critical Error Code: ${criticalError}\nUser 1: ${winnerId}\nUser 2: ${loserId}\nBet: ${betAmount}`);
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

                            const loserUpdated = await customUpdateCatCoinsUser(loserId, loserUpdate);

                            if (!loserUpdated) {
                                await challengeMessage.edit({ components: [criticalErrorContainer] });
                                criticalError = 2;
                            }

                            if (criticalError) {
                                gameCollector.stop();
                                return await criticalErrorNotify('Critical error in updating user coins after game', `Critical Error Code: ${criticalError}\nUser 1: ${winnerId}\nUser 2: ${loserId}\nBet: ${betAmount}`);
                            }
                        }

                        await challengeMessage.edit({ components: [challengeContainer] });
                        gameCollector.stop();
                        return;
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
            });

            gameCollector.on('end', async (collected, reason) => {
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

                        const winnerUpdated = await customUpdateCatCoinsUser(winningPlayerId, winnerUpdate);

                        if (!winnerUpdated) {
                            await challengeMessage.edit({ components: [criticalErrorContainer] });
                            criticalError = 1;
                        }

                        if (criticalError) {
                            return await criticalErrorNotify('Critical error in updating user coins after game timeout', `Critical Error Code: ${criticalError}\nWinner: ${winningPlayerId}\nTimed Out: ${timedOutPlayerId}\nBet: ${betAmount}`);
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

                        const loserUpdated = await customUpdateCatCoinsUser(timedOutPlayerId, loserUpdate);

                        if (!loserUpdated) {
                            await challengeMessage.edit({ components: [criticalErrorContainer] });
                            criticalError = 2;
                        }

                        if (criticalError) {
                            return await criticalErrorNotify('Critical error in updating user coins after game timeout', `Critical Error Code: ${criticalError}\nWinner: ${winningPlayerId}\nTimed Out: ${timedOutPlayerId}\nBet: ${betAmount}`);
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
                    }
                });
            });

        } else if (btnInt.customId === 'rejectTicTacToe') {
            matchLogsString += `\n- <@${targetUser.id}> rejected the challenge`;

            challengeContainer.spliceComponents(challengeContainer.components.length - 3, 3);
            challengeContainer.addSeparatorComponents(largeSeparator);
            challengeContainer.addTextDisplayComponents(
                textDisplay => textDisplay.setContent(matchLogsString)
            );

            return await challengeMessage.edit({ components: [challengeContainer] });
        }
    });

    await challengeMessage.reply({ content: `<@${targetUser.id}> You have been challenged!` });
};