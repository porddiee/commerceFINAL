# SAIL - Surigao AI Intelligent Link

A modern marketplace platform built with Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, and Supabase.

## Features

- **User Authentication**: Email and Google OAuth via Supabase Auth
- **Role-Based Access Control**: User, Seller (verified), and Admin roles
- **Marketplace Features**: Browse listings, create listings, save items, messaging
- **Admin Dashboard**: Manage users, listings, categories, and reports
- **Modern UI**: Clean, responsive design with dark mode support
- **Real-time Updates**: Powered by Supabase Realtime

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase project set up

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Update the following variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

3. Run database migrations:
```bash
# Execute the SQL in supabase/schema.sql in your Supabase SQL Editor
# Then execute supabase/migration.sql for initial data
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **profiles**: User profiles extended from auth.users
- **categories**: Product categories
- **listings**: Product listings
- **messages**: User-to-user messages
- **reviews**: Product reviews
- **saved_listings**: User-saved listings
- **notifications**: User notifications

See `supabase/schema.sql` for the complete schema.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin pages
│   ├── dashboard/         # User dashboard pages
│   ├── auth/              # Authentication pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── sidebar.tsx       # Sidebar navigation
│   ├── header.tsx        # Header component
│   └── listing-card.tsx # Listing card component
├── lib/                  # Utility functions
│   ├── supabase/         # Supabase client configuration
│   ├── store/           # Zustand stores
│   └── utils.ts         # Utility functions
└── middleware.ts         # Next.js middleware
```

## Authentication

The app supports:
- Email/password authentication
- Google OAuth

Users are automatically created in the `profiles` table when they sign up via a database trigger.

## Role-Based Access Control

The system uses two roles:
- **user**: Default role for all new registrations. Users can browse listings, buy items, save listings, send messages, and receive notifications.
- **admin**: Full access to admin dashboard and platform management features.

### Seller Verification

Users can request seller verification through their settings page. The verification process:
1. User uploads a valid ID document in Settings
2. Status changes to 'pending'
3. Admin reviews the request in `/admin/verifications`
4. Admin can approve or reject with a reason
5. Approved users get `is_verified_seller = true` and can create listings

### Verification Status
- `none`: User has not requested verification
- `pending`: Verification request submitted, awaiting admin review
- `approved`: User is a verified seller
- `rejected`: Verification was rejected (includes rejection reason)

## Admin Setup

To create an admin user:

1. Create a user account through the UI
2. In Supabase SQL Editor, run the SQL from `supabase/admin-setup.sql`:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your_admin_email@example.com';
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables

Make sure to add these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## License

MIT
