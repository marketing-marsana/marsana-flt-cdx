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

test.describe("users module", () => {
  test.skip(!hasEnv, "E2E env vars not set for Supabase-backed tests.");

  test("create user, edit permissions, change branch, delete", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const userName = `Test User ${suffix}`;
    const userEmail = `test.user.${suffix}@example.com`;
    const userPassword = `Pass${suffix}!`;

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_SUPER_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_SUPER_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/users");
    await page.click('a:has-text("New User")');

    await page.fill('input[name="fullName"]', userName);
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="phone"]', "0500000000");
    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.fill('input[name="designation"]', "Coordinator");
    await page.selectOption('select[name="status"]', "ACTIVE");
    await page.fill('input[name="password"]', userPassword);

    await page.check('input[type="checkbox"] >> nth=1');

    await page.click('button:has-text("Create User")');
    await expect(page.getByRole("heading", { name: userName })).toBeVisible();

    await page.click('a:has-text("Edit")');
    await page.selectOption('select[name="branchId"]', { index: 2 });
    await page.check('input[type="checkbox"] >> nth=2');
    await page.click('button:has-text("Save Changes")');

    await expect(page.getByText("Permissions")).toBeVisible();

    await page.fill('input[name="confirmName"]', userName);
    await page.click('button:has-text("Delete User")');
    await expect(page).toHaveURL(/\/users$/);
  });

  test("blocks non-admin access", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_NON_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_NON_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "You do not have access." })).toBeVisible();
  });
});
