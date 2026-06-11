import { expect, test } from "@playwright/test";

test.describe("Phase 1 smoke", () => {
  test("can reach the app entrypoint", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(signup|login|dashboard)$/);
  });
});
