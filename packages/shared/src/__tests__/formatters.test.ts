import { describe, expect, it } from "vitest";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatPercent,
} from "../formatters/index";

describe("formatCurrency", () => {
  it("formats CZK in cs locale without decimals", () => {
    const result = formatCurrency(12345, "CZK", "cs");
    // cs-CZ puts currency symbol after the number
    expect(result).toMatch(/12[\s ]?345/);
    expect(result).toMatch(/Kč/);
  });

  it("formats USD in en locale without decimals", () => {
    const result = formatCurrency(12345, "USD", "en");
    expect(result).toMatch(/\$12,345/);
  });

  it("formats EUR in cs locale", () => {
    const result = formatCurrency(1000, "EUR", "cs");
    expect(result).toMatch(/1[\s ]?000/);
    expect(result).toMatch(/€/);
  });

  it("formats CZK in en locale as currency code", () => {
    const result = formatCurrency(5000, "CZK", "en");
    expect(result).toMatch(/5,000/);
    // en-US falls back to currency code for CZK
    expect(result).toMatch(/CZK|Kč/);
  });

  it("rounds to 0 decimal places", () => {
    const result = formatCurrency(99.99, "USD", "en");
    expect(result).not.toMatch(/\./);
    expect(result).toMatch(/\$100/);
  });
});

describe("formatPercent", () => {
  it("formats 7.5% with 1 decimal in cs locale", () => {
    const result = formatPercent(0.075, "cs");
    expect(result).toMatch(/7[,.]5/);
    expect(result).toMatch(/%/);
  });

  it("formats 7.5% with 1 decimal in en locale", () => {
    const result = formatPercent(0.075, "en");
    expect(result).toMatch(/7\.5%/);
  });

  it("formats 10% with 0 decimals", () => {
    const result = formatPercent(0.1, "cs", 0);
    expect(result).toMatch(/10/);
    expect(result).not.toMatch(/[,.]0/);
  });

  it("formats 100% correctly", () => {
    const result = formatPercent(1.0, "en");
    expect(result).toMatch(/100\.0%/);
  });

  it("uses custom fractionDigits", () => {
    const result = formatPercent(0.1234, "en", 2);
    expect(result).toMatch(/12\.34%/);
  });
});

describe("formatDate", () => {
  it("formats a Date object in cs locale (long)", () => {
    const result = formatDate(new Date("2025-01-15"), "cs");
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/ledna|1/);
    expect(result).toMatch(/15/);
  });

  it("formats a Date object in en locale (long)", () => {
    const result = formatDate(new Date("2025-01-15"), "en");
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/January/);
    expect(result).toMatch(/15/);
  });

  it("accepts a date string", () => {
    const result = formatDate("2025-06-01", "en");
    expect(result).toMatch(/June/);
    expect(result).toMatch(/2025/);
  });
});

describe("formatCompact", () => {
  it("formats millions in en locale", () => {
    const result = formatCompact(1_200_000, "en");
    expect(result).toMatch(/1\.2M/);
  });

  it("formats thousands in en locale", () => {
    const result = formatCompact(5_500, "en");
    expect(result).toMatch(/5\.5K/);
  });
});
