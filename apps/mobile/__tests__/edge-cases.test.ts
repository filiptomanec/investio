import { reformatRaw } from "@investio/shared";

describe("edge cases", () => {
  it("1e10 scientific notation — mantissa only, exponent stripped", () => {
    const { text, value } = reformatRaw("1e10", "en", 0);
    // "e10" is the exponent — strip it, keep mantissa "1"
    expect(value).toBe(1);
    expect(text).toBe("1");
  });

  it("1.5E+3 scientific notation — exponent stripped, mantissa preserved", () => {
    const { text, value } = reformatRaw("1.5E+3", "en", 2);
    expect(value).toBeCloseTo(1.5);
    expect(text).toBe("1.5");
  });

  it("abc non-numeric", () => {
    const { value } = reformatRaw("abc", "en", 0);
    expect(value).toBeNull();
  });

  it("single dot '.' in EN locale — separator only, no digits", () => {
    const { value } = reformatRaw(".", "en", 2);
    // dot with no digits => null value
    expect(value).toBeNull();
  });

  it("single comma ',' in CS locale — separator only, no digits", () => {
    const { value } = reformatRaw(",", "cs", 2);
    expect(value).toBeNull();
  });

  it("very large number 999999999999", () => {
    const { text, value } = reformatRaw("999999999999", "en", 0);
    expect(value).toBe(999999999999);
    expect(text).toBe("999 999 999 999");
  });

  it("negative -100", () => {
    const { text, value } = reformatRaw("-100", "en", 0);
    // sign is preserved by reformatRaw
    expect(value).toBe(-100);
    expect(text).toBe("-100");
  });

  it("leading zeros 00100", () => {
    const { text, value } = reformatRaw("00100", "en", 0);
    expect(text).toBe("100");
    expect(value).toBe(100);
  });

  it("rate=0 => 0", () => {
    const { value } = reformatRaw("0", "en", 1);
    expect(value).toBe(0);
  });

  it("rate=100 => 100", () => {
    const { value } = reformatRaw("100", "en", 1);
    expect(value).toBe(100);
  });
});
