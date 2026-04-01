# Backend - SimpleSRM

This is the NestJS backend for the SimpleSRM application.

## Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

## Installation

Since the environment does not have Node.js installed, please install Node.js first.
Then run:

```bash
cd backend
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Database

This project uses Prisma with SQLite/PostgreSQL.

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```
