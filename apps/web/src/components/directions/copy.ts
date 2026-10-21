// Czech plural of "rok": 1 rok, 2–4 roky, 0 and 5+ let.
export function yearsCs(n: number) {
  const k = Math.abs(Math.round(n));
  if (k === 1) return "rok";
  if (k >= 2 && k <= 4) return "roky";
  return "let";
}
