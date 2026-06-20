import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

// Public route groups
import authRoutes from "./routes/authRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";

// Protected admin route group (auth + admin middleware applied internally)
import adminRoutes from "./routes/admin/index.js";

dotenv.config();
connectDB();

const app = express();

// ----- Global Middlewares -----
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- Health Check -----
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🐯 Tigersden Tourism API is running",
  });
});

// ----- Public Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/coupons", couponRoutes);

// ----- Admin (Protected) Routes -----
app.use("/api/admin", adminRoutes);

// ----- 404 Handler -----
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ----- Global Error Handler (must be last) -----
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
