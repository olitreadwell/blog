import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every page the site serves, including one entry of each kind that exists.
const pagePaths = ["", "posts/", "notes/", "links/", "photos/"];

for (const pagePath of pagePaths) {
  test(`no accessibility violations on /${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test("no accessibility violations on an entry page", async ({ page }) => {
  await page.goto("");
  const entryLinkCount = await page.locator(".entry h3 a").count();
  test.skip(entryLinkCount === 0, "no entries published yet");

  await page.locator(".entry h3 a").first().click();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
