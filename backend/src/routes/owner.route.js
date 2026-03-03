const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Все в /owner тільки для OWNER
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
router.get("/locations", async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /owner/locations/:id -> деталі, але тільки свої
router.get("/locations/:id", async (req, res) => {
  try {
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

    if (!location) return res.status(404).json({ error: "Not found" });

    res.json(location);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /owner/locations/:id
// Правило: якщо було APPROVED і owner міняє контент, повертаємо в PENDING
router.patch("/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true, status: true },
    });

    if (!existing) return res.status(404).json({ error: "Not found" });

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
      photos, // optional: [{ url, publicId }] додаємо тільки нові
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

    if (existing.status === "APPROVED") {
      data.status = "PENDING";
    }

    const normalizedNewPhotos = Array.isArray(photos) ? normalizePhotoInputs(photos, 5) : null;

    const result = await prisma.$transaction(async (tx) => {
      await tx.location.update({
        where: { id },
        data,
      });

      // fishNames: повна заміна
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

      // seasonCodes: повна заміна
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

      // photos: додаємо тільки нові, не видаляємо нічого
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

      return tx.location.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: { select: { id: true, url: true, createdAt: true } },
        },
      });
    });

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /owner/locations/:id/hide -> set status HIDDEN
router.post("/locations/:id/hide", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

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
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /owner/locations/:id/unhide -> set status PENDING
router.post("/locations/:id/unhide", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Not found" });

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
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;