/**
 * Tests for the comparison view page.
 * Uses Vitest + React Testing Library + jsdom.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// -----------------------------------------------------------------------
// Mock next/navigation (useSearchParams)
// -----------------------------------------------------------------------
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/cs/compare",
}));

// -----------------------------------------------------------------------
// Mock next/link
// -----------------------------------------------------------------------
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// -----------------------------------------------------------------------
// Mock next-intl
// -----------------------------------------------------------------------
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, string> = {
      "comparison.title": "Porovnání scénářů",
      "comparison.subtitle": "Srovnejte dvě investiční strategie vedle sebe.",
      "comparison.scenarioA": "Scénář A",
      "comparison.scenarioB": "Scénář B",
      "comparison.chart.title": "Trajektorie hodnoty",
      "comparison.chart.xAxis": "Rok",
      "comparison.chart.yAxis": "Hodnota (Kč)",
      "comparison.diff.finalValue": "Finální hodnota",
      "comparison.diff.totalROI": "Celkové zhodnocení",
      "comparison.diff.winner": "Vítěz",
      "comparison.share": "Sdílet odkaz",
      "comparison.shareCopied": "Odkaz zkopírován!",
      "comparison.invalidLink.description": "Odkaz na porovnání je neplatný nebo poškozený.",
      "comparison.invalidLink.backButton": "Zpět na kalkulačky",
      "comparison.winnerA": "Scénář A vyhrává",
      "comparison.winnerB": "Scénář B vyhrává",
      "comparison.tie": "Remíza",
      "comparison.difference": "Rozdíl",
      "comparison.commonHorizon": "Společný horizont",
      "comparison.years": "let",
      "comparison.finalValueLabel": "Finální hodnota",
      "comparison.roiLabel": "Celkové zhodnocení",
      "comparison.inputs": "Vstupy",
      "comparison.result": "Výsledek",
      "comparison.backToDashboard": "Zpět na dashboard",
      "comparison.scenarioTypes.compound": "Složené úročení",
      "comparison.scenarioTypes.real_estate": "Nemovitost",
    };
    const fullKey = `${namespace}.${key}`;
    return translations[fullKey] ?? key;
  },
  useLocale: () => "cs",
}));

// -----------------------------------------------------------------------
// Mock recharts (avoids SVG issues in jsdom)
// -----------------------------------------------------------------------
vi.mock("recharts", () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
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
// Mock compareScenarios so we can control output in winner tests
// -----------------------------------------------------------------------
import * as calcModule from "@investio/shared/calc";

const mockCompareScenarios = vi.spyOn(calcModule, "compareScenarios");

const MOCK_COMPARISON_A_WINS = {
  horizonYears: 20,
  normalizedInitialCapital: 1_500_000,
  a: {
    finalValue: 5_000_000,
    totalROI: 2.33,
    timeSeries: [
      { month: 0, value: 100_000 },
      { month: 12, value: 200_000 },
      { month: 240, value: 5_000_000 },
    ],
  },
  b: {
    finalValue: 3_000_000,
    totalROI: 1.0,
    timeSeries: [
      { month: 0, value: 1_500_000 },
      { month: 12, value: 1_600_000 },
      { month: 240, value: 3_000_000 },
    ],
  },
  difference: {
    finalValueDelta: 2_000_000,
    finalValueDeltaPct: 0.667,
    winnerKey: "a" as const,
  },
};

const MOCK_COMPARISON_B_WINS = {
  ...MOCK_COMPARISON_A_WINS,
  a: { ...MOCK_COMPARISON_A_WINS.a, finalValue: 2_000_000, totalROI: 0.5 },
  b: { ...MOCK_COMPARISON_A_WINS.b, finalValue: 5_000_000, totalROI: 2.33 },
  difference: {
    finalValueDelta: -3_000_000,
    finalValueDeltaPct: -0.6,
    winnerKey: "b" as const,
  },
};

// -----------------------------------------------------------------------
// Import page after all mocks are set up
// -----------------------------------------------------------------------
import ComparePage from "../../app/[locale]/compare/page";

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------
describe("ComparePage", () => {
  beforeEach(() => {
    // Reset search params to empty (default scenarios)
    for (const key of [...mockSearchParams.keys()]) {
      mockSearchParams.delete(key);
    }
    mockCompareScenarios.mockReturnValue(MOCK_COMPARISON_A_WINS);
    // Suppress ResizeObserver not available in jsdom
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders page title", async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByText("Porovnání scénářů")).toBeInTheDocument();
    });
  });

  it("renders default scenarios — shows both scenario columns", async () => {
    render(<ComparePage />);
    await waitFor(() => {
      // Multiple elements can match "Scénář A" (card title + diff panel) — check at least one exists
      const scenarioAElements = screen.getAllByText("Scénář A");
      expect(scenarioAElements.length).toBeGreaterThan(0);
      const scenarioBElements = screen.getAllByText("Scénář B");
      expect(scenarioBElements.length).toBeGreaterThan(0);
    });
  });

  it("renders chart area", async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  it("renders diff panel with winner label", async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByText("Scénář A vyhrává")).toBeInTheDocument();
    });
  });

  it("renders diff table headers", async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByText("Finální hodnota")).toBeInTheDocument();
      expect(screen.getByText("Celkové zhodnocení")).toBeInTheDocument();
    });
  });

  it("renders share button", async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByText("Sdílet odkaz")).toBeInTheDocument();
    });
  });

  it("renders scenario type badges", async () => {
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByText("Složené úročení")).toBeInTheDocument();
      expect(screen.getByText("Nemovitost")).toBeInTheDocument();
    });
  });

  it("shows winner B when B has higher final value", async () => {
    mockCompareScenarios.mockReturnValue(MOCK_COMPARISON_B_WINS);
    render(<ComparePage />);
    await waitFor(() => {
      expect(screen.getByText("Scénář B vyhrává")).toBeInTheDocument();
    });
  });

  it("shows invalid link state for malformed 'a' param", async () => {
    mockSearchParams.set("a", "not-valid-base64!!!");
    render(<ComparePage />);
    await waitFor(() => {
      expect(
        screen.getByText("Odkaz na porovnání je neplatný nebo poškozený.")
      ).toBeInTheDocument();
      expect(screen.getByText("Zpět na kalkulačky")).toBeInTheDocument();
    });
  });

  it("shows invalid link state for malformed 'b' param", async () => {
    // valid a, invalid b
    const validA = encodeURIComponent(
      btoa(
        JSON.stringify({
          type: "compound",
          initialAmount: 100000,
          monthlyContribution: 5000,
          annualReturnPct: 0.07,
          horizonYears: 20,
          contributionTiming: "end",
        })
      )
    );
    mockSearchParams.set("a", validA);
    mockSearchParams.set("b", "invalid!!!");
    render(<ComparePage />);
    await waitFor(() => {
      expect(
        screen.getByText("Odkaz na porovnání je neplatný nebo poškozený.")
      ).toBeInTheDocument();
    });
  });

  it("back button in invalid link state links to calc page", async () => {
    mockSearchParams.set("a", "bad!!!data");
    render(<ComparePage />);
    await waitFor(() => {
      const backBtn = screen.getByText("Zpět na kalkulačky");
      expect(backBtn.closest("a")).toHaveAttribute("href", "/cs/calc/compound");
    });
  });
});
