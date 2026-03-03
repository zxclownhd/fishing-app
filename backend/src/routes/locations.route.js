const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

const REGION_CODES = new Set([
  "VINNYTSIA",
  "VOLYN",
  "DNIPROPETROVSK",
  "DONETSK",
  "ZHYTOMYR",
  "ZAKARPATTIA",
  "ZAPORIZHZHIA",
  "IVANO_FRANKIVSK",
  "KYIV",
  "KIROVOHRAD",
  "LUHANSK",
  "LVIV",
  "MYKOLAIV",
  "ODESA",
  "POLTAVA",
  "RIVNE",
  "SUMY",
  "TERNOPIL",
  "KHARKIV",
  "KHERSON",
  "KHMELNYTSKYI",
  "CHERKASY",
  "CHERNIVTSI",
  "CHERNIHIV",
  "CRIMEA",
]);

function normalizePhotoUrls(photoUrls, max = 5) {
  if (!Array.isArray(photoUrls)) return [];
  const cleaned = photoUrls.map((u) => String(u).trim()).filter(Boolean);
  const unique = [...new Set(cleaned)];
  return unique.slice(0, max);
}

function normalizePhotos(photos, max = 5) {
  if (!Array.isArray(photos)) return [];

  const cleaned = photos
    .map((p) => ({
      url: p?.url ? String(p.url).trim() : "",
      publicId: p?.publicId ? String(p.publicId).trim() : "",
    }))
    .filter((p) => p.url && p.publicId);

  const out = [];
  const seen = new Set();
  for (const p of cleaned) {
    if (seen.has(p.url)) continue;
    seen.add(p.url);
    out.push(p);
  }

  return out.slice(0, max);
}

