const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextDisplayBuilder } = require('discord.js');
const { getCatCoinsUser, customUpdateCatCoinsUser, coinDatabaseLock } = require('../../database/catCoins');
const { criticalErrorNotify } = require('../../utils/errorNotifier');
const AsyncLock = require('async-lock');

const messageEditLocker = new AsyncLock();

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catAcceptEmoji = '<a:yes:1403153341780988006>';
const catRejectEmoji = '<a:no:1403153353407725710>';
const catCheerEmoji = '<a:Cheer:1403153695192911893>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const NoAcceptTimeoutContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('This game has timed out, the challenged user did not accept in time.')
    );

const NoSelectionTimeoutContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('This game has timed out, one or more of the users did not make a choice in time.')
    );

const criticalErrorContainer = new ContainerBuilder()
    .setAccentColor(0xFF0000)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('A critical error occured updating the user coins, this game could not be processed.')
    );

const rpsChoiceSelect = new StringSelectMenuBuilder()
    .setCustomId('rpsChoice')
    .setPlaceholder('Make a choice!')
    .addOptions(
        new StringSelectMenuOptionBuilder()
            .setLabel('Rock')
            .setValue('rock')
            .setEmoji('🪨'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Paper')
            .setValue('paper')
            .setEmoji('📄'),
        new StringSelectMenuOptionBuilder()
            .setLabel('Scissors')
            .setValue('scissors')
            .setEmoji('✂️'),
    );

async function rpsWinner(choice1, choice2) {
    if (choice1 === choice2) {
        return 'draw';
    }

    const winsAgainst = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper',
    };

    if (winsAgainst[choice1] === choice2) {
        return 'choice1';
    } else {
        return 'choice2';
    }
}


