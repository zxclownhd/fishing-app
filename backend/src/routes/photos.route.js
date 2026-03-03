// routes/photos.route.js
const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken } = require("../middleware/auth");
const cloudinary = require("../utils/cloudinary");

// POST /photos/cleanup
// body: { publicIds: string[] }
router.post("/cleanup", authenticateToken, async (req, res) => {
  try {
    const publicIds = Array.isArray(req.body?.publicIds) ? req.body.publicIds : [];

    const cleaned = publicIds
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    if (!cleaned.length) return res.json({ deleted: 0 });

    // safety limits
    if (cleaned.length > 20) {
      return res.status(400).json({ error: "Too many publicIds (max 20)" });
    }

    const prefix = `drafts/${req.user.id}/`;

    // allow only own draft folder
    const allowed = cleaned.filter((id) => id.startsWith(prefix));

    if (!allowed.length) return res.json({ deleted: 0 });

    // delete in Cloudinary (batch)
    // cloudinary.api.delete_resources works better for batch deletes
    const result = await cloudinary.api.delete_resources(allowed, {
      resource_type: "image",
      type: "upload",
    });

    // result.deleted is an object: { publicId: "deleted" | "not_found" | ... }
    const deletedCount = result?.deleted
      ? Object.values(result.deleted).filter((v) => v === "deleted").length
      : 0;

    return res.json({ deleted: deletedCount });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

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