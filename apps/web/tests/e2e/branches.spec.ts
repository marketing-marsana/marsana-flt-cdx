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

test.describe("branches module", () => {
  test.skip(!hasEnv, "E2E env vars not set for Supabase-backed tests.");

  test("create, edit, delete branch", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const branchName = `Test Branch ${suffix}`;
    const branchCode = `TST-${suffix}`;

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_SUPER_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_SUPER_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/branches");
    await page.click('a:has-text("New Branch")');

    await page.fill('input[name="name"]', branchName);
    await page.fill('input[name="code"]', branchCode);
    await page.selectOption('select[name="type"]', "B2C");
    await page.selectOption('select[name="status"]', "ACTIVE");
    await page.click('button:has-text("Create Branch")');

    await expect(page.getByRole("heading", { name: branchName })).toBeVisible();

    await page.click('a:has-text("Edit")');
    await page.selectOption('select[name="status"]', "INACTIVE");
    await page.click('button:has-text("Save Changes")');

    await expect(page.getByText("INACTIVE")).toBeVisible();

    await page.fill('input[name="confirmName"]', branchName);
    await page.click('button:has-text("Delete Branch")');

    await expect(page).toHaveURL(/\/branches$/);
    await page.fill('input[name="search"]', branchName);
    await page.click('button:has-text("Apply")');
    await expect(page.getByText("No branches found.")).toBeVisible();
  });

  test("blocks non-admin access", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_NON_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_NON_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/branches");
    await expect(page.getByRole("heading", { name: "You do not have access." })).toBeVisible();
  });
});
