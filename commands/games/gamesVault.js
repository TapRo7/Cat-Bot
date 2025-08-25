const { ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCatCoinsUser, customUpdateCatCoinsUser } = require('../../database/catCoins');
const { criticalErrorNotify } = require('../../utils/errorNotifier');

const catCoinEmoji = '<:CatCoin:1401235223831642133>';
const catCheerEmoji = '<a:Cheer:1403153695192911893>';
const catSadEmoji = '<:SadCat:1403156017059074241>';
const catAcceptEmoji = '<a:yes:1403153341780988006>';
const catRejectEmoji = '<a:no:1403153353407725710>';

const largeSeparator = new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large);

const gameTimeoutSeconds = 15;
const totalQuestions = 5;

const difficultySettings = {
    'Easy': { reward: 25, lossPenalty: 15 },
    'Medium': { reward: 40, lossPenalty: 25 },
    'Hard': { reward: 60, lossPenalty: 35 }
};

const mathDifficultySettings = {
    'Easy': { numCount: 5, numRange: [1, 9], offsetRange: 15 },
    'Medium': { numCount: 5, numRange: [10, 99], offsetRange: 30 },
    'Hard': { numCount: 7, numRange: [10, 99], offsetRange: 50 }
};

const criticalErrorContainer = new ContainerBuilder()
    .setAccentColor(0xFFC0CB)
    .addTextDisplayComponents(
        textDisplay => textDisplay.setContent('A critical error occurred updating your coins, this game could not be processed.')
    );

async function generateMathQuestions(difficulty, totalQuestions) {
    const questions = [];

    const config = mathDifficultySettings[difficulty];
    const [minNum, maxNum] = config.numRange;
    const numRange = maxNum - minNum + 1;

    for (let i = 0; i < totalQuestions; i++) {
        const numbers = [];
        for (let j = 0; j < config.numCount; j++) {
            numbers.push(Math.floor(Math.random() * numRange) + minNum);
        }

        let question = numbers[0].toString();
        let correctAnswer = numbers[0];

        for (let j = 1; j < numbers.length; j++) {
            const operation = Math.random() < 0.5 ? '+' : '-';
            question += ` ${operation} ${numbers[j]}`;
            correctAnswer += operation === '+' ? numbers[j] : -numbers[j];
        }

        const wrongAnswers = [];
        const used = new Set([correctAnswer]);

        const generators = [
            () => correctAnswer + Math.floor(Math.random() * 20) - 10,
            () => correctAnswer + (Math.random() < 0.5 ? config.offsetRange : -config.offsetRange),
            () => Math.floor(correctAnswer * (0.8 + Math.random() * 0.4))
        ];

        for (let g = 0; g < 3; g++) {
            let attempt = generators[g]();

            if (used.has(attempt)) {
                attempt = correctAnswer + (g + 1) * (Math.random() < 0.5 ? 7 : -7);
            }

            wrongAnswers.push(attempt);
            used.add(attempt);
        }

        const options = [correctAnswer, ...wrongAnswers];

        for (let k = options.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [options[k], options[j]] = [options[j], options[k]];
        }

        questions.push({ question, correctAnswer, options });
    }

    return questions;
}

