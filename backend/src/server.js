require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

const prisma = require("./prisma/client");

app.get("/locations", async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { status: "APPROVED" },
      include: {
        owner: {
          select: { id: true, displayName: true }
        }
      }
    });

    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`));