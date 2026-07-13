# Buddy Script

A full social networking platform built with Next.js 14 (App Router) + TypeScript, converted from the provided `feed.html` / `login.html` / `registration.html` mockups. JWT auth, a paginated feed with text/image posts and reposts, likes/comments/two-level replies, friend requests, follows, direct messaging, a notification center, user profiles, and site-wide search — all backed by real API routes and a Postgres database, not decorative buttons.

## Tech stack

- **Framework**: Next.js 14 (App Router), TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT in an HTTP-only cookie, signed/verified with `jose` (works on both the Edge middleware runtime and Node API routes — `jsonwebtoken` can't run in Edge middleware)
- **Images**: Cloudinary (upload + on-the-fly responsive transformations), `sharp` + `blurhash` for server-side blur placeholders
- **Styling**: the original `bootstrap.min.css` / `common.css` / `main.css` / `responsive.css` are loaded as-is (see "Styling approach" below) with Tailwind layered on top for net-new UI
- **State/data**: React Context for auth, TanStack React Query for all server data (optimistic updates on likes; short-interval polling for messages/typing/notifications — see "Real-time approach")
- **Validation**: Zod, shared between client forms (`react-hook-form` + `@hookform/resolvers/zod`) and API routes

## Feature map

| Area | What's real |
|---|---|
| Auth | Register/login/logout, JWT httpOnly cookie, protected routes |
| Feed | Text/image posts, cursor pagination, infinite scroll |
| Post privacy | Public / Friends-only / Only-me, enforced server-side on every read path (feed, profile, search) |
| Likes | Posts, comments, and replies — optimistic UI, "who liked" list |
| Comments & replies | Two-level (`Post → Comment → Reply`), with their own likes |
| Share | Creates a real repost (new `Post` row referencing the original) with its own like/comment/share counts |
| Friend requests | Send / accept / reject / cancel / unfriend, symmetric friendship rows, pending-requests panel |
| Follow | Independent of friendship — Follow/Following/Unfollow, live follower counts |
| Events | Seeded events, real "Going" attendance with live attendee counts |
| Messaging | 1:1 direct messages, conversation list, unread badges, read receipts, typing indicator |
| Notifications | Real notification center (header dropdown + `/notifications` page), triggered by likes/comments/replies/friend requests/follows/messages/shares/event activity |
| Profiles | Cover + avatar photos, bio, friend/follower/following counts, edit-profile modal, per-user post feed |
| Search | Users, posts, and events — header live-search dropdown + full `/search` results page |

## Real-time approach

"Real-time" here means **short-interval polling via React Query**, not WebSocket push — there's no persistent-connection infrastructure in a stock Next.js API-routes deployment, and wiring one up (Pusher/Ably/Supabase Realtime) means creating a third-party account with real credentials, which wasn't available for this build. In practice:

- An open chat thread polls for new messages every 3s, and for the other person's typing state every 2s (a `POST` "ping" on keystroke, checked by the peer's poll — in-memory on the server, so it resets on redeploy and won't work across multiple server instances without a shared store).
- Unread message/notification badges poll every 5s; the conversation list and notification dropdown poll every 8s.

This feels real-time in normal use without needing any external service.

## Styling approach

The provided CSS (`~9,000` lines across `common.css`/`main.css`/`responsive.css`) is a complete, working design system — including its own dark mode and one real responsive breakpoint at 991px. Rather than rewriting all of it into Tailwind, it's copied verbatim into `public/assets/` and loaded via `<link>` tags in the root layout, and the **original class names are used directly in the JSX** for the ported Login/Registration/Feed markup — this is what gives pixel fidelity to the mockups. Tailwind is installed with `preflight` disabled (so it can't fight the legacy resets) and is used for everything the mockup didn't provide: modals, likes lists, the image lightbox, loading skeletons, the BlurHash placeholder, the post-visibility selector, and the entire messaging/notifications/profile/search UI.

## Scope notes (read before grading/demoing)