async function generateSequenceQuestions(difficulty, totalQuestions) {
    const questions = [];

    for (let i = 0; i < totalQuestions; i++) {
        let seq = [];
        let correctAnswer;

        switch (difficulty) {
            case 'Easy': {
                if (Math.random() < 0.5) {
                    const start = Math.floor(Math.random() * 10);
                    const step = Math.floor(Math.random() * 5) + 1;
                    for (let j = 0; j < 5; j++) seq.push(start + j * step);
                    correctAnswer = start + 5 * step;
                } else {
                    const start = Math.floor(Math.random() * 5) + 1;
                    const mult = Math.floor(Math.random() * 3) + 2;
                    for (let j = 0; j < 5; j++) seq.push(start * Math.pow(mult, j));
                    correctAnswer = start * Math.pow(mult, 5);
                }
                break;
            }

            case 'Medium': {
                const choice = Math.random();
                if (choice < 0.33) {
                    seq = [1, 1];
                    for (let j = 2; j < 5; j++) seq.push(seq[j - 1] + seq[j - 2]);
                    correctAnswer = seq[4] + seq[3];
                } else if (choice < 0.66) {
                    let start = Math.floor(Math.random() * 20);
                    const step = Math.floor(Math.random() * 5) + 2;
                    for (let j = 0; j < 5; j++) {
                        seq.push(start);
                        start += j % 2 === 0 ? step : -step;
                    }
                    correctAnswer = start;
                } else {
                    const base = Math.floor(Math.random() * 5) + 1;
                    for (let j = base; j < base + 5; j++) seq.push(j * j);
                    correctAnswer = (base + 5) * (base + 5);
                }
                break;
            }

            case 'Hard': {
                const choice = Math.random();
                if (choice < 0.5) {
                    seq = [1, 2, 6, 24];
                    correctAnswer = 120;
                } else {
                    const c = Math.floor(Math.random() * 5);
                    for (let j = 1; j <= 5; j++) seq.push(j * j + c);
                    correctAnswer = 36 + c;
                }
                break;
            }
        }

        const wrongAnswers = [];
        const used = new Set([correctAnswer]);

        const generators = [
            () => correctAnswer + Math.floor(Math.random() * 10) - 5,
            () => correctAnswer + (Math.random() < 0.5 ? 2 : -2),
            () => Math.floor(correctAnswer * (0.8 + Math.random() * 0.4))
        ];

        for (let g = 0; g < 3; g++) {
            let attempt = generators[g]();
            if (used.has(attempt)) {
                attempt = correctAnswer + (g + 1) * (Math.random() < 0.5 ? 3 : -3);
            }
            wrongAnswers.push(attempt);
            used.add(attempt);
        }

        const options = [correctAnswer, ...wrongAnswers];

        for (let k = options.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [options[k], options[j]] = [options[j], options[k]];
        }

        questions.push({
            question: seq.join(', ') + ', ?',
            correctAnswer,
            options
        });
    }

    return questions;
}

const acceptButton = new ButtonBuilder()
    .setCustomId('acceptVault')
    .setLabel('Yes')
    .setStyle(ButtonStyle.Success)
    .setEmoji(catAcceptEmoji);

const rejectButton = new ButtonBuilder()
    .setCustomId('rejectVault')
    .setLabel('No')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(catRejectEmoji);

