/**
 * Tests for dashboard components.
 * Tests filter chips, scenario cards, and empty state.
 * The main dashboard page is a Server Component — we test its building blocks
 * (FilterChips, ScenarioActions, NewScenarioMenu) as client components.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const map: Record<string, string> = {
      "dashboard.newScenario": "Nový scénář",
      "dashboard.empty.title": "Zatím nemáš žádné scénáře.",
      "dashboard.empty.compoundCta": "Složené úročení",
      "dashboard.empty.realEstateCta": "Nemovitost",
      "dashboard.filter.all": "Vše",
      "dashboard.filter.compound": "Akciové",
      "dashboard.filter.realEstate": "Nemovitosti",
      "dashboard.actions.open": "Otevřít",
      "dashboard.actions.duplicate": "Duplikovat",
      "dashboard.actions.delete": "Smazat",
      "dashboard.actions.deleteConfirm": "Opravdu chceš smazat?",
      "dashboard.types.compound": "Složené úročení",
      "dashboard.types.realEstate": "Nemovitost",
    };
    return map[`${namespace}.${key}`] ?? key;
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockPathname = "/cs/dashboard";
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// ---------------------------------------------------------------------------
// Tests for FilterChips
// ---------------------------------------------------------------------------

import { FilterChips } from "../../components/dashboard/filter-chips";

describe("FilterChips", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter options", () => {
    render(<FilterChips current="all" />);
    expect(screen.getByRole("button", { name: "Vše" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Akciové" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Nemovitosti" })
    ).toBeInTheDocument();
  });

  it("marks the current filter as pressed", () => {
    render(<FilterChips current="compound" />);
    const compoundBtn = screen.getByRole("button", { name: "Akciové" });
    expect(compoundBtn).toHaveAttribute("aria-pressed", "true");

    const allBtn = screen.getByRole("button", { name: "Vše" });
    expect(allBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("navigates when a filter chip is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterChips current="all" />);

    await user.click(screen.getByRole("button", { name: "Akciové" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("type=compound")
      );
    });
  });

  it("removes type param when 'all' is clicked", async () => {
    const user = userEvent.setup();
    render(<FilterChips current="compound" />);

    await user.click(screen.getByRole("button", { name: "Vše" }));

    await waitFor(() => {
      // When type=all, the param should not be in the URL or should be empty
      const callArg = mockPush.mock.calls[0]?.[0] as string;
      expect(callArg).not.toContain("type=compound");
    });
  });
});

// ---------------------------------------------------------------------------
// Tests for ScenarioActions
// ---------------------------------------------------------------------------

import { ScenarioActions } from "../../components/dashboard/scenario-actions";

describe("ScenarioActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset global fetch mock
    global.fetch = vi.fn();
  });

  it("renders the more options button", () => {
    render(
      <ScenarioActions
        scenarioId="test-id-123"
        scenarioName="Testovací scénář"
        scenarioType="compound"
        locale="cs"
      />
    );
    expect(
      screen.getByRole("button", { name: "Akce pro scénář" })
    ).toBeInTheDocument();
  });

  it("calls DELETE endpoint when delete is confirmed", async () => {
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = userEvent.setup();
    render(
      <ScenarioActions
        scenarioId="test-id-123"
        scenarioName="Testovací scénář"
        scenarioType="compound"
        locale="cs"
      />
    );

    // Open menu
    await user.click(screen.getByRole("button", { name: "Akce pro scénář" }));

    // Menu items are rendered in a portal — wait for them to appear in body
    const deleteBtn = await screen.findByText("Smazat");
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/scenarios/test-id-123", {
        method: "DELETE",
      });
    });

    confirmSpy.mockRestore();
  });

  it("does NOT call DELETE when delete is cancelled by user", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    const user = userEvent.setup();
    render(
      <ScenarioActions
        scenarioId="test-id-123"
        scenarioName="Testovací scénář"
        scenarioType="compound"
        locale="cs"
      />
    );

    await user.click(screen.getByRole("button", { name: "Akce pro scénář" }));
    const deleteBtn = await screen.findByText("Smazat");
    await user.click(deleteBtn);

    expect(global.fetch).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("calls duplicate endpoint when duplicate is clicked", async () => {
    vi.mocked(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ scenario: {} }),
    } as Response);

    const user = userEvent.setup();
    render(
      <ScenarioActions
        scenarioId="test-id-123"
        scenarioName="Testovací scénář"
        scenarioType="compound"
        locale="cs"
      />
    );

    await user.click(screen.getByRole("button", { name: "Akce pro scénář" }));
    const dupBtn = await screen.findByText("Duplikovat");
    await user.click(dupBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/scenarios/test-id-123/duplicate",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Tests for NewScenarioMenu
// ---------------------------------------------------------------------------

import { NewScenarioMenu } from "../../components/dashboard/new-scenario-menu";

describe("NewScenarioMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the new scenario button", () => {
    render(<NewScenarioMenu locale="cs" />);
    expect(screen.getByText("Nový scénář")).toBeInTheDocument();
  });

  it("shows compound and real estate options in menu", async () => {
    const user = userEvent.setup();
    render(<NewScenarioMenu locale="cs" />);

    await user.click(screen.getByText("Nový scénář"));

    await waitFor(() => {
      expect(screen.getByText("Složené úročení")).toBeInTheDocument();
      expect(screen.getByText("Nemovitost")).toBeInTheDocument();
    });
  });

  it("navigates to compound calc when compound option is clicked", async () => {
    const user = userEvent.setup();
    render(<NewScenarioMenu locale="cs" />);

    await user.click(screen.getByText("Nový scénář"));
    await user.click(await screen.findByText("Složené úročení"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/cs/calc/compound");
    });
  });

  it("navigates to real estate calc when real estate option is clicked", async () => {
    const user = userEvent.setup();
    render(<NewScenarioMenu locale="cs" />);

    await user.click(screen.getByText("Nový scénář"));
    await user.click(await screen.findByText("Nemovitost"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/cs/calc/real-estate");
    });
  });
});
