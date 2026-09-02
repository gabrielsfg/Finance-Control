import { describe, expect, it } from "vitest";
import { centsToInput, inputToCents } from "./currencyInput";

describe("centsToInput", () => {
  it("renders cents with a decimal comma", () => {
    expect(centsToInput(123456)).toBe("1234,56");
    expect(centsToInput(5)).toBe("0,05");
  });

  // A blank filter bound is open-ended; showing "0,00" would apply a bound the
  // user never set.
  it("renders null as an empty field", () => {
    expect(centsToInput(null)).toBe("");
  });

  it("keeps zero visible", () => {
    expect(centsToInput(0)).toBe("0,00");
  });
});

describe("inputToCents", () => {
  it("reads what a Brazilian keyboard produces", () => {
    expect(inputToCents("1.234,56")).toBe(123456);
    expect(inputToCents("0,05")).toBe(5);
    expect(inputToCents("10")).toBe(1000);
  });

  it("ignores currency symbols and stray characters", () => {
    expect(inputToCents("R$ 1.234,56")).toBe(123456);
  });

  it("returns null for an empty field", () => {
    expect(inputToCents("")).toBeNull();
    expect(inputToCents("R$ ")).toBeNull();
  });

  // Only reachable by pasting: the fields themselves are capped at two decimals.
  it("rounds a third decimal instead of truncating it", () => {
    expect(inputToCents("1,006")).toBe(101);
    expect(inputToCents("1,004")).toBe(100);
  });
});
