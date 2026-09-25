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

  expect(hrefs.length).toBeGreaterThan(0);

  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), `${href} should resolve`).toBe(200);
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
  expect(feed.items.length).toBeGreaterThan(0);

  const archiveResponse = await request.get("posts.json");
  expect(archiveResponse.status()).toBe(200);
  expect((await archiveResponse.json()).count).toBe(feed.items.length);

  const llmsResponse = await request.get("llms.txt");
  expect(llmsResponse.status()).toBe(200);
  expect(await llmsResponse.text()).toContain("# Oli Treadwell");

  const corpusResponse = await request.get("all.md");
  expect(corpusResponse.status()).toBe(200);

  const twinResponse = await request.get("posts/a-blog-i-own.md");
  expect(twinResponse.status()).toBe(200);
  expect(await twinResponse.text()).toContain('"slug": "a-blog-i-own"');
});

test("the sitemap lists the home page", async ({ request }) => {
  const sitemapIndex = await (await request.get("sitemap-index.xml")).text();
  expect(sitemapIndex).toContain("<sitemapindex");

  const sitemap = await (await request.get("sitemap-0.xml")).text();
  expect(sitemap).toContain("https://olitreadwell.github.io/blog/");
});
