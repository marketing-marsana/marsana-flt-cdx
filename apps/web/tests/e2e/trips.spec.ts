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

function toDateTimeLocal(value: Date) {
  return value.toISOString().slice(0, 16);
}

test.describe("trips module", () => {
  test.skip(!hasEnv, "E2E env vars not set for Supabase-backed tests.");

  test("create trips and run workflow", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const driverName = `Driver ${suffix}`;
    const license = `LIC-${suffix}`;
    const vehicleReg = `REG-${suffix}`;
    const tripCodeA = `TRIP-${suffix}`;
    const tripCodeB = `TRIP-${suffix}-B`;
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_SUPER_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_SUPER_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/drivers/new");
    await page.fill('input[name="fullName"]', driverName);
    await page.fill('input[name="phone"]', "0500000000");
    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.fill('input[name="licenseNumber"]', license);
    await page.selectOption('select[name="status"]', "ACTIVE");
    await page.click('button:has-text("Create Driver")');

    await page.goto("/vehicles/new");
    await page.fill('input[name="registrationNumber"]', vehicleReg);
    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.selectOption('select[name="status"]', "ACTIVE");
    await page.fill('input[name="odometer"]', "100");
    await page.click('button:has-text("Create Vehicle")');

    await page.goto("/trips/new");
    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.fill('input[name="tripCode"]', tripCodeA);
    await page.selectOption('select[name="driverId"]', { label: driverName });
    await page.selectOption('select[name="vehicleId"]', { label: vehicleReg });
    await page.fill('input[name="pickupLocation"]', "Pickup Location");
    await page.fill('input[name="dropoffLocation"]', "Dropoff Location");
    await page.fill('input[name="scheduledStartAt"]', toDateTimeLocal(start));
    await page.fill('input[name="scheduledEndAt"]', toDateTimeLocal(end));
    await page.click('button:has-text("Create Trip")');

    await expect(page.getByRole("heading", { name: tripCodeA })).toBeVisible();
    await page.click('button:has-text("Start Trip")');
    await expect(page.getByText("IN_PROGRESS")).toBeVisible();
    await page.click('button:has-text("Complete Trip")');
    await expect(page.getByText("COMPLETED")).toBeVisible();

    await page.goto("/trips/new");
    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.fill('input[name="tripCode"]', tripCodeB);
    await page.selectOption('select[name="driverId"]', { label: driverName });
    await page.selectOption('select[name="vehicleId"]', { label: vehicleReg });
    await page.fill('input[name="pickupLocation"]', "Pickup Location");
    await page.fill('input[name="dropoffLocation"]', "Dropoff Location");
    await page.fill('input[name="scheduledStartAt"]', toDateTimeLocal(start));
    await page.fill('input[name="scheduledEndAt"]', toDateTimeLocal(end));
    await page.click('button:has-text("Create Trip")');

    await expect(page.getByRole("heading", { name: tripCodeB })).toBeVisible();
    await page.click('button:has-text("Cancel Trip")');
    await expect(page.getByText("CANCELLED")).toBeVisible();
  });

  test("blocks non-admin without permission", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_NON_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_NON_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/trips");
    await expect(page.getByRole("heading", { name: "You do not have access." })).toBeVisible();
  });
});
