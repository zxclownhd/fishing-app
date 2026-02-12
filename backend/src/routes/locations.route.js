const router = require("express").Router();
const prisma = require("../prisma/client");

// GET /locations  -> guest бачить тільки APPROVED
router.get("/", async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { status: "APPROVED" },
      include: {
        owner: { select: { id: true, displayName: true } },
        photos: true,
        fish: { include: { fish: true } },
        seasons: { include: { season: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ items: locations, total: locations.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load locations" });
  }
});

module.exports = router;