/**
 * Tests for reformatRaw, caretSig, caretTarget imported from @investio/shared.
 * These cover the same fixtures that the web NumField relies on — verifying
 * the extraction to shared didn't break anything and that both locales work.
 */
import { reformatRaw, caretSig, caretTarget } from "@investio/shared";

describe("reformatRaw", () => {
  describe("CS locale (decimal comma, group space)", () => {
    it("formats a plain integer", () => {
      const { text, value } = reformatRaw("100000", "cs", 0);
      expect(text).toBe("100 000");
      expect(value).toBe(100000);
    });

    it("formats a decimal input", () => {
      const { text, value } = reformatRaw("3,2", "cs", 2);
      expect(text).toBe("3,2");
      expect(value).toBe(3.2);
    });

    it("handles paste of EN-style '1,234.56' in CS locale", () => {
      // Mixed separators: last one (.) is the decimal
      const { text, value } = reformatRaw("1,234.56", "cs", 2);
      expect(value).toBeCloseTo(1234.56);
      expect(text).toContain(",56"); // decimal part in CS
    });

    it("handles paste of CS-style '1.234,56' in CS locale", () => {
      const { text, value } = reformatRaw("1.234,56", "cs", 2);
      expect(value).toBeCloseTo(1234.56);
      expect(text).toContain(",56");
    });

    it("strips leading zeros", () => {
      const { text, value } = reformatRaw("007", "cs", 0);
      expect(text).toBe("7");
      expect(value).toBe(7);
    });

    it("returns null value for empty string", () => {
      const { text, value } = reformatRaw("", "cs", 0);
      expect(value).toBeNull();
      expect(text).toBe("");
    });

    it("returns null value for decimal-only input ',' ", () => {
      const { value } = reformatRaw(",", "cs", 2);
      expect(value).toBeNull();
    });

    it("truncates decimals to maxDecimals", () => {
      const { text } = reformatRaw("3,14159", "cs", 2);
      expect(text).toBe("3,14");
    });

    it("drops decimal when maxDecimals=0", () => {
      const { text, value } = reformatRaw("3,14", "cs", 0);
      expect(text).toBe("3");
      expect(value).toBe(3);
    });
  });

  describe("EN locale (decimal dot, group space)", () => {
    it("formats a plain integer", () => {
      const { text, value } = reformatRaw("100000", "en", 0);
      expect(text).toBe("100 000");
      expect(value).toBe(100000);
    });

    it("formats a decimal input", () => {
      const { text, value } = reformatRaw("3.2", "en", 2);
      expect(text).toBe("3.2");
      expect(value).toBe(3.2);
    });

    it("handles paste of CS-style '1.234,56' in EN locale", () => {
      const { text, value } = reformatRaw("1.234,56", "en", 2);
      expect(value).toBeCloseTo(1234.56);
      expect(text).toContain(".56");
    });

    it("handles paste of EN-style '1,234.56' in EN locale", () => {
      const { value } = reformatRaw("1,234.56", "en", 2);
      expect(value).toBeCloseTo(1234.56);
    });

    it("strips currency symbols from paste", () => {
      const { value } = reformatRaw("$1,234.56", "en", 2);
      expect(value).toBeCloseTo(1234.56);
    });
  });

  describe("trailing zero handling", () => {
    it("preserves trailing zero in decimal part", () => {
      // "3.10" should stay as "3.10" so the user can type the next digit
      const { text } = reformatRaw("3.10", "en", 2);
      expect(text).toBe("3.10");
    });
  });
});

describe("caretSig", () => {
  it("counts digits left of cursor", () => {
    const sig = caretSig("100 000", 4);
    expect(sig.digits).toBe(3); // '1', '0', '0'
    expect(sig.seps).toBe(0);
  });

  it("counts separator left of cursor", () => {
    const sig = caretSig("3,14", 3);
    expect(sig.digits).toBe(2); // '3', '1'
    expect(sig.seps).toBe(1); // ','
  });

  it("handles empty string", () => {
    const sig = caretSig("", 0);
    expect(sig.digits).toBe(0);
    expect(sig.seps).toBe(0);
  });
});

describe("caretTarget", () => {
  it("positions after the first digit", () => {
    const pos = caretTarget("100 000", { digits: 1, seps: 0 });
    expect(pos).toBe(1);
  });

  it("positions after a separator", () => {
    const pos = caretTarget("3,14", { digits: 1, seps: 1 });
    expect(pos).toBe(2); // after ","
  });

  it("falls back to end of string when target exceeds length", () => {
    const pos = caretTarget("42", { digits: 99, seps: 0 });
    expect(pos).toBe(2);
  });
});
