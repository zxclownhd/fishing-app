import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminDashboardPage from "./AdminDashboardPage";
import { http } from "../api/http";
import { getStoredUser } from "../auth/auth";

vi.mock("../api/http", () => ({
  http: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../auth/auth", () => ({
  getStoredUser: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: ({ to }) => <div>Navigate:{to}</div>,
    Link: ({ to, children, ...rest }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
  };
});

vi.mock("../client/i18n/I18nContext", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key, fallback) => fallback || key,
  }),
}));

vi.mock("../client/i18n/displayName", () => ({
  displayFishName: (name) => name,
}));

vi.mock("../utils/cloudinaryUrl", () => ({
  getCloudinaryVariant: (url) => `mocked-${url}`,
}));

vi.mock("../components/LocationCard", () => ({
  default: ({ loc, actions, footer }) => (
    <div data-testid="admin-location-card">
      <div>{loc.title}</div>
      <div>{loc.status}</div>
      <div>{footer}</div>
      <div>{actions}</div>
    </div>
  ),
}));

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders for admin and loads locations", async () => {
    getStoredUser.mockReturnValue({
      id: "a1",
      role: "ADMIN",
      displayName: "Admin",
    });

    http.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: "loc1",
            title: "Blue Lake",
            status: "PENDING",
            fish: [{ fishId: "f1", fish: { name: "Pike" } }],
            seasons: [{ seasonId: "s1", season: { code: "SPRING" } }],
            photos: [],
          },
          {
            id: "loc2",
            title: "River Spot",
            status: "PENDING",
            fish: [],
            seasons: [],
            photos: [],
          },
        ],
        total: 2,
      },
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith("/admin/locations", {
        params: { status: "PENDING", page: 1, limit: 6 },
      });
    });

    expect(screen.getByText("admin.title")).toBeInTheDocument();
    expect(screen.getByText("Blue Lake")).toBeInTheDocument();
    expect(screen.getByText("River Spot")).toBeInTheDocument();
    expect(screen.getAllByTestId("admin-location-card")).toHaveLength(2);
  });

  it("shows moderation actions for admin", async () => {
    getStoredUser.mockReturnValue({
      id: "a1",
      role: "ADMIN",
      displayName: "Admin",
    });

    http.get.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: "loc1",
            title: "Blue Lake",
            status: "PENDING",
            fish: [{ fishId: "f1", fish: { name: "Pike" } }],
            seasons: [{ seasonId: "s1", season: { code: "SPRING" } }],
            photos: [],
          },
        ],
        total: 1,
      },
    });

    render(<AdminDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Lake")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "admin.actions.details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "admin.actions.approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "admin.actions.reject" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "admin.actions.hide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "admin.actions.delete" })).toBeInTheDocument();
  });

  it("redirects guest to login", () => {
    getStoredUser.mockReturnValue(null);

    render(<AdminDashboardPage />);

    expect(screen.getByText("Navigate:/login")).toBeInTheDocument();
  });

  it("redirects non-admin user to home", () => {
    getStoredUser.mockReturnValue({
      id: "u1",
      role: "USER",
      displayName: "Regular User",
    });

    render(<AdminDashboardPage />);

    expect(screen.getByText("Navigate:/")).toBeInTheDocument();
  });
});
