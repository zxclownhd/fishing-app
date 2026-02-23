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

// GET /locations (guest search)
router.get("/", async (req, res) => {
  try {
    const {
      region,
      waterType,
      fish,
      season,
      page = "1",
      limit = "10",
    } = req.query;

    const regionCode = region ? String(region).trim().toUpperCase() : null;

    if (regionCode && !REGION_CODES.has(regionCode)) {
      return res.status(400).json({ error: "Invalid region" });
    }

    const take = Math.min(parseInt(limit, 10) || 10, 50);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {
      status: "APPROVED",
      ...(region ? { region: regionCode } : {}),
      ...(waterType ? { waterType: String(waterType) } : {}),
      ...(fish ? { fish: { some: { fish: { name: String(fish) } } } } : {}),
      ...(season
        ? { seasons: { some: { season: { code: String(season) } } } }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: { take: 1, orderBy: { createdAt: "desc" } },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.location.count({ where }),
    ]);

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
      page: Number(page),
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

    // normalize photo urls
    const urls = Array.isArray(photoUrls)
      ? photoUrls.map((u) => String(u).trim()).filter(Boolean)
      : [];

    // upsert fish
    const fishRows = await Promise.all(
      (Array.isArray(fishNames) ? fishNames : []).map((name) =>
        prisma.fish.upsert({
          where: { name: String(name) },
          update: {},
          create: { name: String(name) },
        }),
      ),
    );

    // seasons (only existing)
    const seasonRows = Array.isArray(seasonCodes) && seasonCodes.length
      ? await prisma.season.findMany({
          where: { code: { in: seasonCodes.map((c) => String(c)) } },
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
        photos: { create: urls.map((url) => ({ url })) },
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

      // опціонально: не дозволяти робити review на не-APPROVED локацію
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

      // create review (unique constraint handles duplicates)
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
      // Prisma unique constraint violation -> user already reviewed
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

    // avg rating
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

// GET /locations/:id/contact (auth) - contacts only for logged-in users
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
