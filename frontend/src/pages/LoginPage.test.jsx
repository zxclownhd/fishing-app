import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./LoginPage";
import { login } from "../auth/auth";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ to, children }) => <a href={to}>{children}</a>,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../auth/auth", () => ({
  login: vi.fn(),
}));

vi.mock("../client/i18n/I18nContext", () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(<LoginPage />);

    expect(screen.getByText("auth.loginTitle")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auth.emailPlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auth.passwordPlaceholder")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "auth.loginBtn" })).toBeInTheDocument();
  });

  it("allows typing email and password", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("auth.emailPlaceholder");
    const passwordInput = screen.getByPlaceholderText("auth.passwordPlaceholder");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "secret123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("secret123");
  });

  it("submits valid data and navigates to home", async () => {
    const user = userEvent.setup();
    login.mockResolvedValueOnce({ ok: true });

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("auth.emailPlaceholder");
    const passwordInput = screen.getByPlaceholderText("auth.passwordPlaceholder");
    const submitButton = screen.getByRole("button", { name: "auth.loginBtn" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "secret123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("test@example.com", "secret123");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows error on invalid credentials", async () => {
    const user = userEvent.setup();
    login.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText("auth.emailPlaceholder");
    const passwordInput = screen.getByPlaceholderText("auth.passwordPlaceholder");
    const submitButton = screen.getByRole("button", { name: "auth.loginBtn" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpass");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });
});