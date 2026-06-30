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
import pageMetaRoutes from "./routes/pageMetaRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// Protected admin route group (auth + admin middleware applied internally)
import adminRoutes from "./routes/admin/index.js";

dotenv.config();

// connectDB().then(() => seedSuperAdmin());
connectDB();

const app = express();

// ----- Global Middlewares -----
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://tigerden-frontend.vercel.app",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            console.log("Blocked origin:", origin);
            return callback(null, true);
        },
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- Health Check -----
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Tigerden Tourism API is running",
    });
});

// ----- Public Routes -----
app.use("/api/auth", authRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/page-meta", pageMetaRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/contact", contactRoutes);

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
