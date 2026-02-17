const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db/client");

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const USERNAME_RE = /^[a-zA-Z0-9._]{3,30}$/;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const passNorm = String(password);
    const nameNorm = displayName == null ? null : String(displayName);

    if (!EMAIL_RE.test(emailNorm)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    if (passNorm.length < 8 ) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (nameNorm !== null && !USERNAME_RE.test(nameNorm)) {
      return res.status(400).json({ error: "Invalid display name" });
    }

    // Безпечне правило: реєстрація тільки USER/OWNER. ADMIN руками через БД.
    const safeRole = role === "OWNER" ? "OWNER" : "USER";

    const passwordHash = await bcrypt.hash(String(passNorm), 10);

    const user = await prisma.user.create({
      data: {
        email: emailNorm,
        passwordHash,
        displayName: nameNorm,
        role: safeRole,
      },
      select: { id: true, email: true, role: true, displayName: true },
    });

    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (e) {
    if (e.code === "P2002") {
      const target = e.meta?.target || [];
      
      if (target?.includes("email")) {
        return res.status(409).json({ error: "Email already taken" });
      }

      if (target?.includes("displayName")) {
        return res.status(409).json({ error: "Display name already taken" });
      }

      return res.status(409).json({ error: "Unique constraint failed" });

    } else {
      return res.status(500).json({ error: "Server error" });
    }
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);

    res.json({
      user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName },
      token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;