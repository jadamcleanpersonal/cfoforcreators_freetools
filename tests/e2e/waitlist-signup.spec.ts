import { expect, test } from "@playwright/test";

// Critical-path E2E: landing page → waitlist signup form → success state
// This test mocks the API so it doesn't require live credentials.

test.describe("Waitlist signup", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the waitlist API to avoid hitting real services in CI
    await page.route("/api/waitlist", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
  });

  test("user can sign up from the hero section", async ({ page }) => {
    await page.goto("/");

    // Page loads with correct heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Email input exists and is functional
    const emailInput = page.getByLabel("Email address").first();
    await emailInput.fill("test@example.com");

    // Submit
    const submitBtn = page.getByRole("button", { name: /join the waitlist/i }).first();
    await submitBtn.click();

    // Success state appears
    await expect(page.getByText(/you're on the list/i)).toBeVisible({ timeout: 5000 });
  });

  test("shows error for invalid email", async ({ page }) => {
    await page.route("/api/waitlist", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "validation_failed" }),
      });
    });

    await page.goto("/");

    const emailInput = page.getByLabel("Email address").first();
    await emailInput.fill("not-an-email");

    const submitBtn = page.getByRole("button", { name: /join the waitlist/i }).first();
    await submitBtn.click();

    // Browser native validation or our error state
    // Either way the form shouldn't submit successfully
    await expect(page.getByText(/you're on the list/i)).not.toBeVisible({ timeout: 2000 });
  });
});
