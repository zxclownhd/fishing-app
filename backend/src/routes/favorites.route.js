const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken, requireRole } = require("../middleware/auth");

const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/AppError");
const { ErrorCode } = require("../utils/errorCodes");

// POST /favorites/:locationId
router.post(
  "/:locationId",
  authenticateToken,
  requireRole("USER", "OWNER"),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const locationId = req.params.locationId;

    if (!locationId) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, "No location", { field: "locationId" });
    }

    const fav = await prisma.favorite.upsert({
      where: {
        userId_locationId: { userId, locationId },
      },
      create: { userId, locationId },
      update: {},
    });

    res.json({ fav });
  }),
);

// DELETE /favorites/:locationId
router.delete(
  "/:locationId",
  authenticateToken,
  requireRole("OWNER", "USER"),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const locationId = req.params.locationId;

    if (!locationId) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, "No location", { field: "locationId" });
    }

    const deleteResult = await prisma.favorite.deleteMany({
      where: { userId, locationId },
    });

    res.json({ removed: deleteResult.count > 0 });
  }),
);

// GET /favorites
router.get(
  "/",
  authenticateToken,
  requireRole("USER", "OWNER"),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitRaw = parseInt(req.query.limit, 10) || 12;
    const limit = Math.min(50, Math.max(1, limitRaw)); // 1..50
    const skip = (page - 1) * limit;

    const [total, favorites] = await Promise.all([
      prisma.favorite.count({
        where: { userId, location: { status: "APPROVED" } },
      }),
      prisma.favorite.findMany({
        where: { userId, location: { status: "APPROVED" } },
        include: {
          location: {
            include: {
              photos: {
                take: 1,
                orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      items: favorites.map((x) => x.location),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  }),
);

module.exports = router;
