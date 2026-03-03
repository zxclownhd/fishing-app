const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");

// Everything in /owner is OWNER only
router.use(authenticateToken, requireRole("OWNER"));

function normalizePhotoInputs(photos, max = 5) {
  if (!Array.isArray(photos)) return [];

  const cleaned = photos
    .map((p) => ({
      url: p?.url ? String(p.url).trim() : "",
      publicId: p?.publicId ? String(p.publicId).trim() : "",
    }))
    .filter((p) => p.url && p.publicId);

  const uniqueByUrl = [];
  const seen = new Set();
  for (const p of cleaned) {
    if (seen.has(p.url)) continue;
    seen.add(p.url);
    uniqueByUrl.push(p);
  }

  return uniqueByUrl.slice(0, max);
}

// GET /owner/locations?page=1&limit=20
router.get(
  "/locations",
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(50, Math.max(1, limitRaw));
    const skip = (page - 1) * limit;

    const where = { ownerId: userId };

    const [total, items] = await Promise.all([
      prisma.location.count({ where }),
      prisma.location.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          owner: { select: { id: true, displayName: true, email: true } },
          photos: { select: { id: true, url: true, createdAt: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
        },
      }),
    ]);

    res.json({ items, total, page, limit });
  }),
);

// GET /owner/locations/:id
router.get(
  "/locations/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      include: {
        owner: { select: { id: true, displayName: true } },
        fish: { include: { fish: true } },
        seasons: { include: { season: true } },
        photos: { select: { id: true, url: true, createdAt: true } },
      },
    });

    if (!location) {
      throw new AppError(404, "NOT_FOUND", "Location not found");
    }

    res.json(location);
  }),
);

// PATCH /owner/locations/:id
// Rule: if it was APPROVED and owner changes content, set back to PENDING
router.patch(
  "/locations/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const {
      title,
      description,
      region,
      waterType,
      lat,
      lng,
      fishNames,
      seasonCodes,
      contactInfo,
      photos, // optional: [{ url, publicId }]
    } = req.body;

    const data = {};

    if (title !== undefined) data.title = String(title);
    if (description !== undefined) data.description = String(description);
    if (region !== undefined) data.region = String(region);
    if (waterType !== undefined) data.waterType = String(waterType);
    if (lat !== undefined) data.lat = String(lat);
    if (lng !== undefined) data.lng = String(lng);

    if ("contactInfo" in req.body) {
      data.contactInfo = contactInfo ? String(contactInfo).trim() : null;
    }

    const normalizedNewPhotos = Array.isArray(photos)
      ? normalizePhotoInputs(photos, 5)
      : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1) Update only if this location belongs to current owner
      // Also: if it was APPROVED, set it back to PENDING on any edit attempt
      // We'll do it by reading status inside tx to avoid race.
      const current = await tx.location.findFirst({
        where: { id, ownerId: req.user.id },
        select: { id: true, status: true },
      });

      if (!current) {
        throw new AppError(404, "NOT_FOUND", "Location not found");
      }

      const nextData =
        current.status === "APPROVED"
          ? { ...data, status: "PENDING" }
          : data;

      const upd = await tx.location.updateMany({
        where: { id, ownerId: req.user.id },
        data: nextData,
      });

      if (upd.count !== 1) {
        throw new AppError(404, "NOT_FOUND", "Location not found");
      }

      // 2) fishNames: full replace
      if (Array.isArray(fishNames)) {
        const fishList = fishNames.map((x) => String(x).trim()).filter(Boolean);

        const fishRows = fishList.length
          ? await tx.fish.findMany({
              where: { name: { in: fishList } },
              select: { id: true },
            })
          : [];

        await tx.locationFish.deleteMany({ where: { locationId: id } });

        if (fishRows.length) {
          await tx.locationFish.createMany({
            data: fishRows.map((f) => ({ locationId: id, fishId: f.id })),
            skipDuplicates: true,
          });
        }
      }

      // 3) seasonCodes: full replace
      if (Array.isArray(seasonCodes)) {
        const seasonRows = seasonCodes.length
          ? await tx.season.findMany({
              where: { code: { in: seasonCodes.map((c) => String(c)) } },
              select: { id: true },
            })
          : [];

        await tx.locationSeason.deleteMany({ where: { locationId: id } });

        if (seasonRows.length) {
          await tx.locationSeason.createMany({
            data: seasonRows.map((s) => ({ locationId: id, seasonId: s.id })),
            skipDuplicates: true,
          });
        }
      }

      // 4) photos: add only new, no delete
      if (normalizedNewPhotos) {
        const existingPhotos = await tx.photo.findMany({
          where: { locationId: id },
          select: { url: true },
        });

        const existingUrls = new Set(existingPhotos.map((p) => p.url));
        const currentCount = existingPhotos.length;

        const remainingSlots = Math.max(0, 5 - currentCount);
        if (remainingSlots > 0) {
          const toAdd = normalizedNewPhotos
            .filter((p) => !existingUrls.has(p.url))
            .slice(0, remainingSlots);

          if (toAdd.length) {
            await tx.photo.createMany({
              data: toAdd.map((p) => ({
                locationId: id,
                url: p.url,
                publicId: p.publicId,
              })),
            });
          }
        }
      }

      // 5) return updated location
      return tx.location.findFirst({
        where: { id, ownerId: req.user.id },
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: { select: { id: true, url: true, createdAt: true } },
        },
      });
    });

    res.json(result);
  }),
);

// POST /owner/locations/:id/hide -> set status HIDDEN
router.post(
  "/locations/:id/hide",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Location not found");
    }

    try {
      const updated = await prisma.location.update({
        where: { id },
        data: { status: "HIDDEN" },
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: { select: { id: true, url: true, createdAt: true } },
        },
      });

      res.json(updated);
    } catch (e) {
      if (e && e.code === "P2025") {
        throw new AppError(404, "NOT_FOUND", "Location not found");
      }
      throw e;
    }
  }),
);

// POST /owner/locations/:id/unhide -> set status PENDING
router.post(
  "/locations/:id/unhide",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError(404, "NOT_FOUND", "Location not found");
    }

    try {
      const updated = await prisma.location.update({
        where: { id },
        data: { status: "PENDING" },
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: { select: { id: true, url: true, createdAt: true } },
        },
      });

      res.json(updated);
    } catch (e) {
      if (e && e.code === "P2025") {
        throw new AppError(404, "NOT_FOUND", "Location not found");
      }
      throw e;
    }
  }),
);

module.exports = router;