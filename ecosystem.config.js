const path = require('path');

module.exports = {
    apps: [{
        name: 'Cat Bot',
        script: 'index.js',
        autorestart: true,
        watch: false,
        max_memory_restart: '3G',
        max_restarts: 100,
        restart_delay: 5000,
        output: path.resolve(__dirname, 'logs', 'out.log'),
        error: path.resolve(__dirname, 'logs', 'error.log'),
        instances: 1,
        exec_mode: 'fork'
    }]
};