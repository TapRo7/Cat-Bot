export default [
    {
        files: ['**/*.js'],
        languageOptions: {
            globals: {
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                require: 'readonly',
                fetch: 'readonly'
            },
        },
        rules: {
            semi: ['error', 'always'],
            quotes: ['error', 'single', { allowTemplateLiterals: true }],
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-undef': 'error',
            camelcase: ['error', { properties: 'always' }],
        },
    },
];
