const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, MessageFlags, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextDisplayBuilder } = require('discord.js');
const { getCatCoinsUser, customUpdateCatCoinsUser, coinDatabaseLock } = require('../../database/catCoins');
const { criticalErrorNotify } = require('../../utils/errorNotifier');
const AsyncLock = require('async-lock');

const messageEditLocker = new AsyncLock();

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catAcceptEmoji = '<:Accept:1402090146693648447>';
const catRejectEmoji = '<:Reject:1402090870014087378>';
const catCheerEmoji = '<a:cheer:1401246694968131644>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const NoAcceptTimeoutContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('This game has timed out, the challanged user did not accept in time.')
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

    if (targetUser.id === interaction.user.id) {
        return await interaction.editReply({ content: 'You cannot challange yourself!' });
    }

    const challangerUserData = await getCatCoinsUser(interaction.user.id);

    if (challangerUserData) {
        if (challangerUserData.coins < betAmount) {
            return await interaction.editReply({ content: `You only have **${challangerUserData.coins} Cat Coins** ${catCoinEmoji}, you cannot bet **${betAmount}**` });
        }
    } else {
        return await interaction.editReply({ content: `You have not registered in the Cat Coins System yet, please use </coins register:1401243483649605752> to register before using other commands!` });
    }

    const targetUserData = await getCatCoinsUser(targetUser.id);

    if (targetUserData) {
        if (targetUserData.coins < betAmount) {
            return await interaction.editReply({ content: `The user you are trying to challange only has **${challangerUserData.coins} Cat Coins** ${catCoinEmoji}, they cannot bet **${betAmount}**` });
        }
    } else {
        return await interaction.editReply({ content: 'The user you are trying to challange has not registered in the Cat Coin System' });
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

    const challangeContainer = new ContainerBuilder()
        .setAccentColor(0xFFC0CB)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`# Rock Paper Scissors Battle! 🪨📄✂️\n<@${interaction.user.id}> has challanged <@${targetUser.id}>`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`## Bet 🎰\n**${betAmount} Cat Coins ${catCoinEmoji}**`)
        )
        .addSeparatorComponents(largeSeparator)
        .addTextDisplayComponents(
            textDisplay => textDisplay.setContent(`<@${targetUser.id}> you have been challanged to Rock Paper Scissors, do you accept?`)
        )
        .addActionRowComponents(
            actionRow => actionRow.addComponents(acceptButton, rejectButton)
        );

    const challangeMessage = await interaction.editReply({ components: [challangeContainer], flags: MessageFlags.IsComponentsV2 });

    const rpsFilter = btnInt => {
        return (btnInt.customId === 'acceptRps' || btnInt.customId === 'rejectRps') && btnInt.user.id === targetUser.id;
    };

    const rpsCollector = challangeMessage.createMessageComponentCollector({
        filter: rpsFilter,
        time: 60_000,
        max: 1
    });

    let matchLogsString = '# Match Logs :scroll:';

    rpsCollector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await challangeMessage.edit({ components: [NoAcceptTimeoutContainer] });
        }
    });

    rpsCollector.on('collect', async btnInt => {
        let challangerChoice;
        let targetChoice;

        if (btnInt.customId === 'acceptRps') {
            matchLogsString += `\n- <@${targetUser.id}> accepted the challange\n- Both users are selecting their options`;

            challangeContainer.spliceComponents(challangeContainer.components.length - 3, 3);

            challangeContainer
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

            await challangeMessage.edit({ components: [challangeContainer] });

            const rpsChoiceFilter = slctInt => {
                return (slctInt.user.id === interaction.user.id && !challangerChoice) || (slctInt.user.id == targetUser.id && !targetChoice);
            };

            const rpsChoiceCollector = challangeMessage.createMessageComponentCollector({
                filter: rpsChoiceFilter,
                time: 120_000,
                max: 2
            });

            rpsChoiceCollector.on('collect', async slctInt => {
                await messageEditLocker.acquire('edit', async () => {
                    const selection = slctInt.values[0];
                    const selectorId = slctInt.user.id;

                    if (selectorId === interaction.user.id) {
                        challangerChoice = selection;
                        matchLogsString += `\n- <@${selectorId}> has made their choice`;
                    } else if (selectorId === targetUser.id) {
                        targetChoice = selection;
                        matchLogsString += `\n- <@${selectorId}> has made their choice`;
                    }

                    const matchLogsTextDisplay = new TextDisplayBuilder().setContent(matchLogsString);
                    challangeContainer.spliceComponents(4, 1, matchLogsTextDisplay);
                    await challangeMessage.edit({ components: [challangeContainer] });
                });
            });

            rpsChoiceCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await challangeMessage.edit({ components: [NoSelectionTimeoutContainer] });
                } else if (reason === 'limit') {
                    const winningChoice = await rpsWinner(challangerChoice, targetChoice);
                    let winningUser;
                    let losingUser;

                    if (winningChoice === 'draw') {
                        matchLogsString += `\n- Both users picked **${challangerChoice}**, the match is a draw`;

                        challangeContainer.spliceComponents(challangeContainer.components.length - 4, 4);

                        challangeContainer
                            .addTextDisplayComponents(
                                textDisplay => textDisplay.setContent(matchLogsString)
                            )
                            .addSeparatorComponents(largeSeparator)
                            .addTextDisplayComponents(
                                textDisplay => textDisplay.setContent(`## Draw ${catCheerEmoji}\nBoth users get their **${betAmount} Cat Coins** ${catCoinEmoji} back!`)
                            );

                        return await challangeMessage.edit({ components: [challangeContainer] });
                    }

                    if (winningChoice === 'choice1') {
                        winningUser = interaction.user;
                        losingUser = targetUser;

                        matchLogsString += `\n- <@${losingUser.id}> picked **${targetChoice}** and lost\n- <@${winningUser.id}> picked **${challangerChoice}** and won`;
                    } else if (winningChoice === 'choice2') {
                        winningUser = targetUser;
                        losingUser = interaction.user;

                        matchLogsString += `\n- <@${losingUser.id}> picked **${challangerChoice}** and lost\n- <@${winningUser.id}> picked **${targetChoice}** and won`;
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
                        await challangeMessage.edit({ components: [criticalErrorContainer] });
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
                        await challangeMessage.edit({ components: [criticalErrorContainer] });
                        criticalError = 2;
                    }

                    if (criticalError) {
                        return criticalErrorNotify('Critical error in updating user coins after game', `Critical Error Code: ${criticalError}\nUser 1: ${winningUser.id}\nUser 2: ${losingUser.id}\nBet: ${betAmount}`);
                    }

                    challangeContainer.spliceComponents(challangeContainer.components.length - 4, 4);
                    challangeContainer
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(matchLogsString)
                        )
                        .addSeparatorComponents(largeSeparator)
                        .addTextDisplayComponents(
                            textDisplay => textDisplay.setContent(`## Winner ${catCheerEmoji}\n<@${winningUser.id}> wins **${betAmount} Cat Coins** ${catCoinEmoji}`)
                        );

                    await challangeMessage.edit({ components: [challangeContainer] });
                }
            });

        } else if (btnInt.customId === 'rejectRps') {
            matchLogsString += `\n- <@${targetUser.id}> rejected the challange`;

            challangeContainer.spliceComponents(challangeContainer.components.length - 3, 3);
            challangeContainer.addSeparatorComponents(largeSeparator);
            challangeContainer.addTextDisplayComponents(
                textDisplay => textDisplay.setContent(matchLogsString)
            );

            return await challangeMessage.edit({ components: [challangeContainer] });
        }
    });

    const targetNotificationMessage = await challangeMessage.reply({ content: `<@${targetUser.id}> You have been challanged!` });

    setTimeout(async () => {
        await targetNotificationMessage.delete();
    }, 2500);
};