module.exports = async (interaction) => {
    const targetUser = interaction.options.getUser('user');
    const betAmount = interaction.options.getInteger('bet');

    if (betAmount <= 0) {
        return await interaction.editReply({ content: 'You cannot bet 0 coins!' });
    }

    if (targetUser.id === interaction.user.id) {
        return await interaction.editReply({ content: 'You cannot challenge yourself!' });
    }

    if (targetUser.id === interaction.client.application.id) {
        return await interaction.editReply({ content: 'You cannot challange me! Meow' });
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
            return await interaction.editReply({ content: `The user you are trying to challenge only has **${challengerUserData.coins} Cat Coins** ${catCoinEmoji}, they cannot bet **${betAmount}**` });
        }
    } else {
        return await interaction.editReply({ content: 'The user you are trying to challenge has not registered in the Cat Coin System' });
    }

    const acceptButton = new ButtonBuilder()
        .setCustomId('acceptRps')
        .setLabel('Accept')
        .setEmoji(catAcceptEmoji)
        .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
        .setCustomId('rejectRps')
        .setLabel('Reject')
        .setEmoji(catRejectEmoji)
        .setStyle(ButtonStyle.Danger);

    const challengeContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`# Rock Paper Scissors Battle! 🪨📄✂️\n<@${interaction.user.id}> has challenged <@${targetUser.id}>`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## Bet 🎰\n**${betAmount} Cat Coins ${catCoinEmoji}**`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`<@${targetUser.id}> you have been challenged to Rock Paper Scissors, do you accept?`)
        )
        .addActionRowComponents(
            actionRow => actionRow.addComponents(acceptButton, rejectButton)
        );

    const challengeMessage = await interaction.editReply({ components: [challengeContainer], flags: MessageFlags.IsComponentsV2 });

    const rpsFilter = btnInt => {
        return (btnInt.customId === 'acceptRps' || btnInt.customId === 'rejectRps') && btnInt.user.id === targetUser.id;
    };

    const rpsCollector = challengeMessage.createMessageComponentCollector({
        filter: rpsFilter,
        time: 60_000,
        max: 1
    });

    let matchLogsString = '# Match Logs :scroll:';

    rpsCollector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await challengeMessage.edit({ components: [NoAcceptTimeoutContainer] });
        }
    });

    rpsCollector.on('collect', async btnInt => {
        let challengerChoice;
        let targetChoice;

        if (btnInt.customId === 'acceptRps') {
            matchLogsString += `\n- <@${targetUser.id}> accepted the challenge\n- Both users are selecting their options`;

            challengeContainer.spliceComponents(challengeContainer.components.length - 3, 3);

            challengeContainer
                .addSeparatorComponents(largeSeparator)
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(matchLogsString)
                )
                .addSeparatorComponents(largeSeparator)
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent('Make your selection below!')
                )
                .addActionRowComponents(
                    actionRow => actionRow.addComponents(rpsChoiceSelect)
                );

            await challengeMessage.edit({ components: [challengeContainer] });

            const rpsChoiceFilter = slctInt => {
                return (slctInt.user.id === interaction.user.id && !challengerChoice) || (slctInt.user.id == targetUser.id && !targetChoice);
            };

            const rpsChoiceCollector = challengeMessage.createMessageComponentCollector({
                filter: rpsChoiceFilter,
                time: 120_000,
                max: 2
            });

            let pendingUpdates = 2;

            rpsChoiceCollector.on('collect', async slctInt => {
                await messageEditLocker.acquire('edit', async () => {
                    const selection = slctInt.values[0];
                    const selectorId = slctInt.user.id;

                    if (selectorId === interaction.user.id) {
                        challengerChoice = selection;
                        matchLogsString += `\n- <@${selectorId}> has made their choice`;
                    } else if (selectorId === targetUser.id) {
                        targetChoice = selection;
                        matchLogsString += `\n- <@${selectorId}> has made their choice`;
                    }

                    const matchLogsTextDisplay = new TextDisplayBuilder().setContent(matchLogsString);
                    challengeContainer.spliceComponents(4, 1, matchLogsTextDisplay);
                    await challengeMessage.edit({ components: [challengeContainer] });
                });

                pendingUpdates--;
            });

            rpsChoiceCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await challengeMessage.edit({ components: [NoSelectionTimeoutContainer] });
                } else if (reason === 'limit') {
                    while (pendingUpdates > 0) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }

                    const winningChoice = await rpsWinner(challengerChoice, targetChoice);
                    let winningUser;
                    let losingUser;

                    if (winningChoice === 'draw') {
                        matchLogsString += `\n- Both users picked **${challengerChoice}**, the match is a draw`;

                        challengeContainer.spliceComponents(challengeContainer.components.length - 4, 4);

                        challengeContainer
                            .addTextDisplayComponents(
                                textDisplay => textDisplay.setContent(matchLogsString)
                            )
                            .addSeparatorComponents(largeSeparator)
                            .addTextDisplayComponents(
                                textDisplay => textDisplay.setContent(`## Draw ${catCheerEmoji}\nBoth users get their **${betAmount} Cat Coins** ${catCoinEmoji} back!`)
                            );

                        return await challengeMessage.edit({ components: [challengeContainer] });
                    }

                    if (winningChoice === 'choice1') {
                        winningUser = interaction.user;
                        losingUser = targetUser;

                        matchLogsString += `\n- <@${losingUser.id}> picked **${targetChoice}** and lost\n- <@${winningUser.id}> picked **${challengerChoice}** and won`;
                    } else if (winningChoice === 'choice2') {
                        winningUser = targetUser;
                        losingUser = interaction.user;

                        matchLogsString += `\n- <@${losingUser.id}> picked **${challengerChoice}** and lost\n- <@${winningUser.id}> picked **${targetChoice}** and won`;
                    }

                    let criticalError = false;

                    const winnerUpdate = {
                        $inc: {
                            coins: betAmount,
                            gamesWon: 1,
                            gamesWonStreak: 1
                        }
                    };
                    const winnerUpdated = await customUpdateCatCoinsUser(winningUser.id, winnerUpdate);
                    if (!winnerUpdated) {
                        await challengeMessage.edit({ components: [criticalErrorContainer] });
                        criticalError = 1;
                    }

                    if (criticalError) {
                        return criticalErrorNotify('Critical error in updating user coins after game', `Critical Error Code: ${criticalError}\nUser 1: ${winningUser.id}\nUser 2: ${losingUser.id}\nBet: ${betAmount}`);
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
                    const loserUpdated = await customUpdateCatCoinsUser(losingUser.id, loserUpdate);
                    if (!loserUpdated) {
                        await challengeMessage.edit({ components: [criticalErrorContainer] });
                        criticalError = 2;
                    }

                    if (criticalError) {
                        return criticalErrorNotify('Critical error in updating user coins after game', `Critical Error Code: ${criticalError}\nUser 1: ${winningUser.id}\nUser 2: ${losingUser.id}\nBet: ${betAmount}`);
                    }

                    challengeContainer.spliceComponents(challengeContainer.components.length - 4, 4);
                    challengeContainer
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(matchLogsString)
                        )
                        .addSeparatorComponents(largeSeparator)
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(`## Winner ${catCheerEmoji}\n<@${winningUser.id}> wins **${betAmount} Cat Coins** ${catCoinEmoji}`)
                        );

                    await challengeMessage.edit({ components: [challengeContainer] });
                }
            });

        } else if (btnInt.customId === 'rejectRps') {
            matchLogsString += `\n- <@${targetUser.id}> rejected the challenge`;

            challengeContainer.spliceComponents(challengeContainer.components.length - 3, 3);
            challengeContainer.addSeparatorComponents(largeSeparator);
            challengeContainer.addTextDisplayComponents(
                textDisplay => textDisplay.setContent(matchLogsString)
            );

            return await challengeMessage.edit({ components: [challengeContainer] });
        }
    });

    const targetNotificationMessage = await challengeMessage.reply({ content: `<@${targetUser.id}> You have been challenged!` });

    setTimeout(async () => {
        await targetNotificationMessage.delete();
    }, 2500);
};