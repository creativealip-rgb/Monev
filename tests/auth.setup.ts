import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "tests/.auth/user.json";

setup("authenticate via register", async ({ page, request }) => {
  setup.setTimeout(300000);

  // Step 1: Warm up the server
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Buat Akun")).toBeVisible({ timeout: 60000 });

  // Step 2: Register new user via API
  const testEmail = `test_${Date.now()}@monev.test`;
  const testPassword = `test_${Math.random().toString(36).substring(2, 15)}_Pass123!`;
  
  const registerResp = await request.post("/api/auth/register", {
    data: { 
      email: testEmail, 
      password: testPassword,
      name: "Test User"
    },
    timeout: 60000,
  });

  const registerResult = await registerResp.json();
  if (!registerResult.success) {
    throw new Error(`Register API failed: ${JSON.stringify(registerResult)}`);
  }

  // Step 3: Sign in via NextAuth
  const csrfResp = await request.get("/api/auth/csrf", { timeout: 30000 });
  const { csrfToken } = await csrfResp.json();

  await request.post("/api/auth/callback/credentials", {
    form: {
      email: testEmail,
      password: testPassword,
      csrfToken,
      callbackUrl: "/dashboard",
      json: "true",
    },
    timeout: 120000,
    maxRedirects: 0,
  });

  // Step 4: Navigate - might go to onboarding first
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);

  // Step 5: Handle onboarding if redirected there
  const currentUrl = page.url();
  if (currentUrl.includes("/onboarding") || await page.getByText("Mulai Sekarang").isVisible().catch(() => false)) {
    // Skip onboarding - click "Lewati" (Skip) or "Mulai Sekarang"
    const skipBtn = page.getByText("Lewati");
    const startBtn = page.getByText("Mulai Sekarang");

    if (await skipBtn.isVisible().catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(3000);
    } else if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }

    // Continue clicking through onboarding screens
    for (let i = 0; i < 5; i++) {
      const url = page.url();
      if (url.includes("/dashboard")) break;

      const nextBtn = page.getByText(/Lewati|Lanjut|Mulai|Skip|Next|Selesai/i).first();
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(2000);
      } else {
        break;
      }
    }

    // Navigate to dashboard if not there yet
    if (!page.url().includes("/dashboard")) {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    }
  }

  // Step 6: Wait for dashboard
  await expect(page.getByText(/Hello|Halo/i)).toBeVisible({ timeout: 120000 });

  // Save auth state
  await page.context().storageState({ path: AUTH_FILE });
});
