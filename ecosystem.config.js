module.exports = {
    apps: [
        {
            name: "monev",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                // Add other environment variables here if needed, 
                // or prioritize loading them from .env file
            },
        },
    ],
};
