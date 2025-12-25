# DinoSprint

A modern multiplayer version of the classic Chrome Dino endless runner game. Compete globally, unlock skins, and climb the leaderboard in this free-to-play browser game.

## Short Description

DinoSprint is a web-based endless runner game inspired by Chrome's offline dinosaur game. It features single-player gameplay with persistent user profiles, a global leaderboard system, and a skin customization shop. Players can play as guests or create accounts to save progress, earn coins through gameplay, and unlock cosmetic skins. The game is built with React and TypeScript, using Supabase for backend services and authentication.

## Features

- **Single-Player Gameplay**: Classic Chrome Dino mechanics with jump and duck controls
- **Guest Mode**: Play without creating an account (session-based stats)
- **User Authentication**: Email/password, Google OAuth, and OTP-based login via Supabase
- **User Profiles**: Persistent profiles with stats (best distance, total matches, average distance)
- **Global Leaderboard**: All-time and weekly rankings
- **Skin System**: Purchase and equip cosmetic skins using coins earned from gameplay
- **Coin Economy**: Earn coins based on distance traveled in games
- **Shop Page**: Browse and purchase available skins
- **Profile Management**: View stats, change username, and manage skins
- **Sound Controls**: Toggle game sounds on/off
- **SEO Optimized**: Structured data (JSON-LD), meta tags, sitemap, and robots.txt
- **Responsive Design**: Desktop-optimized with mobile viewport support
- **Performance**: Code splitting, lazy loading, and optimized bundle sizes

## Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - UI component library

### Backend

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email, OAuth, OTP)
  - Row Level Security (RLS)
  - Realtime subscriptions (for multiplayer infrastructure)

### Libraries & Tools

- **@tanstack/react-query** - Data fetching and caching
- **lucide-react** - Icon library
- **sonner** - Toast notifications
- **zod** - Schema validation
- **Vercel Analytics** - Web analytics
- **Vercel Speed Insights** - Performance monitoring

### DevOps

- **Vercel** - Hosting and deployment
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript ESLint** - TypeScript linting

## Project Structure

```
Dino/
├── src/
│   ├── components/          # React components
│   │   ├── game/           # Game canvas and rendering
│   │   ├── layout/         # Layout components (Navigation, Layout)
│   │   └── ui/             # Reusable UI components (buttons, cards, dialogs)
│   ├── game/               # Game engine and logic
│   │   ├── engine/         # Core game engine (DinoEngine, collision detection)
│   │   ├── sprites/        # Sprite loading and skin configurations
│   │   └── DinoGameRenderer.ts
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication logic
│   │   ├── useGameCanvas.ts
│   │   └── useSound.ts
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/       # Supabase client and types
│   ├── pages/              # Page components
│   │   ├── landing/        # Landing page sections (FAQ, Why, etc.)
│   │   ├── AuthPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ShopPage.tsx
│   │   └── SkinsPage.tsx
│   ├── services/          # Business logic services
│   │   ├── profileService.ts
│   │   ├── lobbyService.ts
│   │   └── soundEngine.ts
│   ├── store/             # Zustand state store
│   │   └── gameStore.ts
│   ├── types/             # TypeScript type definitions
│   └── lib/               # Utility functions
├── supabase/
│   ├── migrations/        # Database migration files
│   └── functions/         # Edge functions (realtime-game)
├── public/                # Static assets (images, sprites)
├── scripts/               # Build scripts
│   └── inject-hero.js     # SEO injection script
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind configuration
└── package.json           # Dependencies and scripts
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Supabase account** (for database and authentication)
- **Git** (for cloning the repository)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Dino
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   - Copy `env-example` to `.env`
   - Fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

   - Create a new Supabase project
   - Run the migration files in `supabase/migrations/` in order:
     - `20251216150920_9902cb46-d8b8-4833-8a4d-5c314976b0be.sql`
     - `20251216154327_8fe51625-2501-4e11-b58d-54d6cc7b0f58.sql`
     - `20251216164137_c50a7fe9-e3a2-4017-9c1f-4a78736bd59f.sql`
     - `20251217000000_add_unique_user_id_constraint.sql`
     - `20251218000000_remove_skin_constraint.sql`
   - Configure authentication providers in Supabase dashboard (email, Google OAuth)

5. Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production (runs `inject-hero.js` post-build for SEO)
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

**Note**: Never commit `.env` files. The `env-example` file serves as a template.

## Screenshots / Demo

Screenshots and demo links can be added here. The live application is deployed at the production URL (configured in Vercel).

## Future Improvements / Roadmap

- **Multiplayer Mode**: Re-enable and complete multiplayer functionality (infrastructure exists but is currently disabled)
- **Achievement System**: Unlock achievements for milestones and special accomplishments
- **Daily Challenges**: Rotating daily challenges with bonus rewards
- **Tournament Mode**: Scheduled tournaments with special rewards
- **Social Features**: Friend system, private lobbies, and social sharing
- **Mobile Support**: Touch controls for mobile devices
- **Progressive Web App (PWA)**: Offline support and app-like experience
- **Additional Skins**: Expand skin collection with seasonal and themed options
- **Statistics Dashboard**: Detailed analytics and performance metrics
- **Replay System**: Save and replay game sessions
