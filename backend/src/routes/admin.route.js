const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { ErrorCode } = require("../utils/errorCodes");

// All /admin routes require JWT + ADMIN role
router.use(authenticateToken, requireRole("ADMIN"));

// GET /admin/locations?status=PENDING
router.get(
  "/locations",
  asyncHandler(async (req, res) => {
    const { status, page = "1", limit = "20" } = req.query;

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (pageNum - 1) * take;

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

    res.json({ items, total, page: pageNum, limit: take });
  }),
);

// PATCH /admin/locations/:id/status  body: { status: "APPROVED"|"REJECTED"|"HIDDEN" }
router.patch(
  "/locations/:id/status",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const nextStatus = String(req.body?.status || "").toUpperCase();

    const allowed = ["APPROVED", "REJECTED", "HIDDEN"];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, "Invalid status", {
        allowed,
      });
    }

    try {
      const updated = await prisma.location.update({
        where: { id },
        data: { status: nextStatus },
      });

      res.json(updated);
    } catch (e) {
      if (e && e.code === "P2025") {
        throw new AppError(404, ErrorCode.NOT_FOUND, "Location not found");
      }
      throw e;
    }
  }),
);

// Keep old endpoints for compatibility (optional)
router.patch(
  "/locations/:id/approve",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const updated = await prisma.location.update({
        where: { id },
        data: { status: "APPROVED" },
      });
      res.json(updated);
    } catch (e) {
      if (e && e.code === "P2025") {
        throw new AppError(404, ErrorCode.NOT_FOUND, "Location not found");
      }
      throw e;
    }
  }),
);

router.patch(
  "/locations/:id/reject",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const updated = await prisma.location.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      res.json(updated);
    } catch (e) {
      if (e && e.code === "P2025") {
        throw new AppError(404, ErrorCode.NOT_FOUND, "Location not found");
      }
      throw e;
    }
  }),
);

router.patch(
  "/locations/:id/hide",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const updated = await prisma.location.update({
        where: { id },
        data: { status: "HIDDEN" },
      });
      res.json(updated);
    } catch (e) {
      if (e && e.code === "P2025") {
        throw new AppError(404, ErrorCode.NOT_FOUND, "Location not found");
      }
      throw e;
    }
  }),
);

router.get(
  "/locations/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await prisma.location.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        photos: {
          orderBy: { createdAt: "desc" },
          select: { id: true, url: true, createdAt: true },
        },
        fish: { include: { fish: true } },
        seasons: { include: { season: true } },
      },
    });

    if (!item) {
      throw new AppError(404, ErrorCode.NOT_FOUND, "Location not found");
    }

    res.json({ item });
  }),
);

// DELETE only if HIDDEN
router.delete(
  "/locations/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const loc = await prisma.location.findUnique({
      where: { id },
      select: { id: true, status: true, title: true },
    });

    if (!loc) {
      throw new AppError(404, ErrorCode.NOT_FOUND, "Location not found");
    }

    if (loc.status !== "HIDDEN") {
      throw new AppError(409, ErrorCode.CONFLICT, "Delete is allowed only for HIDDEN locations", {
        status: loc.status,
      });
    }

    await prisma.location.delete({ where: { id } });

    res.json({ ok: true });
  }),
);

module.exports = router;