module.exports = async (interaction) => {
    const difficulty = interaction.options.getString('difficulty');
    const questionType = interaction.options.getString('type');
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
            textDisplay => textDisplay.setContent(`Are you sure you want to crack the vault on **${difficulty}** difficulty?\n\nYou must answer **5 math questions correctly** in a row to win!\nOne wrong answer and you lose everything!\n\nIf you win you will get **${settings.reward} Cat Coins** ${catCoinEmoji}\nIf you lose, you will lose **${settings.lossPenalty} Cat Coins** ${catCoinEmoji}`)
        )
        .addSeparatorComponents(largeSeparator)
        .addActionRowComponents(actionRow => actionRow.addComponents(acceptButton, rejectButton));

    const confirmFilter = btnInt => {
        return (btnInt.customId === 'acceptVault' || btnInt.customId === 'rejectVault') && btnInt.user.id === interaction.user.id;
    };

    const gameMessage = await interaction.editReply({ components: [confirmationContainer], flags: MessageFlags.IsComponentsV2 });

    const confirmResult = await new Promise((resolve) => {
        const confirmCollector = gameMessage.createMessageComponentCollector({
            filter: confirmFilter,
            time: 60_000,
            max: 1
        });

        confirmCollector.on('collect', async btnInt => {
            resolve(btnInt.customId === 'acceptVault');
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

    let questions;
    if (questionType === 'Sequence') {
        questions = await generateSequenceQuestions(difficulty, totalQuestions);
    } else if (questionType === 'Math Equations') {
        questions = await generateMathQuestions(difficulty, totalQuestions);
    }

    let currentQuestion = 0;
    let matchLogsString = '# Vault Cracking Progress :scroll:';
    let gameEnded = false;

    matchLogsString += `\n- Starting vault crack attempt on **${difficulty}** difficulty`;

    for (let i = 0; i < totalQuestions; i++) {
        if (gameEnded) break;

        currentQuestion = i + 1;
        const questionData = questions[i];

        matchLogsString += `\n- Question ${currentQuestion}: **${questionData.question}**`;

        const answerButtons = new Array();

        for (let i = 0; i < 4; i++) {
            const currentOption = questionData.options[i];

            const optionButton = new ButtonBuilder()
                .setCustomId(`answer_${i}`)
                .setLabel(currentOption.toString())
                .setStyle(ButtonStyle.Primary);

            answerButtons.push(optionButton);
        }

        const answerFilter = btnInt => {
            return btnInt.customId.startsWith('answer_') && btnInt.user.id === interaction.user.id;
        };

        const currentEpoch = Math.floor(Date.now() / 1000);
        const roundEndEpoch = currentEpoch + gameTimeoutSeconds;

        const gameContainer = new ContainerBuilder()
            .setAccentColor(0xFFC0CB)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`# Crack the Vault - ${difficulty} 🔐`)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`### Question ${currentQuestion}/${totalQuestions}\n## ${questionData.question}`)
            )
            .addSeparatorComponents(largeSeparator)
            .addActionRowComponents(
                actionRow => actionRow.addComponents(...answerButtons)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(matchLogsString)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`-# Time Ends: <t:${roundEndEpoch}:R>`)
            );

        await gameMessage.edit({ components: [gameContainer] });

        const answerResult = await new Promise((resolve) => {
            const answerCollector = gameMessage.createMessageComponentCollector({
                filter: answerFilter,
                time: gameTimeoutSeconds * 1000,
                max: 1
            });

            answerCollector.on('collect', async btnInt => {
                const selectedIndex = parseInt(btnInt.customId.split('_')[1]);
                const selectedAnswer = questionData.options[selectedIndex];
                resolve({ answer: selectedAnswer, correct: selectedAnswer === questionData.correctAnswer });
            });

            answerCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    resolve('timeout');
                }
            });
        });

        if (answerResult === 'timeout') {
            gameEnded = true;
            matchLogsString += `\n- **DEFEAT!** Time ran out on question ${currentQuestion}`;

            const timeoutContainer = new ContainerBuilder()
                .setAccentColor(0xFFC0CB)
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(`# Crack the Vault - ${difficulty} 🔐`)
                )
                .addSeparatorComponents(largeSeparator)
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
                return await criticalErrorNotify('Critical error in updating user coins after vault timeout', `User: ${interaction.user.id}\nLoss Penalty: ${settings.lossPenalty}`);
            }

            return await gameMessage.edit({ components: [timeoutContainer] });
        }

        if (!answerResult.correct) {
            gameEnded = true;
            matchLogsString += `\n- **DEFEAT!** Wrong answer: **${answerResult.answer}** (Correct: **${questionData.correctAnswer}**)`;

            const loseContainer = new ContainerBuilder()
                .setAccentColor(0xFFC0CB)
                .addTextDisplayComponents(
                    textDisplay => textDisplay.setContent(`# Crack the Vault - ${difficulty} 🔐`)
                )
                .addSeparatorComponents(largeSeparator)
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
                return await criticalErrorNotify('Critical error in updating user coins after vault loss', `User: ${interaction.user.id}\nLoss Penalty: ${settings.lossPenalty}`);
            }

            return await gameMessage.edit({ components: [loseContainer] });
        }

        matchLogsString += `\n- **Correct!** Answer: **${answerResult.answer}**`;
    }

    // If we made it here, they answered all 5 questions correctly!
    if (!gameEnded) {
        matchLogsString += `\n- **VICTORY!** All 5 questions answered correctly! Vault cracked! 🔐`;

        const winContainer = new ContainerBuilder()
            .setAccentColor(0xFFC0CB)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`# Crack the Vault 🔐 - ${difficulty}`)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(matchLogsString)
            )
            .addSeparatorComponents(largeSeparator)
            .addTextDisplayComponents(
                textDisplay => textDisplay.setContent(`## Victory! ${catCheerEmoji}\nVault cracked! You won **${settings.reward} Cat Coins** ${catCoinEmoji}`)
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
            return await criticalErrorNotify('Critical error in updating user coins after vault win', `User: ${interaction.user.id}\nReward: ${settings.reward}`);
        }

        await gameMessage.edit({ components: [winContainer] });
    }
};