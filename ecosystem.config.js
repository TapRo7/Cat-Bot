module.exports = {
    apps: [{
        name: 'Cat Bot',
        script: 'index.js',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        instances: 1
    }]
};