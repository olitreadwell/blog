import { describe, expect, it } from "vitest";

import {
  formatEntryDate,
  formatEntryDateMachine,
  splitEntryDateParts,
} from "../src/lib/formatEntryDate";

describe("formatEntryDate", () => {
  it("formats UTC midnight as the same calendar day", () => {
    expect(formatEntryDate(new Date("2026-09-24T00:00:00Z"))).toBe("24 September 2026");
  });

  it("formats the machine-readable value as an ISO date", () => {
    expect(formatEntryDateMachine(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
  });
});

describe("splitEntryDateParts", () => {
  it("splits a date into zero-padded URL segments", () => {
    expect(splitEntryDateParts(new Date("2013-10-22T00:00:00Z"))).toEqual({
      year: "2013",
      month: "10",
      day: "22",
    });
  });

  it("keeps a January date zero padded", () => {
    expect(splitEntryDateParts(new Date("2026-01-05T00:00:00Z"))).toEqual({
      year: "2026",
      month: "01",
      day: "05",
    });
  });
});
