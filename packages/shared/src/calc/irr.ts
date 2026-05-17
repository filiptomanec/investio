const MAX_ITER = 100;
const TOL = 1e-7;

function npvAt(cashflows: readonly number[], rate: number): number {
  let result = 0;
  for (let t = 0; t < cashflows.length; t++) {
    result += (cashflows[t] ?? 0) / Math.pow(1 + rate, t);
  }
  return result;
}

function dnpvAt(cashflows: readonly number[], rate: number): number {
  let result = 0;
  for (let t = 1; t < cashflows.length; t++) {
    result += (-t * (cashflows[t] ?? 0)) / Math.pow(1 + rate, t + 1);
  }
  return result;
}

function bisect(
  cashflows: readonly number[],
  lo: number,
  hi: number
): number | null {
  const npvLo = npvAt(cashflows, lo);
  const npvHi = npvAt(cashflows, hi);

  // If same sign on both ends, bisection cannot find a root in this interval
  if (npvLo * npvHi > 0) return null;

  let a = lo;
  let b = hi;
  for (let i = 0; i < MAX_ITER * 5; i++) {
    const mid = (a + b) / 2;
    const npvMid = npvAt(cashflows, mid);
    if (Math.abs(npvMid) < TOL || (b - a) / 2 < TOL) return mid;
    if (npvMid * npvAt(cashflows, a) < 0) {
      b = mid;
    } else {
      a = mid;
    }
  }
  return (a + b) / 2;
}

/**
 * Compute the Internal Rate of Return for a sequence of cashflows.
 * Cashflows[0] is typically negative (initial investment), subsequent entries are returns.
 *
 * Uses Newton-Raphson with bisection fallback per architecture.md.
 * Returns null when neither method converges — never returns NaN.
 */
export function irr(cashflows: number[], guess = 0.1): number | null {
  // Guard: need at least one sign change for IRR to exist
  let hasPositive = false;
  let hasNegative = false;
  for (const cf of cashflows) {
    if (cf > 0) hasPositive = true;
    if (cf < 0) hasNegative = true;
  }
  if (!hasPositive || !hasNegative) return null;

  // Newton-Raphson
  let rate = guess;
  for (let i = 0; i < MAX_ITER; i++) {
    const npv = npvAt(cashflows, rate);
    const dnpv = dnpvAt(cashflows, rate);

    if (Math.abs(dnpv) < TOL) break;

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < TOL) {
      return newRate;
    }
    rate = newRate;

    // Clamp to avoid escaping valid range
    if (rate <= -0.99) rate = -0.98;
    if (rate > 10) rate = 9.9;
  }

  // Fallback: bisection in [-0.99, 10.0]
  return bisect(cashflows, -0.99, 10.0);
}
