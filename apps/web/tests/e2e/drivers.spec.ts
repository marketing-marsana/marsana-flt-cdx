import { test, expect } from "@playwright/test";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "E2E_SUPER_ADMIN_EMAIL",
  "E2E_SUPER_ADMIN_PASSWORD",
  "E2E_NON_ADMIN_EMAIL",
  "E2E_NON_ADMIN_PASSWORD",
];

const hasEnv = requiredEnv.every((key) => Boolean(process.env[key]));

test.describe("drivers module", () => {
  test.skip(!hasEnv, "E2E env vars not set for Supabase-backed tests.");

  test("create, edit, delete driver", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const driverName = `Driver ${suffix}`;
    const license = `LIC-${suffix}`;

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_SUPER_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_SUPER_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/drivers");
    await page.click('a:has-text("New Driver")');

    await page.fill('input[name="fullName"]', driverName);
    await page.fill('input[name="phone"]', "0500000000");
    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.fill('input[name="licenseNumber"]', license);
    await page.selectOption('select[name="status"]', "ACTIVE");
    await page.click('button:has-text("Create Driver")');

    await expect(page.getByRole("heading", { name: driverName })).toBeVisible();

    await page.click('a:has-text("Edit")');
    await page.selectOption('select[name="status"]', "INACTIVE");
    await page.click('button:has-text("Save Changes")');

    await expect(page.getByText("INACTIVE")).toBeVisible();

    await page.fill('input[name="confirmName"]', driverName);
    await page.click('button:has-text("Delete Driver")');
    await expect(page).toHaveURL(/\/drivers$/);
  });

  test("blocks non-admin without permission", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_NON_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_NON_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/drivers");
    await expect(page.getByRole("heading", { name: "You do not have access." })).toBeVisible();
  });
});
