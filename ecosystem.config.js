const path = require('path');

module.exports = {
    apps: [{
        name: 'Cat Bot',
        script: 'index.js',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        output: path.resolve(__dirname, 'logs', 'out.log'),
        error: path.resolve(__dirname, 'logs', 'error.log'),
        instances: 1,
        exec_mode: 'fork'
    }]
};