import { describe, expect, it } from "vitest";

import { formatEntryDate, formatEntryDateMachine } from "../src/lib/formatEntryDate";

describe("formatEntryDate", () => {
  it("formats UTC midnight as the same calendar day", () => {
    expect(formatEntryDate(new Date("2026-09-24T00:00:00Z"))).toBe("24 September 2026");
  });

  it("formats the machine-readable value as an ISO date", () => {
    expect(formatEntryDateMachine(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
  });
});
