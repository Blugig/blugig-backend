module.exports = {
    apps: [
        {
            name: "backend",
            script: "src/index.ts",
            interpreter: "node",
            interpreter_args: "-r ts-node/register",
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
