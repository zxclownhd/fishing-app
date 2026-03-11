import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "./RegisterPage";
import { register } from "../auth/auth";

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
  register: vi.fn(),
}));

vi.mock("../client/i18n/I18nContext", () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders register form fields", () => {
    render(<RegisterPage />);

    expect(screen.getByText("auth.registerTitle")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auth.emailPlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auth.displayNamePlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auth.passwordPlaceholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("auth.confirmPasswordPlaceholder")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "auth.createAccount" })).toBeDisabled();
  });

  it("submits valid data and navigates to home", async () => {
    const user = userEvent.setup();
    register.mockResolvedValueOnce({ ok: true });

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("auth.emailPlaceholder"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("auth.displayNamePlaceholder"),
      "test_user"
    );
    await user.type(
      screen.getByPlaceholderText("auth.passwordPlaceholder"),
      "secret123"
    );
    await user.type(
      screen.getByPlaceholderText("auth.confirmPasswordPlaceholder"),
      "secret123"
    );
    await user.click(screen.getByRole("checkbox"));
    await user.selectOptions(screen.getByRole("combobox"), "OWNER");
    await user.click(screen.getByRole("button", { name: "auth.createAccount" }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret123",
        displayName: "test_user",
        role: "OWNER",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows validation errors for invalid form data", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("auth.emailPlaceholder"),
      "bad-email"
    );
    await user.type(
      screen.getByPlaceholderText("auth.displayNamePlaceholder"),
      "юзер"
    );
    await user.type(
      screen.getByPlaceholderText("auth.passwordPlaceholder"),
      "123"
    );
    await user.type(
      screen.getByPlaceholderText("auth.confirmPasswordPlaceholder"),
      "456"
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "auth.createAccount" }));

    expect(screen.getByText("auth.errors.invalidEmail")).toBeInTheDocument();
    expect(screen.getByText("auth.errors.invalidDisplayName")).toBeInTheDocument();
    expect(screen.getByText("auth.errors.passwordMin")).toBeInTheDocument();
    expect(screen.getByText("auth.errors.passwordMismatch")).toBeInTheDocument();

    expect(register).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows backend error when registration fails", async () => {
    const user = userEvent.setup();
    register.mockRejectedValueOnce(new Error("Registration failed"));

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("auth.emailPlaceholder"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("auth.displayNamePlaceholder"),
      "test_user"
    );
    await user.type(
      screen.getByPlaceholderText("auth.passwordPlaceholder"),
      "secret123"
    );
    await user.type(
      screen.getByPlaceholderText("auth.confirmPasswordPlaceholder"),
      "secret123"
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "auth.createAccount" }));

    await waitFor(() => {
      expect(screen.getByText("Registration failed")).toBeInTheDocument();
    });
  });

  it("shows terms validation error if submit is triggered without acceptance", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText("auth.emailPlaceholder"),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText("auth.displayNamePlaceholder"),
      "test_user"
    );
    await user.type(
      screen.getByPlaceholderText("auth.passwordPlaceholder"),
      "secret123"
    );
    await user.type(
      screen.getByPlaceholderText("auth.confirmPasswordPlaceholder"),
      "secret123"
    );

    const form = screen.getByRole("button", { name: "auth.createAccount" }).closest("form");
    fireEvent.submit(form);

    expect(screen.getByText("auth.terms.validationError")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
