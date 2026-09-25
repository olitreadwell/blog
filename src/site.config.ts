/**
 * Strings and links the layouts and feeds share. Change these in one place
 * rather than in each page.
 */
export const siteConfig = {
  title: "Oli Treadwell",
  tagline: "Notes, links, photos and longer writing.",
  description:
    "Notes, links, photos and longer writing from Oli Treadwell, a software engineer in Wellington, New Zealand.",
  url: "https://olitreadwell.github.io",
  base: import.meta.env.BASE_URL,
  author: {
    name: "Oli Treadwell",
    email: "oliver.treadwell@gmail.com",
    link: "https://olitreadwell.github.io",
  },
  locale: "en_NZ",
} as const;

/** Turns a site path such as `posts/hello/` into a full URL for feeds and meta tags. */
export function buildAbsoluteUrl(pathname: string): string {
  const cleanPath = pathname.replace(/^\/+/, "");
  return new URL(cleanPath, `${siteConfig.url}/`).toString();
}

/** The site string the feed endpoints and `llms.txt` share. */
export function buildFeedSiteInfo() {
  return {
    title: siteConfig.title,
    description: siteConfig.description,
    url: `${siteConfig.url}${siteConfig.base.replace(/\/+$/, "")}`,
    authorName: siteConfig.author.name,
  };
}
