
![Uploading image.png…]()




# Goodkind Café

A multi-page Next.js App Router café site with an editorial public storefront, responsive pickup cart, SQLite-backed order API, and a password-protected operations dashboard.

## Requirements

- Node.js 24 or newer (`node:sqlite` is built into Node 24).
- npm.

## Run locally

1. Copy `.env.example` to `.env.local`.
2. Set `ADMIN_PASSWORD` to a unique password.
3. Set `SESSION_SECRET` to a random value with at least 32 characters.
4. Run `npm install`, then `npm run dev`.
5. Open `http://localhost:3000`; the private admin dashboard is at `http://localhost:3000/gk-ops-9d3e`.

The database is created at `data/goodkind.sqlite` on first run. Seed menu products are inserted only when the products table is empty. Prices are stored as integer cents; order totals are recalculated on the server from the current catalog.

## Production

Run `npm run build`, then `npm start`. Use a Node.js host with a persistent writable disk, back up the `data` directory, and keep `.env` private. Admin sign-in stays disabled unless both environment secrets are set.

## Pages and API

- Public pages: `/`, `/menu`, `/about`, `/find-us`.
- Admin: `/gk-ops-9d3e`.
- Public API: `GET /api/products`, `POST /api/orders`.
- Admin API: `/api/admin/session`, `/api/admin/products`, `/api/admin/orders`.

Admin can create and edit products, archive them from the public menu, view pickup orders, and update order status. Archiving preserves old orders. The cart persists in the visitor's browser until an order is submitted.

The public design tokens and typography live in `src/design-system.css`; admin-only colors and layout live in `src/app/admin.css`. Public headings use Geltek when installed locally, with a Georgia fallback; body text uses an Arial system fallback. Admin typography remains system UI. Public images load directly from Unsplash with lazy loading below the fold, avoiding the Next.js image-optimization proxy on first render.
