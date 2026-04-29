import { spawn } from "node:child_process";

const port = process.env.PORT || "3015";
const host = process.env.QA_CHAT_HOSTNAME || "0.0.0.0";
const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${port}`;

function run(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: "inherit",
            shell: process.platform === "win32",
            env: { ...process.env, ...options.env },
        });

        child.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
        });
        child.on("error", reject);
    });
}

function startServer() {
    const child = spawn("npm", ["run", "start"], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.platform === "win32",
        env: {
            ...process.env,
            PORT: port,
            HOSTNAME: host,
            AI_MODEL: process.env.AI_MODEL || "cx/gpt-5.2",
            AI_FALLBACK_MODEL: process.env.AI_FALLBACK_MODEL || "cx/gpt-5.5",
        },
    });

    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    return child;
}

async function waitForServer() {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        try {
            const response = await fetch(`${baseUrl}/api/ping`, {
                method: "HEAD",
                signal: controller.signal,
            });
            if (response.status > 0) return;
        } catch {
            // Server is still booting.
        } finally {
            clearTimeout(timeout);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(`Server did not become ready at ${baseUrl}`);
}

let server;
try {
    console.log("[qa:chat:local] Running chat unit/API tests...");
    await run("npm", ["run", "test:chat"]);
    console.log("[qa:chat:local] Building app...");
    await run("npm", ["run", "build"]);
    console.log(`[qa:chat:local] Clearing port ${port}...`);
    await run("fuser", ["-k", `${port}/tcp`]).catch(() => undefined);

    console.log(`[qa:chat:local] Starting server at ${baseUrl}...`);
    server = startServer();
    await waitForServer();
    console.log("[qa:chat:local] Running Playwright chat E2E...");
    await run("npm", ["run", "e2e:chat"], { env: { BASE_URL: baseUrl } });
} finally {
    if (server && !server.killed) {
        server.kill("SIGTERM");
    }
    await run("npm", ["run", "clean:test-artifacts"]).catch(() => undefined);
}
