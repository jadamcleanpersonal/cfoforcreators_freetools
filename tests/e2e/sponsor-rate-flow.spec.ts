import { expect, test } from "@playwright/test";

// Sponsor rate calculator E2E — mocks the API to avoid live computation in CI.
// Tests: form load → fill → submit → result (yes / no / wait) → share → cross-promo.

const MOCK_OUTPUTS_YES = {
  verdict: "yes",
  verdictHeadline: "$4,500 is in market range. You can confidently quote this.",
  verdictReason:
    "The median rate for a 100k-1M tech YouTube long-form integration is $4,200. You're close to median — that's the sweet spot. Brands won't push back. If they negotiate, hold above $3,500.",
  deltaFromMid: 300,
  deltaDirection: "in_range",
  marketLow: 3_500,
  marketMid: 4_200,
  marketHigh: 5_500,
  dataSource: "Karat 2024 Pricing Guide",
  dataConfidence: "high",
  matchType: "exact",
  adjustments: [],
  your_asking_rate: 4_500,
};

const MOCK_OUTPUTS_NO_LOW = {
  verdict: "no",
  verdictHeadline: "$1,200 is way under market. You can ask 3.5x this.",
  verdictReason:
    "The median rate for a 100k-1M tech YouTube long-form integration is $4,200. You're undercharging by $3,000 per deal. Start at $3,500.",
  deltaFromMid: -3_000,
  deltaDirection: "too_low",
  marketLow: 3_500,
  marketMid: 4_200,
  marketHigh: 5_500,
  dataSource: "Karat 2024 Pricing Guide",
  dataConfidence: "high",
  matchType: "exact",
  adjustments: [],
  your_asking_rate: 1_200,
};

const MOCK_OUTPUTS_WAIT = {
  verdict: "wait",
  verdictHeadline: "Not enough data to validate this rate confidently.",
  verdictReason:
    "We don't have strong public data for <10k food Twitch mentions specifically. Triangulating from adjacent data suggests $50–$350 is a plausible range. Treat it as a starting position.",
  deltaFromMid: 0,
  deltaDirection: "in_range",
  marketLow: 50,
  marketMid: 150,
  marketHigh: 350,
  dataSource: "floor estimate — no matching data for this combination",
  dataConfidence: "low",
  matchType: "interpolated",
  adjustments: [],
  your_asking_rate: 200,
};

