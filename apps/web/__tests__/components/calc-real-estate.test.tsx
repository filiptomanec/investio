/**
 * Tests for the real estate calculator page.
 *
 * Mocks next-intl hooks since tests run outside Next.js context.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Mock next-intl
// ---------------------------------------------------------------------------

const mockTranslations: Record<string, string> = {
  "title": "Nemovitost & cashflow",
  "subtitle": "Měsíční cashflow, IRR a růst equity při koupi investiční nemovitosti.",
  "fields.purchasePrice": "Kupní cena",
  "fields.downPayment": "Vlastní kapitál",
  "fields.rate": "Úrok",
  "fields.term": "Splatnost",
  "fields.monthlyRent": "Měsíční nájem",
  "fields.monthlyExpenses": "Měsíční náklady",
  "fields.vacancyRatePct": "Míra neobsazenosti",
  "fields.annualRentGrowthPct": "Roční růst nájmu",
  "fields.annualAppreciationPct": "Roční zhodnocení",
  "fields.incomeTaxPct": "Sazba daně z příjmu",
  "fields.exitMonth": "Měsíc prodeje",
  "sections.purchase": "Koupě",
  "sections.financing": "Financování",
  "sections.income": "Příjmy",
  "sections.costs": "Náklady",
  "sections.horizon": "Horizont",
  "results.monthlyPayment": "Měsíční splátka",
  "results.averageMonthlyCashflow": "Průměrný měs. cashflow",
  "results.grossYield": "Hrubý výnos",
  "results.netYield": "Čistý výnos",
  "results.irr": "IRR (roční)",
  "results.breakEvenMonth": "Break-even měsíc",
  "results.finalEquity": "Finální equity",
  "results.totalCashflow": "Celkový cashflow",
  "results.irrUncomputable": "Nelze spočítat",
  "results.breakEvenNever": "Nikdy",
  "chart.cashflow": "Měsíční cashflow",
  "chart.equity": "Equity",
  "chart.propertyValue": "Hodnota nemovitosti",
  "chart.remainingBalance": "Zbývající dluh",
  "chart.netCashflow": "Čistý cashflow",
  "disclaimer": "Zjednodušený daňový model.",
  "saveTooltip": "Ukládání scénářů bude dostupné v dashboard (T-013)",
};

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => {
    return (key: string) => {
      const fullKey = key;
      return mockTranslations[fullKey] ?? key;
    };
  },
  useLocale: () => "cs",
}));

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => {
  const React = require("react");
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "responsive-container" }, children),
    ComposedChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "composed-chart" }, children),
    AreaChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "area-chart" }, children),
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    Line: () => null,
  };
});

// ---------------------------------------------------------------------------
// Import component under test
// ---------------------------------------------------------------------------

import RealEstatePage from "@/app/[locale]/calc/real-estate/page";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RealEstatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title", () => {
    render(<RealEstatePage />);
    expect(screen.getByText("Nemovitost & cashflow")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<RealEstatePage />);
    expect(
      screen.getByText("Měsíční cashflow, IRR a růst equity při koupi investiční nemovitosti.")
    ).toBeInTheDocument();
  });

  it("renders all accordion sections", () => {
    render(<RealEstatePage />);
    expect(screen.getByText("Koupě")).toBeInTheDocument();
    expect(screen.getByText("Financování")).toBeInTheDocument();
    expect(screen.getByText("Příjmy")).toBeInTheDocument();
    expect(screen.getByText("Náklady")).toBeInTheDocument();
    expect(screen.getByText("Horizont")).toBeInTheDocument();
  });

  it("renders purchase price input with default value", () => {
    render(<RealEstatePage />);
    const input = screen.getByLabelText("Kupní cena") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(parseFloat(input.value)).toBe(6_000_000);
  });

  it("renders down payment input with default value", () => {
    render(<RealEstatePage />);
    const input = screen.getByLabelText("Vlastní kapitál") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(parseFloat(input.value)).toBe(1_500_000);
  });

  it("renders monthly rent input with default value", () => {
    render(<RealEstatePage />);
    const input = screen.getByLabelText("Měsíční nájem") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(parseFloat(input.value)).toBe(22_000);
  });

  it("renders results panel with result items", () => {
    render(<RealEstatePage />);
    expect(screen.getByText("Měsíční splátka")).toBeInTheDocument();
    expect(screen.getByText("Průměrný měs. cashflow")).toBeInTheDocument();
    expect(screen.getByText("Hrubý výnos")).toBeInTheDocument();
    expect(screen.getByText("Čistý výnos")).toBeInTheDocument();
    expect(screen.getByText("IRR (roční)")).toBeInTheDocument();
    expect(screen.getByText("Finální equity")).toBeInTheDocument();
    expect(screen.getByText("Celkový cashflow")).toBeInTheDocument();
  });

  it("renders two chart containers", () => {
    render(<RealEstatePage />);
    const containers = screen.getAllByTestId("responsive-container");
    expect(containers.length).toBe(2);
  });

  it("renders the disclaimer text", () => {
    render(<RealEstatePage />);
    expect(screen.getByText("Zjednodušený daňový model.")).toBeInTheDocument();
  });

  it("renders a disabled save button", () => {
    render(<RealEstatePage />);
    const saveBtn = screen.getByRole("button", { name: /uložit/i });
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveAttribute("aria-disabled", "true");
  });

  it("accordion sections are open by default (fields visible)", () => {
    render(<RealEstatePage />);
    // All fields should be visible since all accordion items are open by default
    expect(screen.getByLabelText("Kupní cena")).toBeVisible();
    expect(screen.getByLabelText("Měsíční nájem")).toBeVisible();
  });

  it("accordion can be toggled — closing and re-opening a section", async () => {
    const user = userEvent.setup();
    render(<RealEstatePage />);

    const purchaseTrigger = screen.getByRole("button", { name: /koupě/i });
    expect(purchaseTrigger).toBeInTheDocument();

    // Toggle close
    await user.click(purchaseTrigger);
    // Toggle open again
    await user.click(purchaseTrigger);

    // After re-opening the field should still be there
    expect(screen.getByLabelText("Kupní cena")).toBeInTheDocument();
  });

  it("all form inputs are type=number for numeric keyboard", () => {
    render(<RealEstatePage />);
    const inputs = screen.getAllByRole("spinbutton"); // type=number inputs have role=spinbutton
    expect(inputs.length).toBeGreaterThan(5);
    inputs.forEach((input) => {
      expect(input).toHaveAttribute("type", "number");
    });
  });

  it("main section has aria-live for result updates", () => {
    render(<RealEstatePage />);
    const resultsSection = screen.getByRole("region", { name: /výsledky a grafy/i });
    expect(resultsSection).toHaveAttribute("aria-live", "polite");
  });
});
