const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

// Все в /owner тільки для OWNER
router.use(authenticateToken, requireRole("OWNER"));

// GET /owner/locations?status=PENDING&page=1&limit=20
router.get("/locations", async (req, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {
      ownerId: req.user.id,
      ...(status ? { status: String(status) } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.location.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), limit: take });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// (опц) GET /owner/locations/:id -> деталі, але тільки свої
router.get("/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      include: {
        owner: { select: { id: true, displayName: true } },
        fish: { include: { fish: true } },
        seasons: { include: { season: true } },
        photos: true,
      },
    });

    if (!location) return res.status(404).json({ error: "Not found" });

    res.json(location);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /owner/locations/:id  (update only own location)
// Business rule: if location was APPROVED and owner changes content -> set back to PENDING
router.patch("/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1) знайти локацію тільки якщо вона належить owner
    const existing = await prisma.location.findFirst({
      where: { id, ownerId: req.user.id },
      select: { id: true, status: true },
    });

    if (!existing) return res.status(404).json({ error: "Not found" });

    // 2) дозволені поля для оновлення
    const {
      title,
      description,
      region,
      waterType,
      lat,
      lng,
      fishNames, // optional array
      seasonCodes, // optional array
      contactInfo,
      photoUrls,
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

    // 3) якщо редагуємо APPROVED — повертаємо в PENDING (реалістична модерація)
    // (якщо не хочеш — скажеш, і ми це вимкнемо)
    if (existing.status === "APPROVED") {
      data.status = "PENDING";
    }

    // 4) оновлення зв’язків fish/seasons (якщо передали масиви)
    // робимо транзакцією, щоб не лишити БД "напів-оновленою"
    const result = await prisma.$transaction(async (tx) => {
      // update base fields
      await tx.location.update({
        where: { id },
        data,
      });

      // photos: повна заміна (якщо передали масив)
      if (Array.isArray(photoUrls)) {
        const urls = photoUrls.map((u) => String(u).trim()).filter(Boolean);

        await tx.photo.deleteMany({ where: { locationId: id } });

        if (urls.length) {
          await tx.photo.createMany({
            data: urls.map((url) => ({ locationId: id, url })),
          });
        }
      }

      // fishNames: повна заміна
      if (Array.isArray(fishNames)) {
        // upsert fish
        const fishRows = await Promise.all(
          fishNames.map((name) =>
            tx.fish.upsert({
              where: { name: String(name) },
              update: {},
              create: { name: String(name) },
            }),
          ),
        );

        // clear old
        await tx.locationFish.deleteMany({ where: { locationId: id } });

        // create new
        if (fishRows.length) {
          await tx.locationFish.createMany({
            data: fishRows.map((f) => ({ locationId: id, fishId: f.id })),
            skipDuplicates: true,
          });
        }
      }

      // seasonCodes: повна заміна (тільки існуючі seasons)
      if (Array.isArray(seasonCodes)) {
        const seasonRows = seasonCodes.length
          ? await tx.season.findMany({
              where: { code: { in: seasonCodes.map((c) => String(c)) } },
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

      // return updated location
      return tx.location.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, displayName: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
          photos: true,
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
        photos: true,
      },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /owner/locations/:id/unhide -> set status PENDING (send for review)
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
        photos: true,
      },
    });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
