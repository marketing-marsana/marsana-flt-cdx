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

test.describe("maintenance module", () => {
  test.skip(!hasEnv, "E2E env vars not set for Supabase-backed tests.");

  test("create, edit, delete maintenance log", async ({ page }) => {
    const suffix = Date.now().toString().slice(-6);
    const driverName = `Driver ${suffix}`;
    const license = `LIC-${suffix}`;
    const vehicleReg = `REG-${suffix}`;
    const tripCode = `TRIP-${suffix}`;
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
    await page.fill('input[name="tripCode"]', tripCode);
    await page.selectOption('select[name="driverId"]', { label: driverName });
    await page.selectOption('select[name="vehicleId"]', { label: vehicleReg });
    await page.fill('input[name="pickupLocation"]', "Pickup Location");
    await page.fill('input[name="dropoffLocation"]', "Dropoff Location");
    await page.fill('input[name="scheduledStartAt"]', toDateTimeLocal(start));
    await page.fill('input[name="scheduledEndAt"]', toDateTimeLocal(end));
    await page.click('button:has-text("Create Trip")');

    await page.goto("/maintenance/new");
    await page.selectOption('select[name="branchId"]', { index: 1 });
    await page.selectOption('select[name="vehicleId"]', { label: vehicleReg });
    await page.selectOption('select[name="tripId"]', { label: tripCode });
    await page.fill('input[name="serviceDate"]', toDateTimeLocal(start));
    await page.selectOption('select[name="maintenanceType"]', "service");
    await page.fill('input[name="description"]', "Oil change");
    await page.fill('input[name="costAmount"]', "150");
    await page.fill('input[name="odometer"]', "150");
    await page.click('button:has-text("Create Maintenance Log")');

    await expect(page.getByRole("heading", { name: vehicleReg })).toBeVisible();

    await page.click('a:has-text("Edit")');
    await page.fill('input[name="costAmount"]', "175");
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText("SAR")).toBeVisible();

    const url = page.url();
    const maintenanceId = url.split("/").pop() as string;
    await page.fill('input[name="confirmLabel"]', maintenanceId);
    await page.click('button:has-text("Delete Maintenance Log")');
    await expect(page).toHaveURL(/\/maintenance$/);
  });

  test("blocks non-admin without permission", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.E2E_NON_ADMIN_EMAIL as string);
    await page.fill('input[name="password"]', process.env.E2E_NON_ADMIN_PASSWORD as string);
    await page.click('button:has-text("Sign In")');

    await page.goto("/maintenance");
    await expect(page.getByRole("heading", { name: "You do not have access." })).toBeVisible();
  });
});
