const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

//POST /favorites/:locationId
router.post(
  "/:locationId",
  authenticateToken,
  requireRole("USER", "OWNER"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.locationId;

      if (!locationId) {
        res.status(400).json({ error: "No location" });
        return;
      }

      const addFavourite = await prisma.favorite.upsert({
        where: {
          userId_locationId: { userId, locationId },
        },
        create: { userId, locationId },
        update: {},
      });

      return res.json({ fav: addFavourite });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  },
);

//DELETE /favorites/:locationId
router.delete(
  "/:locationId",
  authenticateToken,
  requireRole("OWNER", "USER"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const locationId = req.params.locationId;

      if (!locationId) {
        res.status(400).json({ error: "No location" });
        return;
      }

      const deleteResult = await prisma.favorite.deleteMany({
        where: { userId, locationId },
      });

      return res.json({ removed: deleteResult.count > 0 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  },
);

//GET /favorites
router.get(
  "/",
  authenticateToken,
  requireRole("USER", "OWNER"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limitRaw = parseInt(req.query.limit, 10) || 12;
      const limit = Math.min(50, Math.max(1, limitRaw)); // 1..50
      const skip = (page - 1) * limit;

      const [total, favorites] = await Promise.all([
        prisma.favorite.count({ where: { userId } }),
        prisma.favorite.findMany({
          where: { userId },
          include: { location: true },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
      ]);

      return res.json({
        items: favorites.map((x) => x.location),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
