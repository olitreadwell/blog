import { describe, expect, it } from "vitest";
import { z } from "astro/zod";

import {
  linkEntryFields,
  photoEntryFields,
  postBaseFields,
  postKindSchema,
} from "../src/lib/postFrontMatter";

const baseSchema = z.object(postBaseFields);
const linkSchema = z.object({ ...postBaseFields, ...linkEntryFields });
const photoSchema = z.object({ ...postBaseFields, ...photoEntryFields });

describe("postBaseFields", () => {
  it("accepts a minimal note", () => {
    const parsed = baseSchema.parse({ date: "2026-09-24" });

    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.tags).toEqual([]);
    expect(parsed.draft).toBe(false);
  });

  it("coerces an ISO date string", () => {
    const parsed = baseSchema.parse({ date: "2026-09-24T09:30:00Z" });

    expect(parsed.date.toISOString()).toBe("2026-09-24T09:30:00.000Z");
  });

  it("rejects a missing date", () => {
    expect(() => baseSchema.parse({ title: "No date" })).toThrow();
  });

  it("rejects a canonical value that is not a URL", () => {
    expect(() => baseSchema.parse({ date: "2026-09-24", canonical: "nope" })).toThrow();
  });
});

describe("postKindSchema", () => {
  it("accepts the four kinds", () => {
    expect(postKindSchema.options).toEqual(["post", "link", "photo", "note"]);
  });

  it("rejects an unknown kind", () => {
    expect(() => postKindSchema.parse("video")).toThrow();
  });
});

describe("linkEntryFields", () => {
  it("requires a URL", () => {
    expect(() => linkSchema.parse({ date: "2026-09-24" })).toThrow();
  });

  it("accepts a URL without a site name", () => {
    const parsed = linkSchema.parse({
      date: "2026-09-24",
      url: "https://docs.astro.build/",
    });

    expect(parsed.url).toBe("https://docs.astro.build/");
  });
});

describe("photoEntryFields", () => {
  it("requires alt text on every image", () => {
    expect(() =>
      photoSchema.parse({
        date: "2026-09-24",
        images: [{ src: "/media/photo.avif" }],
      }),
    ).toThrow();
  });

  it("rejects an empty image list", () => {
    expect(() => photoSchema.parse({ date: "2026-09-24", images: [] })).toThrow();
  });

  it("accepts an image with a caption", () => {
    const parsed = photoSchema.parse({
      date: "2026-09-24",
      images: [{ src: "/media/photo.avif", alt: "Harbour at dusk.", caption: "Dusk." }],
    });

    expect(parsed.images[0]?.alt).toBe("Harbour at dusk.");
  });
});
