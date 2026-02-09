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

test.describe("vehicles module", () => {
  test.skip(!hasEnv, "E2E env vars not set for Supabase-backed tests.");

  test("create, edit, delete vehicle", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const reg = `REG-${suffix}`;
    const vin = `VIN-${suffix}`;

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_SUPER_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_SUPER_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/vehicles");
    await page.click('a:has-text("New Vehicle")');

    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.fill('input[name="registrationNumber"]', reg);
    await page.fill('input[name="make"]', "Toyota");
    await page.fill('input[name="model"]', "Camry");
    await page.fill('input[name="year"]', "2022");
    await page.fill('input[name="color"]', "White");
    await page.fill('input[name="vin"]', vin);
    await page.fill('input[name="fuelType"]', "Gasoline");
    await page.fill('input[name="odometer"]', "1200");
    await page.selectOption('select[name="status"]', "ACTIVE");
    await page.click('button:has-text("Create Vehicle")');

    await expect(page.getByRole("heading", { name: reg })).toBeVisible();

    await page.click('a:has-text("Edit")');
    await page.selectOption('select[name="status"]', "MAINTENANCE");
    await page.fill('input[name="odometer"]', "1300");
    await page.click('button:has-text("Save Changes")');

    await expect(page.getByText("MAINTENANCE")).toBeVisible();

    await page.fill('input[name="confirmValue"]', reg);
    await page.click('button:has-text("Delete Vehicle")');
    await expect(page).toHaveURL(/\/vehicles$/);
  });

  test("blocks non-admin without permission", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_NON_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_NON_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/vehicles");
    await expect(page.getByRole("heading", { name: "You do not have access." })).toBeVisible();
  });
});
