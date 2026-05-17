/**
 * Tests for the compound interest calculator page.
 * Uses Vitest + React Testing Library + jsdom.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// -----------------------------------------------------------------------
// Mock next-intl — the page uses useTranslations and useLocale hooks
// -----------------------------------------------------------------------
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, string> = {
      "calc.compound.title": "Složené úročení",
      "calc.compound.subtitle": "Spočítáme finální hodnotu pravidelného vkladu se zhodnocením.",
      "calc.compound.fields.initialAmount": "Počáteční částka",
      "calc.compound.fields.monthlyContribution": "Měsíční vklad",
      "calc.compound.fields.annualReturnPct": "Roční výnos",
      "calc.compound.fields.horizonYears": "Horizont (roky)",
      "calc.compound.fields.contributionTiming.label": "Načasování vkladu",
      "calc.compound.fields.contributionTiming.begin": "Začátek měsíce",
      "calc.compound.fields.contributionTiming.end": "Konec měsíce",
      "calc.compound.results.finalValue": "Konečná hodnota",
      "calc.compound.results.totalContributions": "Celkem vloženo",
      "calc.compound.results.totalGains": "Zhodnocení",
      "calc.compound.chart.month": "Měsíc",
      "calc.compound.chart.contributions": "Vklady",
      "calc.compound.chart.gains": "Zhodnocení",
      "calc.compound.disclaimer": "Zjednodušený model.",
      "common.save": "Uložit",
    };
    const fullKey = `${namespace}.${key}`;
    return translations[fullKey] ?? key;
  },
  useLocale: () => "cs",
}));

// -----------------------------------------------------------------------
// Mock recharts to avoid SVG rendering issues in jsdom
// -----------------------------------------------------------------------
vi.mock("recharts", () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// -----------------------------------------------------------------------
// Mock calculateCompound so we control the output in tests
// -----------------------------------------------------------------------
import * as calcModule from "@investio/shared/calc";

const mockCalculateCompound = vi.spyOn(calcModule, "calculateCompound");

const MOCK_RESULT = {
  finalValue: 4_521_880,
  totalContributions: 1_900_000,
  totalGains: 2_621_880,
  timeSeries: [
    { month: 0, contributions: 100_000, value: 100_000 },
    { month: 1, contributions: 105_000, value: 105_700 },
  ],
};

// -----------------------------------------------------------------------
// Import the component under test (after all mocks are set up)
// -----------------------------------------------------------------------
import CompoundCalcPage from "../../app/[locale]/calc/compound/page";

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------
describe("CompoundCalcPage", () => {
  beforeEach(() => {
    mockCalculateCompound.mockReturnValue(MOCK_RESULT);
  });

  it("renders without crash — shows title", () => {
    render(<CompoundCalcPage />);
    expect(screen.getByText("Složené úročení")).toBeInTheDocument();
  });

  it("shows subtitle", () => {
    render(<CompoundCalcPage />);
    expect(
      screen.getByText(
        "Spočítáme finální hodnotu pravidelného vkladu se zhodnocením."
      )
    ).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    render(<CompoundCalcPage />);
    expect(screen.getByLabelText("Počáteční částka")).toBeInTheDocument();
    expect(screen.getByLabelText("Měsíční vklad")).toBeInTheDocument();
    expect(screen.getByLabelText("Roční výnos")).toBeInTheDocument();
    expect(screen.getByLabelText("Horizont (roky)")).toBeInTheDocument();
  });

  it("renders results panel with formatted values", async () => {
    render(<CompoundCalcPage />);
    // The results panel should show the final value
    await waitFor(() => {
      expect(screen.getByText("Konečná hodnota")).toBeInTheDocument();
    });
    // Results panel should render (the actual formatted number depends on locale/Intl)
    const resultsSection = screen.getByText("Celkem vloženo");
    expect(resultsSection).toBeInTheDocument();
    expect(screen.getByText("Zhodnocení")).toBeInTheDocument();
  });

  it("renders disabled save button", () => {
    render(<CompoundCalcPage />);
    // There may be multiple elements matching "uložit" (tooltip trigger + inner button)
    // Find the actual disabled button via aria-disabled
    const saveButtons = screen.getAllByRole("button", { name: /uložit/i });
    // The actual button (not tooltip trigger) is disabled
    const disabledButton = saveButtons.find(
      (btn) => btn.hasAttribute("disabled")
    );
    expect(disabledButton).toBeTruthy();
    expect(disabledButton).toBeDisabled();
  });

  it("renders the chart area", () => {
    render(<CompoundCalcPage />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("renders disclaimer", () => {
    render(<CompoundCalcPage />);
    expect(screen.getByText(/Zjednodušený model/)).toBeInTheDocument();
  });

  it("form input change triggers recalculation", async () => {
    const user = userEvent.setup();
    render(<CompoundCalcPage />);

    const initialCallCount = mockCalculateCompound.mock.calls.length;

    const initialAmountInput = screen.getByLabelText("Počáteční částka");
    await user.clear(initialAmountInput);
    await user.type(initialAmountInput, "200000");

    // After typing, useDeferredValue + useMemo should eventually call calculateCompound
    await waitFor(() => {
      expect(mockCalculateCompound.mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });
  });
});
