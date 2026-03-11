import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import LocationDetailsPage from "./LocationDetailsPage";
import { http } from "../api/http";

vi.mock("../api/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ to, children }) => <a href={to}>{children}</a>,
    useParams: () => ({ id: "loc-1" }),
  };
});

vi.mock("../auth/auth", () => ({
  getStoredUser: () => null,
}));

vi.mock("../client/hooks/useFavorites", () => ({
  useFavorites: () => ({
    canUseFavorites: false,
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
  }),
}));

vi.mock("../utils/cloudinaryUrl", () => ({
  getCloudinaryVariant: (url) => `mocked-${url}`,
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

describe("LocationDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders location details, hero info and reviews", async () => {
    http.get
      .mockResolvedValueOnce({
        data: {
          id: "loc-1",
          title: "Blue Lake",
          region: "KYIV",
          waterType: "LAKE",
          description: "Great place for fishing",
          avgRating: 4.7,
          reviewsCount: 2,
          owner: { displayName: "Andrii" },
          lat: "50.45",
          lng: "30.52",
          photos: [
            { id: "p1", url: "photo-1.jpg" },
          ],
          fish: [
            { fishId: "f1", fish: { name: "Pike" } },
            { fishId: "f2", fish: { name: "Carp" } },
          ],
          seasons: [
            { seasonId: "s1", season: { code: "SPRING" } },
            { seasonId: "s2", season: { code: "SUMMER" } },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            {
              id: "r1",
              rating: 5,
              comment: "Amazing spot",
              createdAt: "2026-03-10T10:00:00.000Z",
              user: { displayName: "Nina" },
            },
          ],
        },
      });

    const { container } = render(<LocationDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Blue Lake")).toBeInTheDocument();
    });

    expect(http.get).toHaveBeenNthCalledWith(1, "/locations/loc-1");
    expect(http.get).toHaveBeenNthCalledWith(2, "/locations/loc-1/reviews");

    expect(screen.getByText("Great place for fishing")).toBeInTheDocument();
    expect(screen.getByText(/Andrii/)).toBeInTheDocument();
    expect(screen.getAllByText(/4.7/).length).toBeGreaterThan(0);

    expect(screen.getByText("Amazing spot")).toBeInTheDocument();
    expect(screen.getByText(/Nina/)).toBeInTheDocument();

    expect(screen.getByText("locationDetails.contactsLoginHint")).toBeInTheDocument();
    expect(screen.getByText("locationDetails.openGoogleMaps")).toBeInTheDocument();

    const img = container.querySelector('img[src="mocked-photo-1.jpg"]');
    expect(img).toBeInTheDocument();
  });

  it("shows loading state", () => {
    http.get.mockImplementation(() => new Promise(() => {}));

    render(<LocationDetailsPage />);

    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("shows error when request fails", async () => {
    http.get.mockRejectedValueOnce(new Error("Network error"));

    render(<LocationDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
