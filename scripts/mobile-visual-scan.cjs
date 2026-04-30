const { chromium, devices } = require("@playwright/test");

const BASE_URL = process.env.MONEV_BASE_URL || "https://monev-github-168-144-37-19.sslip.io";
const pages = [
    "dashboard",
    "transactions",
    "analytics",
    "budgets",
    "savings",
    "bills",
    "saldo",
    "reports",
    "recurring",
    "investments",
    "debts",
    "simulations",
    "profile",
    "transactions/import",
    "fitur",
    "fitur/upgrade",
    "fitur/notification-guide",
    "chat",
];

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ...devices["Pixel 5"] });
    const page = await context.newPage();
    const email = `pw_${Date.now()}@monev.test`;
    const password = `Test_${Math.random().toString(36).slice(2)}_Pass123!`;

    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(async ({ email: userEmail, password: userPassword }) => {
        await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: userEmail,
                password: userPassword,
                confirmPassword: userPassword,
                name: "Visual QA",
            }),
        });
    }, { email, password });
    await page.fill("input[type=\"email\"]", email);
    await page.fill("input[type=\"password\"]", password);
    await page.click("button:has-text(\"Masuk\")");
    await page.waitForLoadState("networkidle");

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await page.click("button:has-text(\"Lewati\")", { timeout: 2500 });
            await page.waitForLoadState("networkidle");
            break;
        } catch {
            await page.waitForTimeout(500);
        }
    }

    const out = [];
    for (const path of pages) {
        try {
            await page.goto(`${BASE_URL}/${path}`, { waitUntil: "networkidle", timeout: 30000 });
            const screenshotPath = `/tmp/monev-${path.replaceAll("/", "_")}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: false });
            const data = await page.evaluate(() => {
                const heads = [...document.querySelectorAll("h1,h2")]
                    .slice(0, 8)
                    .map((element) => ({
                        text: element.textContent.trim(),
                        rect: element.getBoundingClientRect(),
                    }))
                    .map((item) => ({
                        text: item.text,
                        top: Math.round(item.rect.top),
                        left: Math.round(item.rect.left),
                        width: Math.round(item.rect.width),
                        height: Math.round(item.rect.height),
                    }));
                const bottomEls = [...document.querySelectorAll("h1,h2,h3,p,button,a,section,div")]
                    .filter((element) => {
                        const rect = element.getBoundingClientRect();
                        const text = (element.textContent || "").trim();
                        return rect.top < innerHeight && rect.bottom > innerHeight - 115 && rect.height > 10 && text.length > 0;
                    })
                    .slice(0, 6)
                    .map((element) => {
                        const rect = element.getBoundingClientRect();
                        return {
                            text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70),
                            top: Math.round(rect.top),
                            bottom: Math.round(rect.bottom),
                        };
                    });
                return {
                    url: location.pathname,
                    heads,
                    bottomEls,
                    bodyText: document.body.innerText.slice(0, 300),
                };
            });

            out.push({ page: path, ok: true, shot: screenshotPath, ...data });
        } catch (error) {
            out.push({ page: path, ok: false, error: String(error) });
        }
    }

    await browser.close();
    console.log(JSON.stringify(out, null, 2));
})();
