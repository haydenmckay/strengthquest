# StrengthQuest

Intelligent strength training tracking application built with Next.js, React, and TypeScript.

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.development.example` to `.env.development`
   - Fill in the required environment variables
   - For production, copy `.env.production.example` to `.env.production`

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Setup

The application uses different environment configurations for development and production:

- `.env.development` - Development environment variables (SQLite)
- `.env.production` - Production environment variables (PostgreSQL)

Required environment variables:
- `NEXT_PUBLIC_APP_URL` - Application URL
- `RESEND_API_KEY` - Resend API key for email
- `DATABASE_URL` - SQLite/PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT authentication

## Features

- Strength training workout tracking
- Progressive overload monitoring
- Warm-up set calculations
- Weight unit conversion (kg/lbs)
- User authentication
- Data persistence with SQLite/PostgreSQL
- Mobile-responsive design

## Tech Stack

- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- Prisma (ORM)
- SQLite (Development)
- PostgreSQL (Production)
- Resend for email

## Development Workflow

1. Create feature branch from `main`
2. Make changes and test locally
3. Create pull request
4. Review and merge to `main`
5. Automatic deployment to staging/production

## Database Schema

The application uses Prisma as the ORM with the following main models:
- User
- Exercise
- Workout
- WorkoutSet

To update the database schema:
1. Modify `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push`

## License

MIT
