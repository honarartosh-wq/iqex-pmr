module.exports = {
  apps: [
    {
      name: 'iqex',
      script: 'server.ts',
      interpreter: './node_modules/.bin/tsx',
      watch: false,
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
