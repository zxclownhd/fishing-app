const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

// All /admin routes require JWT + ADMIN role
router.use(authenticateToken, requireRole("ADMIN"));

// GET /admin/locations?status=PENDING
router.get("/locations", async (req, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {
      ...(status ? { status: String(status) } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          owner: { select: { id: true, displayName: true, email: true } },
          fish: { include: { fish: true } },
          seasons: { include: { season: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.location.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), limit: take });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/locations/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.location.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/locations/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.location.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/locations/:id/hide", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.location.update({
      where: { id },
      data: { status: "HIDDEN" },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;