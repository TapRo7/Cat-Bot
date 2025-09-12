const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const retryInterval = 5 * 1000;

async function startTasks(client, tasksDir = path.join(__dirname, '..', 'tasks')) {
    const taskFiles = fs.readdirSync(tasksDir).filter(f => f.endsWith('.js'));

    for (const file of taskFiles) {
        const fullPath = path.join(tasksDir, file);
        let task;
        try {
            task = require(fullPath);
        } catch (e) {
            console.error(`Failed to load task file ${file}:`, e);
            continue;
        }

        const name = task.name || file;
        const intervalMs = (task.intervalSeconds ?? 0) * 1000;
        if (typeof task.run !== 'function' || intervalMs <= 0) {
            console.warn(`Skipping task ${name}: missing run function or invalid intervalSeconds`);
            continue;
        }

        (async () => {
            let running = false;
            while (true) {
                if (running) {
                    await sleep(retryInterval);
                    continue;
                }

                try {
                    running = true;
                    await task.run(client);
                } catch (err) {
                    console.error(`Error in task ${name}:`, err);
                } finally {
                    running = false;
                }
                await sleep(intervalMs);
            }
        })();
    }
}

module.exports = { startTasks };