import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OwnerDashboardPage from "./OwnerDashboardPage";
import { http } from "../api/http";
import { getStoredUser } from "../auth/auth";

vi.mock("../api/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../auth/auth", () => ({
  getStoredUser: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ to, children }) => <a href={to}>{children}</a>,
  };
});

vi.mock("../client/i18n/I18nContext", () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

vi.mock("../components/owner/CreateLocationForm", () => ({
  default: ({ onCancel }) => (
    <div>
      <div>CreateLocationForm</div>
      <button onClick={onCancel}>Cancel create</button>
    </div>
  ),
}));

vi.mock("../components/owner/MyLocationsList", () => ({
  default: ({
    items,
    loading,
    page,
    total,
    totalPages,
    onStartEdit,
    onToggleHidden,
  }) => (
    <div>
      <div>MyLocationsList</div>
      <div data-testid="list-loading">{String(loading)}</div>
      <div data-testid="page-info">
        {page} / {totalPages} / {total}
      </div>

      {items.map((item) => (
        <div key={item.id} data-testid="owner-location-item">
          <span>{item.title}</span>
          <button onClick={() => onStartEdit(item)}>Edit</button>
          <button onClick={() => onToggleHidden(item)}>
            {item.status === "HIDDEN" ? "Unhide" : "Hide"}
          </button>
        </div>
      ))}
    </div>
  ),
}));

describe("OwnerDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner to access page and shows locations list", async () => {
    getStoredUser.mockReturnValue({
      id: "u1",
      role: "OWNER",
      displayName: "Owner User",
    });

    http.get.mockResolvedValueOnce({
      data: {
        items: [
          { id: "loc1", title: "Blue Lake", status: "PUBLISHED" },
          { id: "loc2", title: "River Spot", status: "HIDDEN" },
        ],
        total: 2,
      },
    });

    render(<OwnerDashboardPage />);

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith("/owner/locations", {
        params: { page: 1, limit: 12 },
      });
    });

    expect(screen.getByText("owner.title")).toBeInTheDocument();
    expect(screen.getByText("MyLocationsList")).toBeInTheDocument();

    expect(screen.getByText("Blue Lake")).toBeInTheDocument();
    expect(screen.getByText("River Spot")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "owner.tabs.list" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "owner.tabs.create" }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("button", { name: "Edit" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Hide|Unhide/ }).length,
    ).toBeGreaterThan(0);
  });

  it("blocks guest user", () => {
    getStoredUser.mockReturnValue(null);

    render(<OwnerDashboardPage />);

    expect(screen.getByText("owner.authRequired")).toBeInTheDocument();
  });

  it("blocks non-owner user", () => {
    getStoredUser.mockReturnValue({
      id: "u2",
      role: "USER",
      displayName: "Regular User",
    });

    render(<OwnerDashboardPage />);

    expect(screen.getByText("owner.ownerOnly")).toBeInTheDocument();
  });

  it("opens create tab and shows create form", async () => {
    const user = userEvent.setup();

    getStoredUser.mockReturnValue({
      id: "u1",
      role: "OWNER",
      displayName: "Owner User",
    });

    http.get.mockResolvedValueOnce({
      data: {
        items: [{ id: "loc1", title: "Blue Lake", status: "PUBLISHED" }],
        total: 1,
      },
    });

    render(<OwnerDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("MyLocationsList")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "owner.tabs.create" }));

    expect(screen.getByText("CreateLocationForm")).toBeInTheDocument();
  });
});
