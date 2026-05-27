# Teddy Menafesha Ordering System

A complete Next.js + Prisma + PostgreSQL app for gojo/home based food and drink orders.

## Features

- 15 predefined gojo/homes
- Customer order page with gojo number, product, quantity, and custom text note
- Staff portal to receive orders with sound alerts
- Staff can update order status and set number of people per gojo
- End-of-day billing with seat price per person
- Product/order totals classified by item: tea, Coca-Cola, buna, etc.
- Admin dashboard to control totals per gojo/home
- Shared predefined username/password login for admin/staff

## Setup

```bash
npm install
cp .env.example .env
# edit DATABASE_URL in .env
npm run db:push
npm run db:seed
npm run dev
```

Open:

- Customer order page: http://localhost:3000
- Staff portal: http://localhost:3000/staff
- Admin dashboard: http://localhost:3000/admin
- Login: http://localhost:3000/login

## Local PostgreSQL example

Create database:

```bash
createdb teddy_menafesha
```

Then use this in `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/teddy_menafesha?schema=public"
```
"# teddy" 
