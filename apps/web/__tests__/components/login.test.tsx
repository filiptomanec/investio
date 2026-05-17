/**
 * Tests for the login page component.
 * Mocks Supabase browser client and verifies auth flow UI.
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
      "auth.email": "E-mail",
      "auth.password": "Heslo",
      "auth.signIn": "Přihlásit se",
      "auth.signInCta": "Přihlásit se",
      "auth.signInWithGoogle": "Pokračovat s Google",
      "auth.signInError": "Přihlášení selhalo. Zkontrolujte e-mail a heslo.",
      "auth.noAccount": "Nemáte účet?",
      "auth.signUp": "Registrovat",
      "auth.backendNotConfigured": "Backend není nakonfigurován",
      "auth.googleDisabledTooltip": "Připoj Supabase project",
    };
    return map[`${namespace}.${key}`] ?? key;
  },
  useLocale: () => "cs",
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

// Mock @investio/auth/client
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
vi.mock("@investio/auth/client", () => ({
  createBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
  isSupabaseConfigured: vi.fn(() => false), // default: not configured
}));

import { isSupabaseConfigured } from "@investio/auth/client";

// ---------------------------------------------------------------------------
// Import component under test
// ---------------------------------------------------------------------------
import LoginPage from "../../app/[locale]/login/page";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
  });

  it("renders the form with email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Heslo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Přihlásit se" })
    ).toBeInTheDocument();
  });

  it("shows instructional banner when Supabase is not configured", () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    render(<LoginPage />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Backend není nakonfigurován"
    );
  });

  it("Google button is disabled when Supabase is not configured", () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    render(<LoginPage />);
    // The actual button (nested inside the tooltip trigger span) should be disabled
    const googleBtns = screen.getAllByRole("button", {
      name: /pokračovat s google/i,
    });
    // Find the inner button (not the tooltip trigger)
    const innerBtn = googleBtns.find((btn) => btn.hasAttribute("disabled"));
    expect(innerBtn).toBeTruthy();
    expect(innerBtn).toBeDisabled();
  });

  it("Google button is enabled when Supabase is configured", () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    render(<LoginPage />);
    const googleBtns = screen.getAllByRole("button", {
      name: /pokračovat s google/i,
    });
    // Find the inner button — should NOT be disabled
    const innerBtn = googleBtns.find((btn) => !btn.hasAttribute("disabled"));
    expect(innerBtn).toBeTruthy();
    expect(innerBtn).not.toBeDisabled();
  });

  it("calls signInWithPassword on submit with valid credentials", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "test@example.com");
    await user.type(screen.getByLabelText("Heslo"), "password123");
    await user.click(screen.getByRole("button", { name: "Přihlásit se" }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("redirects to dashboard on successful login", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "test@example.com");
    await user.type(screen.getByLabelText("Heslo"), "password123");
    await user.click(screen.getByRole("button", { name: "Přihlásit se" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/cs/dashboard");
    });
  });

  it("shows error message on login failure", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "test@example.com");
    await user.type(screen.getByLabelText("Heslo"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Přihlásit se" }));

    await waitFor(() => {
      expect(
        screen.getByText("Přihlášení selhalo. Zkontrolujte e-mail a heslo.")
      ).toBeInTheDocument();
    });
  });

  it("calls signInWithOAuth when Google button is clicked", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    mockSignInWithOAuth.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginPage />);

    // Find all buttons matching "pokračovat s google" — the inner button (not tooltip trigger)
    // The inner button does NOT have tabIndex=-1 (that's the tooltip trigger)
    const googleBtns = screen.getAllByRole("button", {
      name: /pokračovat s google/i,
    });

    // The tooltip trigger has tabIndex=-1; the inner button has tabIndex=0
    const innerBtn =
      googleBtns.find((btn) => btn.getAttribute("tabindex") !== "-1") ??
      googleBtns[googleBtns.length - 1]!;

    await user.click(innerBtn);

    await waitFor(
      () => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: expect.objectContaining({
            redirectTo: expect.stringContaining("/api/auth/callback"),
          }),
        });
      },
      { timeout: 3000 }
    );
  });

  it("shows link to signup page", () => {
    render(<LoginPage />);
    const signupLink = screen.getByRole("link", { name: "Registrovat" });
    expect(signupLink).toHaveAttribute("href", "/cs/signup");
  });

  it("does not submit form with invalid email", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "not-an-email");
    await user.type(screen.getByLabelText("Heslo"), "password123");
    await user.click(screen.getByRole("button", { name: "Přihlásit se" }));

    await waitFor(() => {
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });
});
