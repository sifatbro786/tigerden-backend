# 🐯 Tigerden Tourism — Backend API

Production-ready Node.js/Express/MongoDB backend for the Tigerden Tourism platform.

## Stack
- Node.js (ES Modules)
- Express.js
- MongoDB + Mongoose
- Cloudinary (media uploads via Multer)
- Nodemailer (Gmail App Password)
- JWT auth + bcrypt password hashing

## Setup

```bash
npm install
cp .env.example .env   # fill in your real values
npm run dev             # nodemon, for local development
npm start                # production
```

### Required .env values
See `.env.example`. Key ones:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `CLOUDINARY_*` — from your Cloudinary dashboard
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — a Gmail address + a **16-character App Password**
  (Google Account → Security → 2-Step Verification → App Passwords). Do NOT use your normal Gmail password.

## Folder Structure
```
config/        # db.js, cloudinary.js, multer.js
controllers/   # business logic per resource
models/        # Mongoose schemas
routes/        # public routes (+ routes/admin for protected CRUD)
middlewares/    # auth, admin, optionalAuth, error handler
services/      # loyaltyService, couponService, emailService
utils/         # ApiError, asyncHandler, generateToken
server.js
```

## Auth
- `POST /api/auth/register` — creates user, sends welcome email, returns JWT
- `POST /api/auth/login` — returns JWT
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`

Roles: `user` (default) and `admin`. To make a user an admin, update their `role` field directly in MongoDB (no public endpoint exposes this, by design).

## Public Endpoints
| Method | Route | Description |
|---|---|---|
| GET | /api/packages | List active packages (`?featured=true`, `?flashSale=true`) |
| GET | /api/packages/:id | Single package |
| GET | /api/blogs | List published blogs |
| GET | /api/blogs/:id | Single blog |
| GET | /api/testimonials | List approved testimonials |
| GET | /api/team | List team members |
| GET | /api/team/ceo-message | CEO/Founder message |
| POST | /api/coupons/apply | Validate + apply a coupon `{ code, price }`. If a Bearer token is sent, loyalty discount also stacks on top. |

## Admin Endpoints (require `Authorization: Bearer <admin-token>`)
All under `/api/admin/...`, full CRUD for:
- `/api/admin/packages` (multipart, field name `images`, up to 5 files)
- `/api/admin/blogs` (multipart, field name `image`)
- `/api/admin/team` (multipart, field name `image`)
- `/api/admin/testimonials` (multipart, field name `image`)
- `/api/admin/coupons` (JSON body, no file upload)

Multi-language fields (`title`, `description`, `content`, `review`) are sent as nested objects, e.g.:
```json
{
  "title": { "en": "Sundarbans Adventure", "bn": "সুন্দরবন অভিযান" },
  "description": { "en": "...", "bn": "..." },
  "price": 4999
}
```
When sending via `multipart/form-data` (because of file uploads), nested fields should be sent as `title[en]`, `title[bn]`, etc.

## Business Logic Notes
- **Flash Sale**: `isFlashSale: true` + `flashSaleEndTime` (future date). A virtual `isFlashSaleLive` is computed automatically.
- **Coupon validation** (`services/couponService.js`): checks existence, active flag, expiry, usage limit; computes percentage or flat discount, capped at the price.
- **Loyalty tiers** (`services/loyaltyService.js`): `new` → `regular` (>= `LOYALTY_BOOKING_THRESHOLD` bookings) → `premium` (>= 2x threshold), each tier granting an automatic discount percentage. Call `updateUserLoyalty(user, amountSpent)` after a booking is confirmed elsewhere in your system to update `totalBookings`/`totalSpent`/`loyaltyTier`.
- Coupon discount and loyalty discount stack: coupon is applied first, then loyalty discount is applied to the resulting price.

## Error Handling
All errors flow through a single `errorMiddleware`, which normalizes Mongoose validation errors, duplicate key errors, and invalid ObjectId errors into clean JSON responses with proper status codes.
