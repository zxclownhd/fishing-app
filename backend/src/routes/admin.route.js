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
          photos: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { id: true, url: true },
          },
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

// NEW: PATCH /admin/locations/:id/status  body: { status: "APPROVED"|"REJECTED"|"HIDDEN" }
router.patch("/locations/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus = String(req.body?.status || "").toUpperCase();

    const allowed = ["APPROVED", "REJECTED", "HIDDEN"];
    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        error: "Invalid status",
        allowed,
      });
    }

    const updated = await prisma.location.update({
      where: { id },
      data: { status: nextStatus },
    });

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Keep old endpoints for compatibility (optional)
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

// DELETE only if HIDDEN
router.delete("/locations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const loc = await prisma.location.findUnique({
      where: { id },
      select: { id: true, status: true, title: true },
    });

    if (!loc) return res.status(404).json({ error: "Not found" });

    if (loc.status !== "HIDDEN") {
      return res.status(409).json({
        error: "Delete is allowed only for HIDDEN locations",
        status: loc.status,
      });
    }

    await prisma.location.delete({ where: { id } });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;