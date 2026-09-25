import { expect, test } from "@playwright/test";

test("the skip link moves focus to the main landmark", async ({ page }) => {
  await page.goto("");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeInViewport();
});

test("the keyboard reaches the first entry link", async ({ page }) => {
  await page.goto("");
  const entryLinkCount = await page.locator(".entry h3 a").count();
  test.skip(entryLinkCount === 0, "no entries published yet");

  const firstEntryLink = page.locator(".entry h3 a").first();
  await firstEntryLink.focus();

  await expect(firstEntryLink).toBeFocused();
  await expect(firstEntryLink).toHaveAttribute(
    "href",
    /\/blog\/(posts|notes|links|photos)\//,
  );
});

test("every entry link on the index resolves", async ({ page, request }) => {
  await page.goto("");
  const hrefs = await page
    .locator(".entry h3 a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));

  // The site publishes from an empty content directory, so no entries is a
  // valid state rather than a failure.
  test.skip(hrefs.length === 0, "no entries published yet");

  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), `${href} should resolve`).toBe(200);
  }
});

test("the index explains itself while the blog is empty", async ({ page }) => {
  await page.goto("");
  const entryCount = await page.locator(".entry").count();

  if (entryCount === 0) {
    await expect(page.getByText("Nothing published yet.")).toBeVisible();
  } else {
    await expect(page.locator(".entry").first()).toBeVisible();
  }
});

test("the machine-readable endpoints answer", async ({ request }) => {
  const rssResponse = await request.get("rss.xml");
  expect(rssResponse.status()).toBe(200);
  expect(await rssResponse.text()).toContain("<rss");

  const feedResponse = await request.get("feed.json");
  expect(feedResponse.status()).toBe(200);
  const feed = await feedResponse.json();
  expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
  expect(Array.isArray(feed.items)).toBe(true);

  const archiveResponse = await request.get("posts.json");
  expect(archiveResponse.status()).toBe(200);
  expect((await archiveResponse.json()).count).toBe(feed.items.length);

  const llmsResponse = await request.get("llms.txt");
  expect(llmsResponse.status()).toBe(200);
  expect(await llmsResponse.text()).toContain("# Oli Treadwell");

  const corpusResponse = await request.get("all.md");
  expect(corpusResponse.status()).toBe(200);
});

test("the sitemap lists the home page", async ({ request }) => {
  const sitemapIndex = await (await request.get("sitemap-index.xml")).text();
  expect(sitemapIndex).toContain("<sitemapindex");

  const sitemap = await (await request.get("sitemap-0.xml")).text();
  expect(sitemap).toContain("https://olitreadwell.github.io/blog/");
});
