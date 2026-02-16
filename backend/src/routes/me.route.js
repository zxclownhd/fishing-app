const router = require("express").Router();
const prisma = require("../db/client");
const { authenticateToken } = require("../middleware/auth");

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

        return res.json({user});
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

module.exports = router;