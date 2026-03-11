import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HomePage from "./HomePage";
import { http } from "../api/http";

vi.mock("../api/http", () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock("../client/hooks/useFavorites", () => ({
  useFavorites: () => ({
    canUseFavorites: false,
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

vi.mock("../client/i18n/I18nContext", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key, fallback) => fallback || key,
  }),
}));

vi.mock("../client/i18n/displayName", () => ({
  displayFishName: (name) => name,
}));

vi.mock("../components/LocationCard", () => ({
  default: ({ loc }) => <div data-testid="location-card">{loc.title}</div>,
}));

vi.mock("../components/pickers/RegionPicker", () => ({
  default: ({ value, onChange }) => (
    <input
      data-testid="region-picker"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("../components/pickers/FishPicker", () => ({
  default: () => <div data-testid="fish-picker">FishPicker</div>,
}));

vi.mock("../components/pickers/SeasonPicker", () => ({
  default: () => <div data-testid="season-picker">SeasonPicker</div>,
}));

vi.mock("../components/pickers/SortPicker", () => ({
  default: ({ value, onChange }) => (
    <select
      data-testid="sort-picker"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="createdAt:desc">Newest</option>
      <option value="createdAt:asc">Oldest</option>
      <option value="avgRating:desc">Top rated</option>
    </select>
  ),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders and loads locations", async () => {
    http.get.mockResolvedValueOnce({
      data: {
        items: [
          { id: "1", title: "Blue Lake" },
          { id: "2", title: "River Spot" },
        ],
        total: 2,
      },
    });

    render(<HomePage />);

    expect(screen.getByText("home.title")).toBeInTheDocument();

    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith("/locations", {
        params: {
          page: 1,
          limit: 6,
          sort: "createdAt",
          order: "desc",
        },
      });
    });

    expect(screen.getByText("Blue Lake")).toBeInTheDocument();
    expect(screen.getByText("River Spot")).toBeInTheDocument();
  });

  it("shows loading state", async () => {
    let resolveRequest;

    http.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(<HomePage />);

    expect(screen.getByText("common.loading")).toBeInTheDocument();

    resolveRequest({
      data: {
        items: [{ id: "1", title: "Blue Lake" }],
        total: 1,
      },
    });

    await waitFor(() => {
      expect(screen.getByText("Blue Lake")).toBeInTheDocument();
    });
  });

  it("shows error when request fails", async () => {
    http.get.mockRejectedValueOnce(new Error("Network error"));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("changes sorting and reloads data", async () => {
    http.get
      .mockResolvedValueOnce({
        data: {
          items: [{ id: "1", title: "Blue Lake" }],
          total: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [{ id: "2", title: "Top Lake" }],
          total: 1,
        },
      });

    render(<HomePage />);

    await waitFor(() => {
      expect(http.get).toHaveBeenNthCalledWith(1, "/locations", {
        params: {
          page: 1,
          limit: 6,
          sort: "createdAt",
          order: "desc",
        },
      });
    });

    fireEvent.change(screen.getByTestId("sort-picker"), {
      target: { value: "avgRating:desc" },
    });

    await waitFor(() => {
      expect(http.get).toHaveBeenNthCalledWith(2, "/locations", {
        params: {
          page: 1,
          limit: 6,
          sort: "avgRating",
          order: "desc",
        },
      });
    });
  });
});
