const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken } = require("../middleware/auth");
const bcrypt = require("bcrypt");

// GET /me -> повертає поточного юзера
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/", authenticateToken, async (req, res) => {
  try {
    const newDisplayedName = req.body.displayName;

    if (typeof newDisplayedName === "string") {
      let trimedName = newDisplayedName.trim();
      if (trimedName.length >= 2) {
        const user = await prisma.user.update({
          where: { id: req.user.id },
          data: { displayName: trimedName },
          select: {
            id: true,
            email: true,
            role: true,
            displayName: true,
            createdAt: true,
          },
        });

        return res.json({ user });
      } else {
        res.status(400).json({ error: "Bad request" });
      }
    } else {
      res.status(400).json({ error: "Bad request" });
    }
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/password", authenticateToken, async (req, res) => {
  try {
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password to short." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!ok) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const passwordUpdate = await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
