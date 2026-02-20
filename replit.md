# CTRXLDrama Premium

## Overview
A premium streaming platform built with Next.js 16, featuring a corporate editorial UI design with flat aesthetics and an enhanced TikTok-style video player. The app aggregates drama content from multiple sources (DramaBox, ReelShort, NetShort, Melolo, FlickReels, FreeReels).

## Design Philosophy
- **Aesthetic**: Modern, premium streaming app style - smooth, refined, no "AI-template" looks
- **Color Palette**: Dark purple/violet theme with gradient accents (violet-500 to purple-600)
- **Typography**: Plus Jakarta Sans (all text) - clean and modern
- **Layout**: Card-based with 16px-24px rounded corners, smooth transitions
- **Effects**: Glass blur backgrounds, subtle gradients, smooth hover animations

## Project Architecture

### Tech Stack
- **Framework**: Next.js 16.1.6 with App Router (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom utility classes
- **UI Components**: Custom components with corporate design system
- **State Management**: Zustand + TanStack React Query
- **Backend Integration**: Supabase (authentication + database)
- **Video Player**: HLS.js for streaming with TikTok-style auto-scroll

### Directory Structure
```
src/
├── app/           # Next.js App Router pages
│   ├── chat/      # Community chat page
│   ├── favorites/ # Favorites/Library page
│   ├── history/   # Watch history page
│   ├── detail/    # Drama detail pages
│   ├── watch/     # Video player pages
│   └── login/     # Authentication pages
├── components/    # React components (UI + feature components)
├── contexts/      # React context providers
├── hooks/         # Custom React hooks (data fetching, utilities)
├── lib/           # Utility functions, API clients, Supabase config
├── styles/        # Global CSS with design system
└── types/         # TypeScript type definitions
```

### Key Components
- **Header** - Minimal header with CTRXL DRAMA branding
- **PlatformSelector** - Tab-based platform switching
- **BottomNav** - Mobile navigation bar
- **UnifiedMediaCard** - Grid-based drama cards
- **UniversalPlayer** - Unified video player for all providers (DramaBox-style UI)
- **TikTokPlayer** - Legacy vertical video player (deprecated, use UniversalPlayer)
- **FavoritesList** - Library management
- **WatchHistoryList** - Continue watching tracking

### Features
1. **Favorites/Watchlist** - Save dramas to favorites list
2. **Watch History** - Track watched episodes with resume playback
3. **Rating & Reviews** - Rate dramas with 1-5 stars and write reviews
4. **Comments** - Comment on dramas and episodes with replies
5. **Notifications** - Get notified when new episodes are released
6. **Share** - Share dramas to social media (WhatsApp, Telegram, Twitter)
7. **Trending** - View trending dramas based on views and favorites
8. **Recommendations** - Personalized recommendations based on watch history
9. **Community Chat** - Real-time chat for all users (view), registered users can send messages

### Database Schema
Tables in `supabase-features-schema.sql`:
- `favorites` - User favorite dramas
- `watch_history` - Watch progress tracking
- `ratings` - User ratings and reviews
- `comments` - Episode comments with replies
- `comment_likes` - Comment likes tracking
- `subscriptions` - Episode notification subscriptions
- `notifications` - User notifications
- `drama_stats` - Aggregated drama statistics

Tables in `supabase-chat-schema.sql`:
- `chat_messages` - Community chat messages with real-time sync

### Environment Variables
Required environment variables (stored in `.env.local`):
- `NEXT_PUBLIC_API_BASE_URL` - Drama API endpoint
- `NEXT_PUBLIC_CRYPTO_SECRET` - Encryption key for API
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Development

### Running Locally
The development server runs on port 5000:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

### Building for Production
```bash
npm run build
npm run start
```

### Cloudflare Deployment
The project is configured for Cloudflare Workers deployment using `@opennextjs/cloudflare`:

```bash
# Build for Cloudflare
npm run build:cloudflare

# Preview locally with Wrangler
npm run preview:cloudflare

# Deploy to Cloudflare Workers
npm run deploy:cloudflare
```

**Note:** 
- Uses `@opennextjs/cloudflare` (replaces deprecated `@cloudflare/next-on-pages`)
- Requires `nodejs_compat` flag and `compatibility_date >= 2024-09-23`
- Configuration in `wrangler.toml` and `open-next.config.ts`

## Recent Changes
- 2026-02-20: VIP/Premium Subscription System
  - Added VIP plan system with HD resolution gating
  - Free users locked to SD quality, VIP users get HD (720p+)
  - Lock icon on HD quality options in video player, clicking redirects to /upgrade
  - Upgrade page with 3-step flow: plan selection, payment, confirmation
  - Payment methods: QRIS, GoPay, DANA, Bank Transfer (admin configurable)
  - Manual payment approval by admin
  - Payment history for users
  - Admin VIP management (/admin/vip): plan CRUD, payment method CRUD, subscriber list
  - Admin payments page (/admin/payments): approve/reject payments with notes
  - VIP badge on profile page, upgrade prompt for non-VIP users
  - Uses separate Supabase database via pg for VIP tables
  - Database tables: vip_plans, vip_subscriptions, payment_methods, payment_requests
  - API routes: /api/vip/status, /api/vip/plans, /api/vip/payment-methods, /api/vip/subscribe, /api/vip/my-payments
  - Admin API routes: /api/admin/vip/plans, /api/admin/vip/methods, /api/admin/vip/payments, /api/admin/vip/subscribers
  - Security: Admin API routes verify adminId against users table (role=admin) before allowing operations
  - Auth helper: src/lib/auth-check.ts provides isAdminById() for server-side admin verification
- 2026-02-06: Performance Optimizations
  - Conditional data fetching: DramaBox API calls only fire when DramaBox platform is active
  - Dynamic imports (React.lazy) for platform-specific sections (ReelShort, NetShort, Melolo, FlickReels, FreeReels)
  - QueryClient optimized: gcTime 30min, exponential retry backoff, data persists longer in cache
  - Removed force-dynamic from home page for better static caching
  - Removed cache: 'no-store' from API fetcher to allow HTTP caching
  - Font loading optimized with next/font/google (Plus Jakarta Sans) instead of CSS @import
  - AdsDisplay lazy loaded with 3-second delay to prioritize content
  - Image optimization helper for .heic cover images via wsrv.nl
  - First 8 drama cards load eagerly, rest use lazy loading
- 2026-02-06: Removed VIP Membership System
  - Removed VIP page, admin VIP panel, VipBadge component, useVipStatus hook
  - Removed VIP link from Header and BottomNav navigation
  - Removed HD quality gating (all qualities now freely accessible)
  - Removed VIP badge from chat messages
  - Removed VIP-conditional ad skipping from AdsDisplay
  - All video quality options (including HD) now available to all users
- 2026-02-05: Unified Video Player across all providers
  - Created UniversalPlayer component with DramaBox-style UI
  - All providers now use the same player design (ReelShort, NetShort, Melolo, FlickReels, FreeReels)
  - Custom controls: play/pause, mute, quality selector, speed control, episode navigation
  - Episode list modal with grid layout
  - Description modal for drama info
  - Support for both HLS streams and direct MP4 URLs
  - Keyboard shortcuts (space, m, arrow up/down)
- 2026-02-05: Replaced Browse with Community Chat feature
  - Real-time chat using Supabase realtime subscriptions
  - All users can view messages
  - Only registered users can send messages
  - Delete own messages functionality
  - Time-ago display for message timestamps
- 2026-02-05: Complete UI redesign to modern premium streaming style
  - Updated color scheme to purple/violet with gradient accents
  - Changed typography to Plus Jakarta Sans for modern look
  - Added glass blur backgrounds and smooth rounded corners
  - Redesigned Header with logo from /public/logo.png
  - Redesigned BottomNav with floating pill style
  - Redesigned PlatformSelector with horizontal chip style
  - Enhanced drama cards with premium hover effects
  - Added description modal to TikTok Player (like popular drama apps)
  - Preserved auto-scroll functionality in video player
  - Created custom CSS utility classes (glass-card, platform-chip, etc.)
- 2026-02-04: Added new user engagement features
  - Favorites/Watchlist system
  - Watch history with resume playback
  - Rating & review system
  - Comments with replies
  - Social media sharing
  - Notification system for new episodes
  - Trending and recommendations sections
- 2026-02-04: Initial Replit setup
  - Configured Next.js to allow Replit dev origins
  - Set up development workflow on port 5000