// GET /locations (guest search)
router.get("/", async (req, res) => {
  try {
    const {
      region,
      waterType,
      fish,
      season,
      seasons,
      page = "1",
      limit = "10",

      // NEW for dropdown
      sort = "createdAt", // createdAt | updatedAt | rating
      order = "desc",     // asc | desc
    } = req.query;

    const regionCode = region ? String(region).trim().toUpperCase() : null;

    if (regionCode && !REGION_CODES.has(regionCode)) {
      return res.status(400).json({ error: "Invalid region" });
    }

    const fishList = fish
      ? String(fish)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const seasonsList = seasons
      ? String(seasons)
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : season
        ? [String(season).trim().toUpperCase()]
        : [];

    const take = Math.min(parseInt(limit, 10) || 10, 50);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * take;

    const where = {
      status: "APPROVED",
      ...(regionCode ? { region: regionCode } : {}),
      ...(waterType ? { waterType: String(waterType) } : {}),
      ...(fishList.length
        ? { fish: { some: { fish: { name: { in: fishList } } } } }
        : {}),
      ...(seasonsList.length
        ? { seasons: { some: { season: { code: { in: seasonsList } } } } }
        : {}),
    };

    const sortKey = String(sort).toLowerCase();
    const sortOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";

    const total = await prisma.location.count({ where });

    // SORT BY RATING (avg review rating across all matching locations)
    if (sortKey === "rating") {
      // 1) take all matching ids (filters apply)
      const allIdsRows = await prisma.location.findMany({
        where,
        select: { id: true },
      });
      const allIds = allIdsRows.map((x) => x.id);

      if (!allIds.length) {
        return res.json({ items: [], total: 0, page: pageNum, limit: take });
      }

      // 2) group by reviews and order by avg rating
      const ratedAgg = await prisma.review.groupBy({
        by: ["locationId"],
        where: { locationId: { in: allIds } },
        _avg: { rating: true },
        orderBy: { _avg: { rating: sortOrder } },
      });

      const ratedIdsOrdered = ratedAgg.map((x) => x.locationId);

      // 3) push locations without reviews to the end (stable fallback)
      const unratedRows = await prisma.location.findMany({
        where: { ...where, id: { notIn: ratedIdsOrdered } },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      const orderedIds = [...ratedIdsOrdered, ...unratedRows.map((x) => x.id)];

      // 4) pagination on ordered ids
      const pageIds = orderedIds.slice(skip, skip + take);

      // 5) load entities, then restore ordering
      const itemsRaw = await prisma.location.findMany({
        where: { id: { in: pageIds } },
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: { take: 1, orderBy: { createdAt: "desc" } },
          _count: { select: { reviews: true } },
        },
      });

      const byId = new Map(itemsRaw.map((x) => [x.id, x]));
      const itemsOrdered = pageIds.map((id) => byId.get(id)).filter(Boolean);

      // 6) avg rating map (for this response)
      const ratingMap = new Map(
        ratedAgg.map((r) => [
          r.locationId,
          r._avg.rating ? Number(r._avg.rating.toFixed(2)) : null,
        ]),
      );

      const itemsWithRating = itemsOrdered.map((loc) => {
        const reviewsCount = loc._count?.reviews ?? 0;
        const avgRating = ratingMap.get(loc.id) ?? null;
        const { _count, ...rest } = loc;
        return { ...rest, reviewsCount, avgRating };
      });

      return res.json({
        items: itemsWithRating,
        total,
        page: pageNum,
        limit: take,
      });
    }

    // SORT BY DATE FIELDS (createdAt or updatedAt)
    const orderField = sortKey === "updatedat" ? "updatedAt" : "createdAt";

    const items = await prisma.location.findMany({
      where,
      include: {
        owner: { select: { id: true, displayName: true } },
        fish: { include: { fish: true } },
        seasons: { include: { season: true } },
        photos: { take: 1, orderBy: { createdAt: "desc" } },
        _count: { select: { reviews: true } },
      },
      orderBy: { [orderField]: sortOrder },
      skip,
      take,
    });

    const locationIds = items.map((x) => x.id);

    const ratingAgg = locationIds.length
      ? await prisma.review.groupBy({
          by: ["locationId"],
          where: { locationId: { in: locationIds } },
          _avg: { rating: true },
        })
      : [];

    const ratingMap = new Map(
      ratingAgg.map((r) => [
        r.locationId,
        r._avg.rating ? Number(r._avg.rating.toFixed(2)) : null,
      ]),
    );

    const itemsWithRating = items.map((loc) => {
      const reviewsCount = loc._count?.reviews ?? 0;
      const avgRating = ratingMap.get(loc.id) ?? null;
      const { _count, ...rest } = loc;
      return { ...rest, reviewsCount, avgRating };
    });

    res.json({
      items: itemsWithRating,
      total,
      page: pageNum,
      limit: take,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /locations (owner creates) - JWT required
router.post("/", authenticateToken, requireRole("OWNER"), async (req, res) => {
  try {
    const ownerId = req.user.id;

    const {
      title,
      description,
      region,
      waterType,
      lat,
      lng,
      fishNames = [],
      seasonCodes = [],
      contactInfo,

      // NEW preferred:
      photos = null,

      // OLD fallback:
      photoUrls = [],
    } = req.body;

    // required fields
    if (!title || !description || !region || !waterType) {
      return res.status(400).json({
        error:
          "Missing required fields: title, description, region, waterType, lat, lng",
      });
    }

    if (String(lat).trim() === "" || String(lng).trim() === "") {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    // normalize + validate region
    const regionCode = String(region).trim().toUpperCase();
    if (!REGION_CODES.has(regionCode)) {
      return res.status(400).json({ error: "Invalid region" });
    }

    // validate contactInfo
    const contact = contactInfo ? String(contactInfo).trim() : null;
    if (contact && contact.length > 255) {
      return res
        .status(400)
        .json({ error: "contactInfo is too long (max 255 chars)" });
    }

    // validate coords
    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return res
        .status(400)
        .json({ error: "lat and lng must be valid numbers" });
    }
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({ error: "lat/lng out of range" });
    }

    // Photos: NEW format first
    const normalizedPhotos = Array.isArray(photos) ? normalizePhotos(photos, 5) : [];

    // Backward compatibility:
    // If client still sends photoUrls only, we cannot create Photo without publicId
    // (assuming Prisma Photo.publicId is required)
    if (!normalizedPhotos.length) {
      const urls = normalizePhotoUrls(photoUrls, 5);
      if (urls.length) {
        return res.status(400).json({
          error:
            "Photos must include publicId now. Send `photos: [{ url, publicId }]` instead of `photoUrls`.",
        });
      }
    }

    if (normalizedPhotos.length < 1) {
      return res.status(400).json({ error: "At least 1 photo is required" });
    }

    // fish: link only existing (no upsert)
    const fishList = (Array.isArray(fishNames) ? fishNames : [])
      .map((x) => String(x).trim())
      .filter(Boolean);

    const fishRows = fishList.length
      ? await prisma.fish.findMany({
          where: { name: { in: fishList } },
          select: { id: true },
        })
      : [];

    // seasons (only existing)
    const seasonRows =
      Array.isArray(seasonCodes) && seasonCodes.length
        ? await prisma.season.findMany({
            where: { code: { in: seasonCodes.map((c) => String(c)) } },
            select: { id: true },
          })
        : [];

    const location = await prisma.location.create({
      data: {
        ownerId,
        title: String(title).trim(),
        description: String(description).trim(),
        region: regionCode,
        waterType: String(waterType),
        lat: String(latNum),
        lng: String(lngNum),
        status: "PENDING",
        contactInfo: contact,
        fish: { create: fishRows.map((f) => ({ fishId: f.id })) },
        seasons: { create: seasonRows.map((s) => ({ seasonId: s.id })) },

        // NEW: store url + publicId
        photos: {
          create: normalizedPhotos.map((p) => ({
            url: p.url,
            publicId: p.publicId,
          })),
        },
      },
      include: {
        owner: { select: { id: true, displayName: true } },
        fish: { include: { fish: true } },
        seasons: { include: { season: true } },
        photos: true,
      },
    });

    res.status(201).json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /fish
router.get("/fish", async (req, res) => {
  try {
    const items = await prisma.fish.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    res.json({ items });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /locations/:id/reviews (public)
router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await prisma.review.findMany({
      where: { locationId: id },
      include: {
        user: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ items: reviews, total: reviews.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /locations/:id/reviews (auth) - one review per user per location
router.post(
  "/:id/reviews",
  authenticateToken,
  requireRole("USER", "OWNER"),
  async (req, res) => {
    try {
      const { id: locationId } = req.params;
      const { rating, comment } = req.body;

      const r = Number(rating);

      if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res
          .status(400)
          .json({ error: "rating must be an integer from 1 to 5" });
      }
      if (!comment || String(comment).trim().length < 3) {
        return res
          .status(400)
          .json({ error: "comment is required (min 3 chars)" });
      }

      const loc = await prisma.location.findUnique({
        where: { id: locationId },
        select: { status: true },
      });
      if (!loc) return res.status(404).json({ error: "Location not found" });
      if (loc.status !== "APPROVED") {
        return res
          .status(403)
          .json({ error: "You can review only APPROVED locations" });
      }

      const created = await prisma.review.create({
        data: {
          locationId,
          userId: req.user.id,
          rating: r,
          comment: String(comment).trim(),
        },
        include: {
          user: { select: { id: true, displayName: true } },
        },
      });

      res.status(201).json(created);
    } catch (e) {
      if (e && e.code === "P2002") {
        return res
          .status(409)
          .json({ error: "You already reviewed this location" });
      }
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET /locations/:id (public details) - only APPROVED
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, status: "APPROVED" },
      include: {
        owner: { select: { id: true, displayName: true } },
        fish: { include: { fish: true } },
        seasons: { include: { season: true } },
        photos: true,
        _count: { select: { reviews: true } },
      },
    });

    if (!location) return res.status(404).json({ error: "Location not found" });

    const agg = await prisma.review.aggregate({
      where: { locationId: id },
      _avg: { rating: true },
    });

    const avgRating = agg._avg.rating
      ? Number(agg._avg.rating.toFixed(2))
      : null;

    const { _count, ...rest } = location;

    res.json({
      ...rest,
      reviewsCount: _count.reviews,
      avgRating,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /locations/:id/contact (auth)
router.get("/:id/contact", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const loc = await prisma.location.findFirst({
      where: { id, status: "APPROVED" },
      select: { id: true, contactInfo: true },
    });

    if (!loc) return res.status(404).json({ error: "Location not found" });

    res.json({ contactInfo: loc.contactInfo });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;