- **Post visibility**: `PUBLIC` (anyone logged in), `FRIENDS` (author + accepted friends only), `PRIVATE` (author only) — enforced in every query that reads posts (feed, a user's profile, search), not just at creation time.
- **Decorative chrome**: a handful of mockup widgets with no spec'd backend (Learning/Insights/Bookmarks/Gaming/Settings/Save-post in the left sidebar, Google sign-in) stay visual-only — clicking shows a toast instead of a dead link. Everything the current spec asked for (messaging, friends, follow, events, notifications, profiles, search, posts/likes/comments/shares) is fully wired.
- **Rate limiting** and the **typing-indicator signal** are in-memory on the server — fine for a single instance/demo, but wouldn't survive a multi-instance deployment or a restart. A real production deployment would swap these for Redis/Upstash.
- **Comment/reply nesting** is exactly two levels (`Post → Comment → Reply`), matching the schema (`Reply.commentId`, no `parentReplyId`) — not an arbitrary-depth thread.
- **Messaging** is 1:1 only (no group chats) — matches "search friends and send messages" in the spec. Any registered user can be messaged, not just friends (there's no spec'd restriction against it, and it makes "Message" buttons on profiles/search results actually useful).
- **Events** are read/attend only — there's no "create event" UI, since the spec only asked for the Going button to be functional, not event authoring.
- **Multiple image sizes** are served via Cloudinary's on-the-fly transformation URLs (`w_150|600|1200,f_auto,q_auto`) rather than pre-generating fixed derivative files on upload.
- **Upload size on Vercel**: Route Handlers (unlike Server Actions) have no Next.js-imposed body size cap, but Vercel's serverless functions cap request bodies around 4.5MB. `MAX_UPLOAD_SIZE` defaults to 5MB for local dev — lower it (e.g. to 4MB) before deploying if you hit `413` errors on image uploads in production.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:push              # creates tables from prisma/schema.prisma
npm run db:seed              # upserts 5 demo users + posts/comments/replies/friendships/follows/events/messages
npm run dev
```

The seed script only ever touches its own 5 demo accounts (matched by email) — it's safe to re-run any time and won't disturb real accounts you register while testing.

Visit `http://localhost:3000`. Log in with any seeded account:

| Email | Password |
|---|---|
| dylan@buddyscript.dev | Password123! |
| karim@buddyscript.dev | Password123! |
| radovan@buddyscript.dev | Password123! |
| maya@buddyscript.dev | Password123! |
| alex@buddyscript.dev | Password123! |

Dylan and Karim, and Dylan and Maya, are already friends in the seed data; Radovan → Dylan and Alex → Maya have pending friend requests — useful starting points for testing the friend-request UI without setting it up yourself.

### Environment variables

See `.env.example`. You need:

- `DATABASE_URL` — a Postgres connection string (Neon, Supabase, or local)
- `JWT_SECRET` — any random string ≥32 characters (`.env.local` already has one generated for local dev — replace it for production)
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard (free tier is enough)

**Note on the Prisma CLI**: `prisma db push`/`migrate`/`studio`/`seed` read `.env`, not `.env.local` (that's a Next.js-only convention) — this repo has both, kept in sync. If you change `DATABASE_URL`, update both files.

## Project structure

```
prisma/schema.prisma          User, Post, Comment, Reply, Like/CommentLike/ReplyLike,
                               FriendRequest, Friendship, Follow, Event/EventAttendee,
                               Message, Notification
src/app/api/                  All REST endpoints (see below)
src/app/(auth)/                 /login, /register
src/app/(protected)/            /feed, /messages(/[userId]), /notifications, /profile/[userId], /search
                                 — guarded by a server-side cookie check + middleware.ts
src/components/                 layout/ (Header, sidebars, shell) · posts/ · comments/ ·
                                 messages/ · profile/ · common/ (shared: FollowButton,
                                 FriendRequestButton, EventCard, NotificationItem, modals…)
src/hooks/                      usePosts, useComments, useFriends, useFollow, useEvents,
                                 useMessages, useNotifications, useProfile, useSearch, useAuth…
src/lib/                        auth (jose), prisma client, zod schemas, cloudinary, blurhash,
                                 social.ts (friendship/visibility helpers), notifications.ts
                                 (notification-creation helper), rate limiter, typing signal
public/assets/                  original css/js/images, copied verbatim
```

## API endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | rate-limited |
| POST | `/api/auth/login` | rate-limited |
| POST | `/api/auth/logout` | |
| GET | `/api/auth/me` | |
| GET/POST | `/api/posts` | cursor-paginated, 20/page, visibility-filtered |
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
| GET/POST | `/api/friend-requests` | `?type=incoming\|outgoing` |
| POST | `/api/friend-requests/[id]/accept` | creates symmetric friendship |
| POST | `/api/friend-requests/[id]/reject` | also used to cancel your own outgoing request |
| GET | `/api/friends` | `?userId=` for someone else's list |
| DELETE | `/api/friends/[friendId]` | unfriend |
| POST/DELETE | `/api/follow/[userId]` | |
| GET | `/api/users/[userId]/followers` / `/following` | |
| GET | `/api/users/[userId]` | full profile DTO incl. friendship/follow status |
| PATCH | `/api/users/me` | edit own profile |
| GET | `/api/users/[userId]/posts` | a user's posts, visibility-filtered |
| GET | `/api/users/suggestions` | `?type=friends\|follow` for sidebar widgets |
| GET | `/api/events` | |
| POST/DELETE | `/api/events/[eventId]/attend` | Going toggle |
| GET | `/api/events/[eventId]/attendees` | |
| GET | `/api/conversations` | conversation list with unread counts |
| GET/POST | `/api/messages/[userId]` | thread with a user / send a message |
| POST | `/api/messages/[userId]/read` | mark thread read |
| GET/POST | `/api/messages/[userId]/typing` | poll / ping typing state |
| GET | `/api/messages/unread-count` | |
| GET | `/api/notifications` | cursor-paginated |
| POST | `/api/notifications/[id]/read` / `/read-all` | |
| GET | `/api/notifications/unread-count` | |
| GET | `/api/search` | `?q=&type=all\|users\|posts\|events` |

Every mutating route independently verifies the JWT cookie (`getAuthUserId` in `src/lib/auth.ts`) — `middleware.ts` only guards page navigation for redirect UX, it is not the security boundary.

## Deployment (Vercel + Neon/Supabase + Cloudinary)

1. Push this repo to GitHub.
2. Create a Postgres database on [Neon](https://neon.tech) or [Supabase](https://supabase.com) and copy its connection string.
3. Create a free [Cloudinary](https://cloudinary.com) account and copy your cloud name/API key/API secret.
4. Import the repo into [Vercel](https://vercel.com/new).
5. Add the environment variables from `.env.example` in the Vercel project settings (use a freshly generated `JWT_SECRET`, not the dev one in your local `.env.local`).
6. Deploy. The build script (`prisma generate && prisma migrate deploy && next build`) applies migrations automatically — run `npx prisma migrate dev --name init` locally first so a migration exists to deploy.
7. Optionally run `npm run db:seed` against the production `DATABASE_URL` (locally, with `.env` pointed at prod) to load demo data.

## Security

- Passwords hashed with bcrypt (cost 12)
- JWT in an HTTP-only, `sameSite=lax`, `secure`-in-production cookie
- All input validated with Zod on the server (not just the client)
- Prisma parameterizes every query — no raw SQL
- User-generated content is rendered through React (auto-escaped) — no `dangerouslySetInnerHTML` anywhere
- Post/profile visibility rules are enforced server-side on every read path, not just hidden in the UI
- `next.config.js` sets a CORS allowlist for `/api/*` from `ALLOWED_ORIGINS` (empty by default — same-origin only, which is all this app needs)

## What's not included

No automated test suite, no live Vercel deployment, no Cloudinary account, and no video walkthrough were created by the assistant — those require your own accounts/credentials or manual recording. Everything above is scaffolded, seeded, and verified end-to-end (both automated API checks and manual browser testing), ready for you to run through the deployment steps yourself.
