const express = require("express");
const cors = require("cors");

const locationsRouter = require("./routes/locations.route");
const adminRouter = require("./routes/admin.route");
const authRouter = require("./routes/auth.route");
const meRouter = require("./routes/me.route");
const ownerRouter = require("./routes/owner.route");
const favoritesRouter = require("./routes/favorites.route");


const app = express();
app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/owner", ownerRouter);
app.use("/favorites", favoritesRouter);


app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/locations", locationsRouter);
app.use("/admin", adminRouter);

module.exports = app;