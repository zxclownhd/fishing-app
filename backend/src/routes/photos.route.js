// routes/photos.route.js
const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");

// DELETE /photos/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const photoId = String(req.params.id);

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      select: {
        id: true,
        publicId: true,
        locationId: true,
        location: { select: { ownerId: true } },
      },
    });

    if (!photo) return res.status(404).json({ error: "Photo not found" });

    const isAdmin = req.user.role === "ADMIN";
    const isOwner = photo.location?.ownerId === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 1) видаляємо з Cloudinary
    if (photo.publicId) {
      // result може бути: "ok", "not found", ...
      await cloudinary.uploader.destroy(photo.publicId);
    }

    // 2) видаляємо з БД
    await prisma.photo.delete({ where: { id: photoId } });

    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;