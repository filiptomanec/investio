// World Bank inflation data — Consumer price index, annual % change (FP.CPI.TOTL.ZG).
// Used by /renta and /advanced to pre-fill the inflation field with the
// historical Czech average for the requested horizon.

export interface InflationSample {
  year: number;
  pct: number;
}

export interface InflationAverage {
  averagePct: number;
  samples: InflationSample[];
}

interface WorldBankRow {
  date: string;
  value: number | null;
}

const WORLD_BANK_CZ_CPI_URL =
  "https://api.worldbank.org/v2/country/CZE/indicator/FP.CPI.TOTL.ZG?format=json&per_page=300";

// Fetches the World Bank's annual Czech CPI series and returns the average
// over the most recent `years` years that have non-null values. Throws when
// the API is unreachable or returns no usable samples.
export async function fetchCzechInflation(years: number): Promise<InflationAverage> {
  const horizon = Math.max(1, Math.round(years));
  const res = await fetch(WORLD_BANK_CZ_CPI_URL);
  if (!res.ok) {
    throw new Error(`World Bank API returned ${res.status}`);
  }
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    throw new Error("World Bank API returned an unexpected payload");
  }
  const rows = json[1] as WorldBankRow[];

  // World Bank returns rows newest-first. Drop null values, take the most
  // recent `horizon` data points, then sort oldest-first for display.
  const recent = rows
    .filter((row) => row.value !== null && Number.isFinite(row.value))
    .slice(0, horizon)
    .map((row) => ({ year: Number(row.date), pct: Number(row.value) }))
    .sort((a, b) => a.year - b.year);

  if (recent.length === 0) {
    throw new Error("World Bank API returned no inflation samples");
  }

  const averagePct = recent.reduce((sum, s) => sum + s.pct, 0) / recent.length;

  return { averagePct, samples: recent };
}