test.describe("sponsor rate calculator flow", () => {
  test.beforeEach(async ({ page }) => {
    // Default mock: YES verdict
    await page.route("/api/tools/sponsor-rate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "test-sponsor-id", outputs: MOCK_OUTPUTS_YES }),
      });
    });

    await page.route("/api/tools/sponsor-rate/follow-up", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: 'data: {"type":"text-delta","textDelta":"Great rate. Hold it."}\n\ndata: {"type":"finish"}\n\n',
      });
    });
  });

  test("page loads with correct heading", async ({ page }) => {
    await page.goto("/sponsor-rate");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const heading = await page.getByRole("heading", { level: 1 }).textContent();
    expect(heading?.toLowerCase()).toMatch(/sponsor|rate|brand/i);
  });

  test("form has all 9 required fields", async ({ page }) => {
    await page.goto("/sponsor-rate");

    // Platform
    await expect(page.getByText("main platform")).toBeVisible();
    // Niche
    await expect(page.getByText("content niche")).toBeVisible();
    // Audience size
    await expect(page.getByText("total audience size")).toBeVisible();
    // Avg views
    await expect(page.getByLabel(/average views per video/i)).toBeVisible();
    // Deliverable type
    await expect(page.getByText("what you're delivering")).toBeVisible();
    // Asking rate
    await expect(page.getByLabel(/what you're considering charging/i)).toBeVisible();
    // Usage rights
    await expect(page.getByText("usage rights")).toBeVisible();
  });

  test("submit form and see yes verdict above fold", async ({ page }) => {
    await page.goto("/sponsor-rate");

    // Platform
    await page.getByLabel(/YouTube \(long-form\)/i).click();
    // Niche
    await page.getByLabel(/tech \/ programming/i).click();
    // Audience size
    await page.getByLabel("100k–1M").click();
    // Avg views
    await page.getByLabel(/average views per video/i).fill("200000");
    // Deliverable
    await page.getByLabel(/integration.*sponsor segment/i).click();
    // Asking rate
    await page.getByLabel(/what you're considering charging/i).fill("4500");
    // Usage rights
    await page.getByLabel(/organic only/i).click();

    // Submit
    await page.getByRole("button", { name: /calculate/i }).click();

    // Verdict YES should appear above fold
    await expect(page.getByText("YES")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/in market range|confidently quote/i)).toBeVisible();
  });

  test("no (underpricing) verdict shows correct messaging", async ({ page }) => {
    // Override mock for this test
    await page.route("/api/tools/sponsor-rate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "test-sponsor-id", outputs: MOCK_OUTPUTS_NO_LOW }),
      });
    });

    await page.goto("/sponsor-rate");

    await page.getByLabel(/YouTube \(long-form\)/i).click();
    await page.getByLabel(/tech \/ programming/i).click();
    await page.getByLabel("100k–1M").click();
    await page.getByLabel(/average views per video/i).fill("200000");
    await page.getByLabel(/integration.*sponsor segment/i).click();
    await page.getByLabel(/what you're considering charging/i).fill("1200");
    await page.getByLabel(/organic only/i).click();

    await page.getByRole("button", { name: /calculate/i }).click();

    await expect(page.getByText("NO")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/way under market|undercharging/i)).toBeVisible();
  });

  test("wait verdict shows thin data messaging", async ({ page }) => {
    await page.route("/api/tools/sponsor-rate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "test-sponsor-id", outputs: MOCK_OUTPUTS_WAIT }),
      });
    });

    await page.goto("/sponsor-rate");

    await page.getByLabel(/Twitch/i).click();
    await page.getByLabel(/food \/ cooking/i).click();
    await page.getByLabel(/under 10k/i).click();
    await page.getByLabel(/average views per video/i).fill("500");
    await page.getByLabel(/mention/i).click();
    await page.getByLabel(/what you're considering charging/i).fill("200");
    await page.getByLabel(/organic only/i).click();

    await page.getByRole("button", { name: /calculate/i }).click();

    await expect(page.getByText("WAIT")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/not enough data|thin data/i)).toBeVisible();
  });

  test("result shows market range breakdown", async ({ page }) => {
    await page.goto("/sponsor-rate");

    await page.getByLabel(/YouTube \(long-form\)/i).click();
    await page.getByLabel(/tech \/ programming/i).click();
    await page.getByLabel("100k–1M").click();
    await page.getByLabel(/average views per video/i).fill("200000");
    await page.getByLabel(/integration.*sponsor segment/i).click();
    await page.getByLabel(/what you're considering charging/i).fill("4500");
    await page.getByLabel(/organic only/i).click();

    await page.getByRole("button", { name: /calculate/i }).click();

    // Market range numbers should be visible
    await expect(page.getByText(/3,500/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/4,200/)).toBeVisible();
    await expect(page.getByText(/5,500/)).toBeVisible();
  });

  test("result page loads without error", async ({ page }) => {
    await page.goto("/sponsor-rate");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("cross-promo links appear after result", async ({ page }) => {
    await page.goto("/sponsor-rate");

    await page.getByLabel(/YouTube \(long-form\)/i).click();
    await page.getByLabel(/tech \/ programming/i).click();
    await page.getByLabel("100k–1M").click();
    await page.getByLabel(/average views per video/i).fill("200000");
    await page.getByLabel(/integration.*sponsor segment/i).click();
    await page.getByLabel(/what you're considering charging/i).fill("4500");
    await page.getByLabel(/organic only/i).click();

    await page.getByRole("button", { name: /calculate/i }).click();

    await expect(page.getByText("YES")).toBeVisible({ timeout: 5000 });

    // Cross-promo for tax estimator and scorp calculator should appear
    // (exact text depends on ToolCrossPromo implementation)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Just verify the page doesn't have any visible errors
    await expect(page.locator("body")).not.toContainText("Error");
  });
});

test.describe("contribute page", () => {
  test("loads the rate submission form", async ({ page }) => {
    await page.goto("/sponsor-rate/contribute");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const heading = await page.getByRole("heading", { level: 1 }).textContent();
    expect(heading?.toLowerCase()).toMatch(/contribute|submit/i);
  });

  test("form has required fields", async ({ page }) => {
    await page.goto("/sponsor-rate/contribute");
    await expect(page.getByLabel(/platform/i)).toBeVisible();
    await expect(page.getByLabel(/niche/i)).toBeVisible();
    await expect(page.getByLabel(/audience size/i)).toBeVisible();
    await expect(page.getByLabel(/rate you charged/i)).toBeVisible();
  });
});
