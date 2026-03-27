# Cypernetics Store

Cypernetics is a Next.js ecommerce project for prosthetics and robotics products with customer and admin experiences.

## Features

- Authentication with JWT (`register`, `login`, `logout`, `me`)
- Role-based access (`customer`, `admin`)
- Product catalog and product details
- Hybrid cart flow:
  - guest users: local cart (Zustand)
  - logged-in users: API cart (`/api/cart`)
  - local cart sync to API after login
- Checkout with shipping form validation
- Order creation, stock updates, and cart clear in transaction
- Thank-you page after submit (`/thanks`) with auto redirect to home in 5 seconds
- Customer account page with order history (`/account`)
- Admin dashboard and admin management pages:
  - `/admin`
  - `/admin/products`
  - `/admin/orders`
- Admin dark mode support

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Prisma 7
- SQLite (current schema/provider)
- Zustand + TanStack Query
- Tailwind CSS + shadcn/ui

## Project Structure

- `src/app` - pages and API routes
- `src/components` - UI and layout components
- `src/stores` - Zustand stores
- `src/lib` - auth, db, middleware, helpers
- `prisma` - schema, migrations, seed script
- `db` - local SQLite database

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Environment

Create `.env` in the project root:

```env
DATABASE_URL="file:./prisma/db/database.db"
JWT_SECRET="replace-with-a-strong-secret"
```

### 3) Generate Prisma client + apply migrations

```bash
npm run db:generate
npm run db:migrate
```

### 4) Seed database

```bash
npm run db:seed
```

Seed creates default users:

- Admin: `admin@prostheticstore.com` / `admin123`
- Customer: `customer@example.com` / `customer123`

### 5) Start app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run eslint
- `npm run db:generate` - Prisma client generation
- `npm run db:migrate` - run Prisma migrate dev
- `npm run db:migrate:deploy` - run migrations for production
- `npm run db:seed` - run seed script (`prisma/seed.js`)
- `npm run build:vercel` - generate + migrate deploy + seed + build

## Deploy on Vercel

> Important: this project currently uses SQLite. For real production on Vercel, a managed database (for example Postgres) is strongly recommended.

### A) Connect project to Vercel

1. Push repo to GitHub.
2. Import project in Vercel.

### B) Configure Environment Variables in Vercel

Set these in Project Settings → Environment Variables:

- `DATABASE_URL`
- `JWT_SECRET`

For SQLite demo usage, you can set:

```env
DATABASE_URL="file:./prisma/db/database.db"
```

But for persistent production data, use an external DB URL.

### C) Set Build Command (important for Prisma + seed)

In Vercel Project Settings → Build & Development Settings:

- Build Command:

```bash
npm run build:vercel
```

This runs:

1. `prisma generate`
2. `prisma migrate deploy`
3. `prisma db seed`
4. `next build`

### D) Deploy

Click Deploy in Vercel dashboard.

## Notes

- `prisma/seed.js` is idempotent for existing users/products (updates if found).
- `src/lib/db.js` uses Prisma adapter for better-sqlite3 and query logging.
- If you migrate to Postgres for Vercel production, update Prisma datasource/provider and DB adapter usage accordingly.
