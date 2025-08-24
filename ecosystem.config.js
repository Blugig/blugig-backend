module.exports = {
    apps: [
        {
            name: "backend",
            script: "npm",
            args: "run start",
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
