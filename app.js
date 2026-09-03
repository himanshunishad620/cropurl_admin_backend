require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const qrRoutes = require("./routes/qrRoutes");
const app = express();
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL],
    credentials: true,
  }),
);

app.set("etag", false);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// app.get("/", async (req, res) => {
//   try {
//     await sendEmail("himanshunishad620@gmail.com");
//     res.send("Email");
//   } catch (error) {
//     res.send("Error");
//   }
// });

app.use("/auth", authRoutes);
app.use("/data", qrRoutes);

module.exports = { app };
