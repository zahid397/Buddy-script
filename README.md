# Buddy Script

A full social networking platform built with Next.js 14 (App Router) + TypeScript, converted from the provided `feed.html` / `login.html` / `registration.html` mockups. JWT auth, a paginated feed with text/image posts and reposts, likes/comments/two-level replies, friend requests, follows, blocking, direct messaging, a notification center, user profiles, and site-wide search — all backed by real API routes and a Postgres database, not decorative buttons. A clearly-labeled **Demo Mode** (see below) fills the app with fictional bot activity so it feels alive without needing real users.

## Tech stack

- **Framework**: Next.js 14 (App Router), TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT in an HTTP-only cookie, signed/verified with `jose` (works on both the Edge middleware runtime and Node API routes — `jsonwebtoken` can't run in Edge middleware). Google OAuth is a direct implementation of the standard authorization-code flow against Google's own endpoints (not Auth.js/NextAuth — see "Google OAuth" below for why), issuing the same session cookie as every other login path.
- **Images**: Cloudinary (upload + on-the-fly responsive transformations), `sharp` + `blurhash` for server-side blur placeholders
- **Styling**: the original `bootstrap.min.css` / `common.css` / `main.css` / `responsive.css` are loaded as-is (see "Styling approach" below) with Tailwind layered on top for net-new UI
- **State/data**: React Context for auth, TanStack React Query for all server data (optimistic updates on likes; short-interval polling for messages/typing/notifications/demo activity — see "Real-time approach")
- **Validation**: Zod, shared between client forms (`react-hook-form` + `@hookform/resolvers/zod`) and API routes
- **Testing**: Vitest with a deep-mocked Prisma client (see "Testing")

## Feature map

| Area | What's real |
|---|---|
| Auth | Register/login/logout, JWT httpOnly cookie, protected routes, optional Google OAuth, "Continue with Demo Account" |
| Feed | Text/image posts, cursor pagination, infinite scroll |
| Post privacy | Public / Friends-only / Only-me, enforced server-side on every read path (feed, profile, search) |
| Likes | Posts, comments, and replies — optimistic UI, "who liked" list |
| Comments & replies | Two-level (`Post → Comment → Reply`), with their own likes |
| Share | Creates a real repost (new `Post` row referencing the original) with its own like/comment/share counts |
| Mentions | `@FirstName LastName` in a post fires a real notification to that user |
| Friend requests | Send / accept / reject / cancel / unfriend, symmetric friendship rows, pending-requests panel |
| Follow | Independent of friendship — Follow/Following/Unfollow, live follower counts |
| Blocking | Blocks sever friendship/follow/pending-requests both ways and are enforced on messaging, friend requests, and suggestions |
| People You May Know | Ranked by mutual-friend count, shared interests, same location, and recent activity; Ignore persists; Add Friend / Message states update live |
| Events | Seeded events, real "Going" attendance with live attendee counts |
| Messaging | 1:1 direct messages, conversation list, unread badges, read receipts, typing indicator — including with demo bots (see Demo Mode) |
| Notifications | Real notification center (header dropdown + `/notifications` page), triggered by likes/comments/replies/friend requests/follows/messages/shares/mentions/event activity |
| Profiles | Cover + avatar photos, bio, friend/follower/following counts, edit-profile modal, per-user post feed |
| Search | Users, posts, and events — header live-search dropdown + full `/search` results page |
| Demo Mode | Fictional bot accounts generate background feed/social/messaging activity — see below |

## Demo Mode

**What it is**: with `DEMO_MODE=true`, 14 clearly-fictional persona accounts (`isDemoAccount: true`, `source: DEMO_BOT` — see `src/lib/demo/personas.ts`) exist in the database and a background "tick" simulates them using the app, so a fresh install doesn't feel like an empty room. This is disclosed here, in the login page copy, and in the `source`/`isDemoAccount` fields on every user record — nothing about it pretends these are real people.

**How the activity is generated** (`src/lib/demo/demo-engine.ts`): while `DEMO_MODE=true` and someone is signed in, a client hook (`src/hooks/useDemoSimulator.ts`) calls `POST /api/demo/tick` every 20 seconds. Each tick picks **one** weighted-random event (post 15%, like 20%, comment 15%, friend request 10%, friend-accept 10%, message 15%, message-reply 10%, event-attend 5%) and executes it atomically. There's no `setInterval` running on the server — Vercel is serverless, so nothing would keep it alive between requests. Idempotency: each tick's key is `${userId}:${Math.floor(Date.now()/20000)}`, stored in a unique `demoEventKey` column on whichever table the event writes to, so a duplicate/retried tick call can't create a duplicate event (the second attempt hits a Postgres unique-constraint violation, which is caught and treated as a no-op).

**Chat with a bot feels responsive** (1-2s "typing…", 3-8s reply) even though there's still no background job: `src/lib/demo/reply-engine.ts` computes the typing-start and reply-due timestamps *deterministically* from the message's own id (a hash, not a stored schedule), so every poll — whichever endpoint happens to be hit first, the thread GET or the typing GET — agrees on the same timing and materializes the reply exactly once. Replies come from a local template bank categorized by a simple keyword classifier (greeting/project/event/appreciation/follow-up/casual), never repeating the bot's immediately-previous reply. No external AI API is called.

**Demo login**: the login page shows exactly one of two buttons, decided server-side — never both, never a fake consent screen:
- If `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set: a real **"Continue with Google"** link to `/api/auth/google`.
- Otherwise (and only if `DEMO_MODE=true`): **"Continue with Demo Account"**, which calls `POST /api/auth/demo-login` and signs you in as one of the 5 named seed accounts (Dylan, Karim, Radovan, Maya, Alex — `source: USER, isDemoAccount: true`). This is explicitly *not* Google auth: no consent screen, no Google credentials touched or stored, and the button copy says so.

The 14 `DEMO_BOT` personas are never login targets themselves (blocked at the `/api/auth/login` route with a 403, since they only exist for the tick engine to act as).

**Resetting demo data**: `npm run demo:reset` (alias for `npm run demo:seed`) re-runs `src/lib/demo/seed-personas.ts`, which upserts the 14 personas and refreshes only the content they own (their own posts/comments/friendships/DMs-among-themselves/event RSVPs) — it never touches a real registered user's account or data, the same safety pattern as the main `npm run db:seed`. `POST /api/demo/reset` does the same thing over HTTP (also gated behind `DEMO_MODE`).

**Demo routes 404 when `DEMO_MODE` is false**: `/api/demo/tick`, `/api/demo/reset`, and `/api/auth/demo-login` all check `isDemoModeEnabled()` first and return a real 404 if it's off — not a silent no-op. `/api/demo/status` is the one deliberate exception (always 200, since it's what the client polls to decide whether to *start* polling tick at all).

## Real-time approach

"Real-time" here means **short-interval polling via React Query**, not WebSocket push — there's no persistent-connection infrastructure in a stock Next.js API-routes deployment, and wiring one up (Pusher/Ably/Supabase Realtime) means creating a third-party account with real credentials, which wasn't available for this build. In practice:

- An open chat thread polls for new messages every 3s, and for the other person's typing state every 2s (a `POST` "ping" on keystroke, checked by the peer's poll — in-memory on the server via `src/lib/typing.ts`, so it resets on redeploy and won't work across multiple server instances without a shared store).
- Unread message/notification badges poll every 5s; the conversation list, notification dropdown, and People You May Know poll every 8-15s.
- The demo tick itself polls every 20s (see "Demo Mode" above).

This feels real-time in normal use without needing any external service.

**Production migration path**: if this needed genuine push-based real-time (e.g. group chat at scale, or sub-second delivery), the natural next step is either (a) **Supabase Realtime** or **Pusher/Ably** for a managed WebSocket layer — swap the polling `useQuery`/`useEffect` intervals in `useMessages.ts`/`useNotifications.ts`/`useDemoSimulator.ts` for a subscription callback that calls the same `queryClient.invalidateQueries` — the React Query cache layer doesn't need to change, only how it's told to refetch; or (b) a small dedicated WebSocket server (e.g. on Fly.io/Railway, somewhere that supports long-lived connections, unlike Vercel serverless functions) that Next.js API routes publish to on mutation. Either way, `src/lib/typing.ts`'s in-memory store and the rate limiter would need to move to Redis/Upstash first, since they currently assume a single long-lived process.

## Styling approach

The provided CSS (`~9,000` lines across `common.css`/`main.css`/`responsive.css`) is a complete, working design system — including its own dark mode and one real responsive breakpoint at 991px. Rather than rewriting all of it into Tailwind, it's copied verbatim into `public/assets/` and loaded via `<link>` tags in the root layout, and the **original class names are used directly in the JSX** for the ported Login/Registration/Feed markup — this is what gives pixel fidelity to the mockups. Tailwind is installed with `preflight` disabled (so it can't fight the legacy resets) and is used for everything the mockup didn't provide: modals, likes lists, the image lightbox, loading skeletons, the BlurHash placeholder, the post-visibility selector, and the entire messaging/notifications/profile/search/People-You-May-Know UI.

## Scope notes (read before grading/demoing)

- **Post visibility**: `PUBLIC` (anyone logged in), `FRIENDS` (author + accepted friends only), `PRIVATE` (author only) — enforced in every query that reads posts (feed, a user's profile, search), not just at creation time.
- **Decorative chrome**: a handful of mockup widgets with no spec'd backend in *any* phase (Learning/Insights/Bookmarks/Gaming/Settings/Save-post/Help & Support in the left sidebar and profile dropdown, "Forgot password?") stay visual-only — clicking shows a toast instead of a dead link, rather than inventing an unscoped feature. Everything actually specced (messaging, friends, follow, blocking, events, notifications, mentions, profiles, search, People You May Know, posts/likes/comments/shares, Demo Mode, Google OAuth) is fully wired to real data.
- **Rate limiting** and the **typing-indicator signal** are in-memory on the server — fine for a single instance/demo, but wouldn't survive a multi-instance deployment or a restart. A real production deployment would swap these for Redis/Upstash (see "Real-time approach" above).
- **Comment/reply nesting** is exactly two levels (`Post → Comment → Reply`), matching the schema (`Reply.commentId`, no `parentReplyId`) — not an arbitrary-depth thread.
- **Messaging** is 1:1 only (no group chats). Any registered user can be messaged unless one has blocked the other.
- **Mentions** are basic: `@FirstName LastName` matched exactly (case-insensitive) against real users' names — not a full autocomplete/mention-picker UI.
- **Events** are read/attend only — there's no "create event" UI, since the spec only asked for the Going button to be functional, not event authoring.
- **"People You May Know" ranking** is a simple weighted score (mutual friends ×3, shared interests ×2, same location ×2, active in the last 7 days ×1) computed per-request — fine at this scale, would move to a precomputed/cached ranking for a large user base.
- **Multiple image sizes** are served via Cloudinary's on-the-fly transformation URLs (`w_150|600|1200,f_auto,q_auto`) rather than pre-generating fixed derivative files on upload.
- **Upload size on Vercel**: Route Handlers (unlike Server Actions) have no Next.js-imposed body size cap, but Vercel's serverless functions cap request bodies around 4.5MB. `MAX_UPLOAD_SIZE` defaults to 5MB for local dev — lower it (e.g. to 4MB) before deploying if you hit `413` errors on image uploads in production.
- **Google OAuth is a custom implementation, not NextAuth/Auth.js** — the app already had its own JWT-cookie session system from earlier phases; adding NextAuth alongside it would mean two parallel session mechanisms. See "Demo Mode" above and the "Google OAuth setup" section below.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:push              # creates tables from prisma/schema.prisma
npm run db:seed              # upserts 5 login-capable demo users + their posts/comments/replies/friendships/follows/events/messages
npm run demo:seed            # upserts 14 fictional DEMO_BOT personas for background activity (only needed if DEMO_MODE=true)
npm run dev
```

Both seed scripts only ever touch their own accounts (matched by email) — safe to re-run any time, never disturbs real accounts you register while testing.

Visit `http://localhost:3000`. With `DEMO_MODE=true` (the default in `.env.local`), click **Continue with Demo Account** on the login page, or log in with any seeded account directly:

| Email | Password |
|---|---|
| dylan@buddyscript.dev | Password123! |
| karim@buddyscript.dev | Password123! |
| radovan@buddyscript.dev | Password123! |
| maya@buddyscript.dev | Password123! |
| alex@buddyscript.dev | Password123! |

Dylan and Karim, and Dylan and Maya, are already friends in the seed data; Radovan → Dylan and Alex → Maya have pending friend requests — useful starting points for testing the friend-request UI without setting it up yourself. Once `npm run demo:seed` has run, try messaging one of the 14 fictional personas (e.g. via People You May Know, or search for "Priya") to see the typing/reply simulation.

### Environment variables

See `.env.example`. You need:

- `DATABASE_URL` — a Postgres connection string (Neon, Supabase, or local)
- `JWT_SECRET` — any random string ≥32 characters (`.env.local` already has one generated for local dev — replace it for production). This is also what signs Google-OAuth and demo-login sessions — there's a single session mechanism for every login path, so no separate `AUTH_SECRET` is needed.
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard (free tier is enough)
- `DEMO_MODE` — `"true"` to enable Demo Mode (bot activity + demo login button + demo API routes); `"false"` or unset disables all of it and those routes 404
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional, see "Google OAuth setup" below

**Note on the Prisma CLI**: `prisma db push`/`migrate`/`studio`/`seed` read `.env`, not `.env.local` (that's a Next.js-only convention) — this repo has both, kept in sync. If you change `DATABASE_URL`, update both files.

### Google OAuth setup

Optional — the app works fully without it (Demo Mode's "Continue with Demo Account" covers the same "try it without registering" need).

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type **Web application**.
2. Add an authorized redirect URI: `http://localhost:3000/api/auth/google/callback` for local dev, plus your production origin's equivalent once deployed.
3. Copy the generated Client ID and Client Secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env.local` (and your Vercel project settings for production).
4. Restart the dev server. The login/register pages will now show a real "Continue with Google" button instead of the demo one.

Signing in with Google links to an existing account by email if one already exists (standard OAuth account-linking) rather than creating a duplicate, and never overwrites that account's existing name/avatar.

## Project structure

```
prisma/schema.prisma          User (+source/isDemoAccount/location/interests), Post, Comment,
                               Reply, Like/CommentLike/ReplyLike, FriendRequest, Friendship,
                               Follow, Block, DismissedSuggestion, Event/EventAttendee,
                               Message, Notification
prisma/seed.ts                 5 login-capable demo accounts + their content
prisma/seed-demo.ts             thin CLI wrapper around src/lib/demo/seed-personas.ts
src/app/api/                  All REST endpoints (see below)
src/app/(auth)/                 /login, /register
src/app/(protected)/            /feed, /messages(/[userId]), /notifications, /profile/[userId], /search
                                 — guarded by a server-side cookie check + middleware.ts
src/components/                 layout/ (Header, sidebars, shell) · posts/ · comments/ ·
                                 messages/ · profile/ · auth/ (LoginForm/RegisterForm) ·
                                 common/ (FollowButton, FriendRequestButton, PeopleYouMayKnow,
                                 EventCard, NotificationItem, modals…)
src/hooks/                      usePosts, useComments, useFriends, useFollow, useEvents,
                                 useMessages, useNotifications, useProfile, useSearch, useAuth,
                                 useDemoSimulator…
src/lib/                        auth (jose), googleOAuth, prisma client, zod schemas,
                                 cloudinary, blurhash, mentions, social.ts (friendship/
                                 visibility/blocking helpers), notifications.ts, rate limiter,
                                 typing signal, testUtils/ (Prisma mock for tests)
src/lib/demo/                   config, demo-engine (tick + weighted event picker),
                                 reply-engine (deterministic typing/seen/reply), content
                                 (template banks), personas (the 14 fictional bios),
                                 seed-personas
public/assets/                  original css/js/images, copied verbatim
```

## API endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | rate-limited |
| POST | `/api/auth/login` | rate-limited; rejects `DEMO_BOT` accounts |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | |
| GET | `/api/auth/google` | redirects to Google's consent screen; 404 if not configured |
| GET | `/api/auth/google/callback` | exchanges code, links/creates account, signs session cookie |
| POST | `/api/auth/demo-login` | signs in as a random named demo account; 404 outside Demo Mode |
| GET/POST | `/api/posts` | cursor-paginated, 20/page, visibility-filtered; parses `@mentions` |
| GET/DELETE | `/api/posts/[postId]` | delete is author-only |
| POST/DELETE | `/api/posts/[postId]/like` | |
| GET | `/api/posts/[postId]/likes` | who-liked list |
| POST | `/api/posts/[postId]/share` | creates a repost |
| GET/POST | `/api/posts/[postId]/comments` | cursor-paginated |
| DELETE | `/api/comments/[commentId]` | author-only |
| GET/POST | `/api/comments/[commentId]/replies` | |
| POST/DELETE | `/api/comments/[commentId]/like` | |
| GET | `/api/comments/[commentId]/likes` | |
| DELETE | `/api/replies/[replyId]` | author-only |
| POST/DELETE | `/api/replies/[replyId]/like` | |
| GET | `/api/replies/[replyId]/likes` | |
| POST | `/api/upload` | multipart `file` field → Cloudinary URL + BlurHash |
| GET/POST | `/api/friend-requests` | `?type=incoming\|outgoing`; blocked-user check |
| POST | `/api/friend-requests/[id]/accept` | creates symmetric friendship |
| POST | `/api/friend-requests/[id]/reject` | also used to cancel your own outgoing request |
| GET | `/api/friends` | `?userId=` for someone else's list |
| DELETE | `/api/friends/[friendId]` | unfriend |
| POST/DELETE | `/api/follow/[userId]` | |
| GET | `/api/users/[userId]/followers` / `/following` | |
| GET | `/api/users/[userId]` | full profile DTO incl. friendship/follow status |
| PATCH | `/api/users/me` | edit own profile |
| GET | `/api/users/[userId]/posts` | a user's posts, visibility-filtered |
| GET | `/api/users/suggestions` | `?type=friends\|follow` — ranked People You May Know / follow suggestions |
| POST | `/api/users/suggestions/[userId]/dismiss` | persists "Ignore" |
| POST/DELETE | `/api/blocks/[userId]` | blocking also severs friendship/follow/pending requests |
| GET | `/api/blocks` | your block list |
| GET | `/api/events` | |
| POST/DELETE | `/api/events/[eventId]/attend` | Going toggle |
| GET | `/api/events/[eventId]/attendees` | |
| GET | `/api/conversations` | conversation list with unread counts |
| GET/POST | `/api/messages/[userId]` | thread with a user / send a message; materializes a due demo-bot reply on read; blocked-user check |
| POST | `/api/messages/[userId]/read` | mark thread read |
| GET/POST | `/api/messages/[userId]/typing` | poll / ping typing state; demo-bot typing simulated on poll |
| GET | `/api/messages/unread-count` | |
| GET | `/api/notifications` | cursor-paginated |
| POST | `/api/notifications/[id]/read` / `/read-all` | |
| GET | `/api/notifications/unread-count` | |
| GET | `/api/search` | `?q=&type=all\|users\|posts\|events` |
| GET | `/api/demo/status` | `{ enabled: boolean }` — always 200 |
| POST | `/api/demo/tick` | one weighted-random demo event; 404 outside Demo Mode, rate-limited |
| POST | `/api/demo/reset` | re-seeds demo personas' own content; 404 outside Demo Mode |

Every mutating route independently verifies the JWT cookie (`getAuthUserId` in `src/lib/auth.ts`) — `middleware.ts` only guards page navigation for redirect UX, it is not the security boundary.

## Testing

```bash
npm test          # runs the suite once
npm run test:watch
```

Vitest, unit-level, against a deep-mocked Prisma client (`src/lib/testUtils/prismaMock.ts`, via `vitest-mock-extended`) rather than a live test database — faster and flake-free for the logic being verified: suggestion exclusions, duplicate-request prevention, friendship creation, notification unread-count math, demo-tick idempotency, single-reply-only, seen-status timing, the seed script never touching real users, demo routes 404ing outside Demo Mode, and Google/demo login being provably independent code paths. A real integration suite against a disposable test database (e.g. a throwaway Neon branch per CI run) is the natural next step, not attempted here.

## Deployment (Vercel + Neon/Supabase + Cloudinary)

1. Push this repo to GitHub.
2. Create a Postgres database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) and copy its connection string.
3. Create a free [Cloudinary](https://cloudinary.com) account and copy your cloud name/API key/API secret.
4. Import the repo into [Vercel](https://vercel.com/new).
5. Add the environment variables from `.env.example` in the Vercel project settings (use a freshly generated `JWT_SECRET`, not the dev one in your local `.env.local`; set `DEMO_MODE` and the Google vars as you prefer for that deployment).
6. Deploy. The build script (`prisma generate && prisma migrate deploy && next build`) applies migrations automatically — run `npx prisma migrate dev --name init` locally first so a migration exists to deploy.
7. Optionally run `npm run db:seed` and `npm run demo:seed` against the production `DATABASE_URL` (locally, with `.env` pointed at prod) to load demo data.
8. If using Google OAuth, add `https://<your-domain>/api/auth/google/callback` as an authorized redirect URI in the Google Cloud Console.

## Security

- Passwords hashed with bcrypt (cost 12); `DEMO_BOT` accounts get an unusable random password and are blocked from login entirely
- JWT in an HTTP-only, `sameSite=lax`, `secure`-in-production cookie — the single session mechanism behind password login, Google OAuth, and demo login alike
- All input validated with Zod on the server (not just the client)
- Prisma parameterizes every query — no raw SQL
- User-generated content is rendered through React (auto-escaped) — no `dangerouslySetInnerHTML` anywhere
- Post/profile visibility rules and blocking are enforced server-side on every read/write path, not just hidden in the UI
- Demo tick is rate-limited per user; all `/api/demo/*` and `/api/auth/demo-login` routes 404 outside `DEMO_MODE`
- `next.config.js` sets a CORS allowlist for `/api/*` from `ALLOWED_ORIGINS` (empty by default — same-origin only, which is all this app needs)
- No secrets are ever sent to the browser — `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `DATABASE_URL`, and Cloudinary's API secret are read only in server-side route handlers and lib code

## Known limitations

- In-memory rate limiting and typing signal don't survive a restart or scale past one instance (see "Real-time approach" for the Redis/Upstash migration path)
- People You May Know ranking is computed per-request, not cached/precomputed — fine at demo scale
- Mentions require an exact "@FirstName LastName" match, no autocomplete
- No group messaging, no event creation UI, no password-reset flow — all explicitly out of scope, see "Scope notes"
- Unit tests mock Prisma rather than hitting a real database — see "Testing"

## What's not included

No live Vercel deployment, no Cloudinary/Google Cloud accounts, and no video walkthrough were created by the assistant — those require your own accounts/credentials or manual recording. Everything above is scaffolded, seeded, tested, and verified end-to-end (automated API checks, unit tests, and manual browser testing), ready for you to run through the deployment steps yourself.
